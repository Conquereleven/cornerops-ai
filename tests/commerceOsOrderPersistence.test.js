const { CanonicalOrderIntakeService, PostgresCommerceOrderIntakeStore } = require('../src/core/commerce-os');
const { ShopifyOrderSimulatorAdapter } = require('../src/integrations/commerce/ShopifyOrderSimulatorAdapter');
const { PostgresInternalOperationsStore } = require('../src/core/work-queue');

const describePostgres = process.env.COMMERCE_OS_TEST_DATABASE_URL ? describe : describe.skip;
const tenantId = 'commerce-persistence-test';
const profile = { tenantId, currency: 'AED' };
const context = { actorId: 'commerce-persistence-test', correlationId: 'commerce-persistence-r1' };
const payload = (overrides = {}) => ({
  id: `pg-${process.pid}`, name: '#PG-1', currency: 'AED', created_at: '2026-08-28T20:00:00Z', updated_at: '2026-08-28T20:05:00Z',
  subtotal_price: '100.00', total_discounts: '5.00', total_tax: '5.00', total_price: '115.00', shipping_lines: [{ price: '15.00' }],
  shipping_address: { country_code: 'AE', province: 'Dubai' }, line_items: [{ id: 1, sku: 'SKU-1', title: 'Item', quantity: 1, price: '100.00' }], ...overrides,
});

describePostgres('Commerce OS PostgreSQL order intake', () => {
  let internalStore; let service; let adapter;
  beforeAll(() => {
    internalStore = new PostgresInternalOperationsStore({ connectionString: process.env.COMMERCE_OS_TEST_DATABASE_URL });
    service = new CanonicalOrderIntakeService({ store: new PostgresCommerceOrderIntakeStore({ internalStore }) });
    adapter = new ShopifyOrderSimulatorAdapter();
  });
  afterAll(() => internalStore.pool.end());

  test('persists create, replay, revision and audit events atomically', async () => {
    const first = adapter.normalize(payload(), { tenantId });
    const created = await service.ingestDurable(first, profile, context);
    const replay = await service.ingestDurable(first, profile, context);
    const revised = await service.ingestDurable(adapter.normalize(payload({ updated_at: '2026-08-28T21:00:00Z', financial_status: 'refunded' }), { tenantId }), profile, context);
    expect(created.record.revision).toBe(1);
    expect(replay.idempotentReplay).toBe(true);
    expect(revised.record.revision).toBe(2);
    const events = await internalStore.pool.query('select event_type from cornerops_internal.commerce_order_intake_events where order_intake_id=$1 order by id', [created.record.id]);
    expect(events.rows.map((row) => row.event_type)).toEqual(['order_intake_created', 'order_intake_idempotent_replay', 'order_intake_revised']);
    const audit = await internalStore.pool.query("select count(*)::int as count from cornerops_internal.audit_events where entity_id=$1 and entity_type='commerce_order_intake'", [created.record.id]);
    expect(audit.rows[0].count).toBe(3);
  });

  test('serializes concurrent first delivery into one create and one replay', async () => {
    const canonical = adapter.normalize(payload({ id: `concurrent-${process.pid}`, name: '#PG-CONCURRENT' }), { tenantId });
    const results = await Promise.all([
      service.ingestDurable(canonical, profile, { ...context, correlationId: 'concurrent-a' }),
      service.ingestDurable(canonical, profile, { ...context, correlationId: 'concurrent-b' }),
    ]);
    expect(results.filter((result) => result.idempotentReplay)).toHaveLength(1);
    expect(new Set(results.map((result) => result.record.id)).size).toBe(1);
    expect(results.every((result) => result.record.revision === 1)).toBe(true);
  });

  test('RLS isolates runtime reads by tenant and event ledger is immutable', async () => {
    const client = await internalStore.pool.connect();
    try {
      await client.query('begin');
      await client.query('set local role cornerops_internal_runtime');
      await client.query("select set_config('app.current_tenant_id',$1,true)", ['another-tenant']);
      const isolated = await client.query('select count(*)::int as count from cornerops_internal.commerce_order_intakes');
      expect(isolated.rows[0].count).toBe(0);
      await client.query('rollback');
    } finally { client.release(); }
    await expect(internalStore.pool.query('update cornerops_internal.commerce_order_intake_events set actor_id=\'other\''))
      .rejects.toMatchObject({ code: '42501' });
  });
});
