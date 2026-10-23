const { createHmac } = require('crypto');
const {
  MemoryShopifyWebhookReplayStore, ShopifyAdminReadClient,
  ShopifyOrderReadAdapter, ShopifyWebhookVerifier,
} = require('../src/core/commerce-os');

const profile = { tenantId: 'la-despensa-uae', currency: 'AED' };
const context = { actorId: 'shopify-sync', correlationId: 'sync-1' };
const graphOrder = (overrides = {}) => ({
  id: 'gid://shopify/Order/9001', legacyResourceId: '9001', name: '#1001', currencyCode: 'AED',
  createdAt: '2026-08-29T08:00:00Z', updatedAt: '2026-08-29T08:05:00Z', displayFinancialStatus: 'PAID',
  currentSubtotalPriceSet: { shopMoney: { amount: '100.00' } },
  currentTotalDiscountsSet: { shopMoney: { amount: '5.00' } },
  currentTotalTaxSet: { shopMoney: { amount: '5.00' } },
  currentTotalPriceSet: { shopMoney: { amount: '115.00' } },
  currentShippingPriceSet: { shopMoney: { amount: '15.00' } },
  shippingAddress: { countryCodeV2: 'AE', province: 'Dubai', company: 'Demo Restaurant' },
  customer: { id: 'gid://shopify/Customer/71', legacyResourceId: '71' },
  lineItems: { nodes: [{ id: 'gid://shopify/LineItem/81', legacyResourceId: '81', sku: 'OLIVE-1', title: 'Olives', quantity: 2, requiresShipping: true, originalUnitPriceSet: { shopMoney: { amount: '50.00' } } }], pageInfo: { hasNextPage: false } },
  ...overrides,
});
const webhookOrder = () => ({
  id: 9001, name: '#1001', currency: 'AED', created_at: '2026-08-29T08:00:00Z', updated_at: '2026-08-29T08:05:00Z',
  financial_status: 'paid', current_subtotal_price: '100.00', current_total_discounts: '5.00', current_total_tax: '5.00', current_total_price: '115.00',
  shipping_lines: [{ price: '15.00' }], shipping_address: { country_code: 'AE', province: 'Dubai', company: 'Demo Restaurant' },
  customer: { id: 71 }, line_items: [{ id: 81, sku: 'OLIVE-1', title: 'Olives', quantity: 2, price: '50.00' }],
});

