const { CanonicalOrderIntakeService } = require('../src/core/commerce-os');
const { ShopifyOrderSimulatorAdapter } = require('../src/integrations/commerce/ShopifyOrderSimulatorAdapter');

const profile = { tenantId: 'la-despensa-uae', currency: 'AED' };
const context = { actorId: 'commerce-os-test' };
const shopify = (overrides = {}) => ({
  id: 9001, name: '#1001', currency: 'AED', created_at: '2026-08-29T08:00:00Z', updated_at: '2026-08-29T08:05:00Z',
  financial_status: 'paid', subtotal_price: '100.00', total_discounts: '5.00', total_tax: '5.00', total_price: '115.00',
  shipping_lines: [{ price: '15.00' }], shipping_address: { country_code: 'AE', province: 'Dubai', company: 'Demo Restaurant' },
  customer: { id: 71 }, line_items: [{ id: 81, sku: 'SPANISH-OLIVE-1', title: 'Spanish olives', quantity: 2, price: '50.00', requires_shipping: true }],
  ...overrides,
});

describe('Commerce OS canonical order intake', () => {
  const adapter = new ShopifyOrderSimulatorAdapter({ shopDomain: 'demo.myshopify.com' });

  test('normalizes and accepts a complete Shopify order without side effects', () => {
    const service = new CanonicalOrderIntakeService();
    const canonical = adapter.normalize(shopify(), { tenantId: profile.tenantId });
    const result = service.ingest(canonical, profile, context);
    expect(result.assessment).toMatchObject({ status: 'accepted', externalWritesPerformed: false, paymentCapturePerformed: false, customerMessagesSent: false });
    expect(result.record).toMatchObject({ revision: 1, tenantId: profile.tenantId, externalOrderId: '9001' });
    expect(canonical.provenance).toEqual({ adapter: 'shopify_simulator', simulated: true, rawPayloadStored: false });
    expect(adapter.status()).toMatchObject({ networkAccess: false, externalWritesAllowed: false });
  });

  test('replays the same payload idempotently and accepts a newer source revision', () => {
    const service = new CanonicalOrderIntakeService();
    const first = adapter.normalize(shopify(), { tenantId: profile.tenantId });
    const created = service.ingest(first, profile, context);
    const replay = service.ingest(first, profile, context);
    const updated = adapter.normalize(shopify({ updated_at: '2026-08-29T09:00:00Z', financial_status: 'refunded' }), { tenantId: profile.tenantId });
    const revision = service.ingest(updated, profile, context);
    expect(replay.idempotentReplay).toBe(true);
    expect(replay.record.id).toBe(created.record.id);
    expect(revision).toMatchObject({ idempotentReplay: false, record: { revision: 2, id: created.record.id } });
  });

  test('rejects a conflicting stale source version', () => {
    const service = new CanonicalOrderIntakeService();
    service.ingest(adapter.normalize(shopify(), { tenantId: profile.tenantId }), profile, context);
    const stale = adapter.normalize(shopify({ updated_at: '2026-08-29T08:04:00Z', financial_status: 'refunded' }), { tenantId: profile.tenantId });
    const result = service.ingest(stale, profile, context);
    expect(result.assessment.status).toBe('rejected');
    expect(result.assessment.issues).toContainEqual(expect.objectContaining({ code: 'SOURCE_VERSION_CONFLICT' }));
    expect(result.record.revision).toBe(1);
  });

  test('routes missing SKU and inconsistent totals to approval', () => {
    const service = new CanonicalOrderIntakeService();
    const payload = shopify({ total_price: '120.00', line_items: [{ id: 81, sku: '', title: 'Unknown item', quantity: 1, price: '100.00' }] });
    const result = service.ingest(adapter.normalize(payload, { tenantId: profile.tenantId }), profile, context);
    expect(result.assessment.status).toBe('approval_required');
    expect(result.assessment.issues.map((item) => item.code)).toEqual(expect.arrayContaining(['SKU_REVIEW_REQUIRED', 'TOTAL_MISMATCH']));
  });

  test('separates configuration gaps from invalid orders', () => {
    const service = new CanonicalOrderIntakeService();
    const currencyGap = service.ingest(adapter.normalize(shopify({ currency: 'USD' }), { tenantId: profile.tenantId }), profile, context);
    expect(currencyGap.assessment.status).toBe('configuration_required');
    expect(() => adapter.normalize(shopify({ total_price: '12.345' }), { tenantId: profile.tenantId })).toThrow(expect.objectContaining({ code: 'SHOPIFY_MONEY_INVALID' }));
  });
});
