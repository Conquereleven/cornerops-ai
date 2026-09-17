const { commerceOsError } = require('../../core/commerce-os/commerceOsTypes');
const { ShopifyOrderSimulatorAdapter } = require('./ShopifyOrderSimulatorAdapter');

const money = (set) => set?.shopMoney?.amount ?? '0';
const legacyId = (value = {}) => value.legacyResourceId || String(value.id || '').split('/').pop();
const toWebhookShape = (order) => ({
  id: legacyId(order), name: order.name, currency: order.currencyCode,
  created_at: order.createdAt, updated_at: order.updatedAt,
  financial_status: String(order.displayFinancialStatus || 'unknown').toLowerCase(),
  current_subtotal_price: money(order.currentSubtotalPriceSet),
  current_total_discounts: money(order.currentTotalDiscountsSet),
  current_total_tax: money(order.currentTotalTaxSet),
  current_total_price: money(order.currentTotalPriceSet),
  shipping_lines: [{ price: money(order.currentShippingPriceSet) }],
  shipping_address: order.shippingAddress && { company: order.shippingAddress.company, country_code: order.shippingAddress.countryCodeV2, province: order.shippingAddress.province },
  customer: order.customer && { id: legacyId(order.customer) },
  line_items: (order.lineItems?.nodes || []).map((line) => ({
    id: legacyId(line), sku: line.sku, title: line.title, quantity: line.quantity,
    requires_shipping: line.requiresShipping, price: money(line.originalUnitPriceSet),
  })),
});

class ShopifyOrderReadAdapter {
  constructor({ client, intakeService, webhookVerifier, enabled = false, webhooksEnabled = false, maxPages = 100 } = {}) {
    this.client = client;
    this.intakeService = intakeService;
    this.webhookVerifier = webhookVerifier;
    this.enabled = enabled;
    this.webhooksEnabled = webhooksEnabled;
    this.maxPages = maxPages;
    this.normalizer = new ShopifyOrderSimulatorAdapter({
      shopDomain: client?.shopDomain,
      provenance: { adapter: 'shopify_admin_read', simulated: false, rawPayloadStored: false },
    });
  }
  status() {
    return { adapter: 'shopify', mode: 'read_only', enabled: this.enabled, webhooksEnabled: this.webhooksEnabled, externalWritesAllowed: false };
  }
  async health() {
    if (!this.enabled) return { healthy: true, state: 'disabled', ...this.status() };
    return { ...(await this.client.health()), ...this.status() };
  }
  async ingest(payload, profile, context) {
    const canonical = this.normalizer.normalize(payload, { tenantId: profile.tenantId });
    return this.intakeService.ingestDurable(canonical, profile, context);
  }
  async syncIncremental({ updatedAfter, pageSize = 100 } = {}, profile, context) {
    if (!this.enabled) throw commerceOsError('Shopify connector is disabled.', 'SHOPIFY_CONNECTOR_DISABLED');
    let cursor = null;
    let pages = 0;
    let latestUpdatedAt = updatedAfter;
    const results = [];
    do {
      if (pages >= this.maxPages) throw commerceOsError('Shopify sync page limit reached.', 'SHOPIFY_SYNC_PAGE_LIMIT');
      const page = await this.client.fetchOrdersPage({ updatedAfter, cursor, pageSize });
      for (const order of page.orders) {
        if (order.lineItems?.pageInfo?.hasNextPage) {
          throw commerceOsError('Shopify order line items exceed the safe page size.', 'SHOPIFY_LINE_ITEMS_TRUNCATED', { externalOrderId: legacyId(order) });
        }
        const result = await this.ingest(toWebhookShape(order), profile, context);
        results.push(result);
        if (Date.parse(order.updatedAt) > Date.parse(latestUpdatedAt)) latestUpdatedAt = order.updatedAt;
      }
      pages += 1;
      cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
      if (page.pageInfo.hasNextPage && !cursor) throw commerceOsError('Shopify returned an invalid pagination cursor.', 'SHOPIFY_SYNC_CURSOR_INVALID');
    } while (cursor);
    return { pages, processed: results.length, checkpoint: latestUpdatedAt, results, externalWritesPerformed: false };
  }
  async receiveWebhook(delivery, profile, context) {
    if (!this.enabled || !this.webhooksEnabled) throw commerceOsError('Shopify webhooks are disabled.', 'SHOPIFY_WEBHOOKS_DISABLED');
    const verified = this.webhookVerifier.verify(delivery);
    if (!verified.accepted) return { duplicate: true, processed: false, webhookId: verified.webhookId, externalWritesPerformed: false };
    let payload;
    try { payload = JSON.parse(verified.rawBody.toString('utf8')); } catch (_error) {
      throw commerceOsError('Shopify webhook JSON is invalid.', 'SHOPIFY_WEBHOOK_JSON_INVALID');
    }
    return { duplicate: false, processed: true, webhookId: verified.webhookId, result: await this.ingest(payload, profile, context), externalWritesPerformed: false };
  }
}

module.exports = { ShopifyOrderReadAdapter, toWebhookShape };