describe('Commerce OS Shopify read-only connector', () => {
  test('uses the stable GraphQL read endpoint and incremental updated_at pagination', async () => {
    const http = { post: jest.fn()
      .mockResolvedValueOnce({ data: { data: { orders: { nodes: [graphOrder()], pageInfo: { hasNextPage: true, endCursor: 'next-1' } } } } })
      .mockResolvedValueOnce({ data: { data: { orders: { nodes: [graphOrder({ legacyResourceId: '9002', id: 'gid://shopify/Order/9002', updatedAt: '2026-08-29T09:00:00Z' })], pageInfo: { hasNextPage: false, endCursor: 'next-2' } } } } }) };
    const client = new ShopifyAdminReadClient({ shopDomain: 'demo.myshopify.com', accessToken: 'secret-token', http });
    const intakeService = { ingestDurable: jest.fn(async (order) => ({ record: { canonicalOrder: order } })) };
    const adapter = new ShopifyOrderReadAdapter({ client, intakeService, enabled: true });
    const result = await adapter.syncIncremental({ updatedAfter: '2026-08-29T07:00:00Z' }, profile, context);

    expect(result).toMatchObject({ pages: 2, processed: 2, checkpoint: '2026-08-29T09:00:00Z', externalWritesPerformed: false });
    expect(http.post).toHaveBeenCalledTimes(2);
    expect(http.post.mock.calls[0][0]).toBe('https://demo.myshopify.com/admin/api/2026-07/graphql.json');
    expect(http.post.mock.calls[0][1].query).toMatch(/^query /);
    expect(http.post.mock.calls[0][1].query).not.toMatch(/mutation/i);
    expect(http.post.mock.calls[0][1].variables.query).toBe("updated_at:>'2026-08-29T07:00:00.000Z'");
    expect(http.post.mock.calls[1][1].variables.after).toBe('next-1');
    expect(http.post.mock.calls[0][2].headers['X-Shopify-Access-Token']).toBe('secret-token');
    expect(JSON.stringify(result)).not.toContain('secret-token');
    expect(intakeService.ingestDurable.mock.calls[0][0].provenance).toEqual({ adapter: 'shopify_admin_read', simulated: false, rawPayloadStored: false });
  });

  test('kill switch prevents every Shopify network call', async () => {
    const client = { shopDomain: 'demo.myshopify.com', fetchOrdersPage: jest.fn(), health: jest.fn() };
    const adapter = new ShopifyOrderReadAdapter({ client, enabled: false });
    await expect(adapter.syncIncremental({ updatedAfter: '2026-08-29T07:00:00Z' }, profile, context)).rejects.toMatchObject({ code: 'SHOPIFY_CONNECTOR_DISABLED' });
    expect(await adapter.health()).toMatchObject({ healthy: true, state: 'disabled', externalWritesAllowed: false });
    expect(client.fetchOrdersPage).not.toHaveBeenCalled();
    expect(client.health).not.toHaveBeenCalled();
  });

  test('fails closed instead of silently truncating oversized line-item sets', async () => {
    const client = { shopDomain: 'demo.myshopify.com', fetchOrdersPage: jest.fn(async () => ({ orders: [graphOrder({ lineItems: { nodes: [], pageInfo: { hasNextPage: true } } })], pageInfo: { hasNextPage: false } })) };
    const adapter = new ShopifyOrderReadAdapter({ client, intakeService: { ingestDurable: jest.fn() }, enabled: true });
    await expect(adapter.syncIncremental({ updatedAfter: '2026-08-29T07:00:00Z' }, profile, context)).rejects.toMatchObject({ code: 'SHOPIFY_LINE_ITEMS_TRUNCATED' });
  });

  test('verifies raw-body HMAC, shop and topic before durable intake and rejects duplicate delivery', async () => {
    const secret = 'webhook-secret';
    const rawBody = Buffer.from(JSON.stringify(webhookOrder()));
    const headers = {
      'X-Shopify-Hmac-Sha256': createHmac('sha256', secret).update(rawBody).digest('base64'),
      'X-Shopify-Topic': 'orders/updated', 'X-Shopify-Shop-Domain': 'demo.myshopify.com',
      'X-Shopify-Webhook-Id': 'delivery-1', 'X-Shopify-Event-Id': 'event-1',
    };
    const verifier = new ShopifyWebhookVerifier({ secret, shopDomain: 'demo.myshopify.com', replayStore: new MemoryShopifyWebhookReplayStore() });
    const intakeService = { ingestDurable: jest.fn(async () => ({ assessment: { status: 'accepted' } })) };
    const adapter = new ShopifyOrderReadAdapter({ client: { shopDomain: 'demo.myshopify.com' }, intakeService, webhookVerifier: verifier, enabled: true, webhooksEnabled: true });

    expect(await adapter.receiveWebhook({ rawBody, headers }, profile, context)).toMatchObject({ processed: true, duplicate: false, externalWritesPerformed: false });
    expect(await adapter.receiveWebhook({ rawBody, headers }, profile, context)).toMatchObject({ processed: false, duplicate: true, externalWritesPerformed: false });
    expect(intakeService.ingestDurable).toHaveBeenCalledTimes(1);
    await expect(adapter.receiveWebhook({ rawBody, headers: { ...headers, 'X-Shopify-Hmac-Sha256': 'invalid' } }, profile, context)).rejects.toMatchObject({ code: 'SHOPIFY_WEBHOOK_HMAC_INVALID' });
  });

  test.each([
    [{ 'X-Shopify-Topic': 'orders/delete' }, 'SHOPIFY_WEBHOOK_TOPIC_NOT_ALLOWED'],
    [{ 'X-Shopify-Shop-Domain': 'attacker.myshopify.com' }, 'SHOPIFY_WEBHOOK_SHOP_MISMATCH'],
    [{ 'X-Shopify-Webhook-Id': '' }, 'SHOPIFY_WEBHOOK_ID_REQUIRED'],
  ])('fails closed on invalid verified webhook metadata', async (override, code) => {
    const secret = 'webhook-secret';
    const rawBody = Buffer.from(JSON.stringify(webhookOrder()));
    const headers = { 'X-Shopify-Hmac-Sha256': createHmac('sha256', secret).update(rawBody).digest('base64'), 'X-Shopify-Topic': 'orders/create', 'X-Shopify-Shop-Domain': 'demo.myshopify.com', 'X-Shopify-Webhook-Id': 'delivery-2', ...override };
    const verifier = new ShopifyWebhookVerifier({ secret, shopDomain: 'demo.myshopify.com' });
    expect(() => verifier.verify({ rawBody, headers })).toThrow(expect.objectContaining({ code }));
  });

  test('health failure is sanitized and never leaks the token', async () => {
    const http = { post: jest.fn().mockRejectedValue({ response: { status: 401, data: { token: 'secret-token' } } }) };
    const client = new ShopifyAdminReadClient({ shopDomain: 'demo.myshopify.com', accessToken: 'secret-token', http });
    const result = await client.health();
    expect(result).toMatchObject({ healthy: false, reason: 'SHOPIFY_READ_REQUEST_FAILED', mode: 'read_only' });
    expect(JSON.stringify(result)).not.toContain('secret-token');
  });
});
