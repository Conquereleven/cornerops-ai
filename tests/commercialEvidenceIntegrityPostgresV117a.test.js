const { createHash } = require('crypto');
const { CommercialOperationsService, PostgresCommercialOperationsStore } = require('../src/core/commercial');
const { PostgresInternalOperationsStore } = require('../src/core/work-queue');

const describePostgres = process.env.COMMERCIAL_TEST_DATABASE_URL ? describe : describe.skip;
const context = { actorId: 'founder-postgres-r3', reason: 'disposable_database_test', correlationId: 'r3-postgres' };

describePostgres('CO-1.17A-R3 disposable PostgreSQL evidence integrity', () => {
  let internalStore;
  let store;
  let service;
  const orderId = `pg-order-r3-${process.pid}`;
  beforeAll(async () => {
    internalStore = new PostgresInternalOperationsStore({ connectionString: process.env.COMMERCIAL_TEST_DATABASE_URL });
    store = new PostgresCommercialOperationsStore({ internalStore });
    service = new CommercialOperationsService({ store, config: { corneropsCommercialOperationsEnabled: true } });
    await store.create('order', orderId, { orderId, total: 100, currency: 'AED', paymentMethod: 'CASH_ON_DELIVERY', status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' }, context);
  });
  afterAll(async () => internalStore.pool.end());

  test('concurrent duplicate remittance creates one evidence fact and one payment', async () => {
    const reference = `pg-remittance-r3-${process.pid}`;
    const binding = { subjectType: 'payment', subjectId: `${orderId}:CASH_ON_DELIVERY:COD_REMITTED_CONFIRMED`, orderId, paymentMethod: 'CASH_ON_DELIVERY', previousState: 'UNRECORDED', newState: 'COD_REMITTED_CONFIRMED', amount: 100, currency: 'AED' };
    const input = (paymentId) => ({ paymentId, method: 'CASH_ON_DELIVERY', status: 'COD_REMITTED_CONFIRMED', amount: 100, currency: 'AED', amountExpected: 100, amountCollected: 100, amountRemitted: 100, evidence: { ...binding, sourceType: 'carrier_remittance', sourceReference: reference, evidenceUnitReference: 'transaction-1', evidenceTimestamp: new Date().toISOString(), checksum: createHash('sha256').update(reference).digest('hex') } });
    await Promise.all([service.recordPayment(orderId, input('caller-a'), context), service.recordPayment(orderId, input('caller-b'), context)]);
    expect((await store.listEvidence()).filter((item) => item.orderId === orderId)).toHaveLength(1);
    expect((await store.list('payment')).filter((item) => item.orderId === orderId && item.status === 'COD_REMITTED_CONFIRMED')).toHaveLength(1);
    expect((await store.list('payment')).filter((item) => item.orderId === orderId && item.status === 'COD_REMITTED_CONFIRMED').reduce((sum, item) => sum + item.amount, 0)).toBe(100);
  });

  test('evidence registry rejects update and delete mutations', async () => {
    await expect(internalStore.pool.query(`update cornerops_internal.commercial_evidence_registry set actor_id='other'`)).rejects.toMatchObject({ code: '42501' });
    await expect(internalStore.pool.query(`delete from cornerops_internal.commercial_evidence_registry`)).rejects.toMatchObject({ code: '42501' });
  });

  test('runtime role has select/insert but no update/delete/truncate privilege', async () => {
    const result = await internalStore.pool.query(`select
      has_table_privilege('cornerops_internal_runtime','cornerops_internal.commercial_evidence_registry','select') as can_select,
      has_table_privilege('cornerops_internal_runtime','cornerops_internal.commercial_evidence_registry','insert') as can_insert,
      has_table_privilege('cornerops_internal_runtime','cornerops_internal.commercial_evidence_registry','update') as can_update,
      has_table_privilege('cornerops_internal_runtime','cornerops_internal.commercial_evidence_registry','delete') as can_delete,
      has_table_privilege('cornerops_internal_runtime','cornerops_internal.commercial_evidence_registry','truncate') as can_truncate`);
    expect(result.rows[0]).toEqual({ can_select: true, can_insert: true, can_update: false, can_delete: false, can_truncate: false });
  });
});
