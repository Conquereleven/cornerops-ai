const { createHash } = require('crypto');
const {
  CommercialEvidenceIntegrityService, CommercialOperationsService, MemoryCommercialOperationsStore,
} = require('../src/core/commercial');

const actor = { actorId: 'founder-integrity', reason: 'integrity_test', correlationId: 'r3' };
const checksum = (value = 'document') => createHash('sha256').update(value).digest('hex');
const clock = new Date('2026-07-22T12:00:00.000Z');
const validator = () => new CommercialEvidenceIntegrityService({ clock: () => clock });
const binding = (overrides = {}) => ({
  subjectType: 'fulfillment', subjectId: 'ful-1', orderId: 'order-1', fulfillmentId: 'ful-1',
  previousState: 'PACKED', newState: 'HANDED_TO_CARRIER', ...overrides,
});
const evidence = (expected, overrides = {}) => ({
  ...expected, sourceType: 'carrier_manifest', sourceReference: 'manifest-001', evidenceUnitReference: 'row-1',
  evidenceTimestamp: '2026-07-22T11:59:00.000Z', checksum: checksum('manifest-001'), ...overrides,
});
const paymentBinding = (orderId = 'order-1', amount = 100, method = 'CASH_ON_DELIVERY', status = 'COD_REMITTED_CONFIRMED') => ({
  subjectType: 'payment', subjectId: `${orderId}:${method}:${status}`, orderId, paymentMethod: method,
  previousState: 'UNRECORDED', newState: status, amount, currency: 'AED',
});
const paymentEvidence = (expected, ref = 'remittance-001') => evidence(expected, {
  sourceType: expected.paymentMethod === 'BANK_TRANSFER' ? 'bank_statement' : 'carrier_remittance',
  sourceReference: ref, evidenceUnitReference: 'transaction-1', checksum: checksum(ref),
});

const paymentHarness = async ({ total = 100, method = 'CASH_ON_DELIVERY' } = {}) => {
  const store = new MemoryCommercialOperationsStore();
  await store.create('order', 'order-1', { orderId: 'order-1', total, currency: 'AED', paymentMethod: method, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' }, actor);
  const service = new CommercialOperationsService({ store, evidenceIntegrityService: validator(), config: { corneropsCommercialOperationsEnabled: true } });
  return { service, store };
};
const paymentInput = (overrides = {}) => {
  const amount = overrides.amount ?? 100;
  const method = overrides.method || 'CASH_ON_DELIVERY';
  const status = overrides.status || (method === 'BANK_TRANSFER' ? 'BANK_TRANSFER_SETTLEMENT_CONFIRMED' : 'COD_REMITTED_CONFIRMED');
  const expected = paymentBinding('order-1', amount, method, status);
  return {
    paymentId: overrides.paymentId || 'caller-selected-id', method, status, amount, currency: overrides.currency || 'AED',
    ...(method === 'CASH_ON_DELIVERY' ? { amountExpected: amount, amountCollected: amount, amountRemitted: amount } : {}),
    evidence: paymentEvidence(expected, overrides.reference || 'remittance-001'), ...overrides,
  };
};

describe('CO-1.17A-R3 canonical evidence validation', () => {
  test('accepts a canonical bound envelope', () => expect(validator().validate(evidence(binding()), binding(), actor.actorId)).toMatchObject({ checksum: checksum('manifest-001'), recordedAt: clock.toISOString() }));
  test('normalizes fingerprint identity deterministically', () => {
    const first = validator().validate(evidence(binding()), binding(), actor.actorId);
    const second = validator().validate(evidence(binding(), { sourceType: ' CARRIER_MANIFEST ', sourceReference: ' MANIFEST-001 ', checksum: checksum('manifest-001').toUpperCase() }), binding(), actor.actorId);
    expect(second.evidenceFingerprint).toBe(first.evidenceFingerprint);
  });
  test.each([
    ['subjectId', 'other'], ['orderId', 'other'], ['fulfillmentId', 'other'],
    ['previousState', 'PICKING'], ['newState', 'DELIVERED'],
  ])('rejects mismatched %s binding', (field, value) => {
    expect(() => validator().validate(evidence(binding(), { [field]: value }), binding(), actor.actorId)).toThrow(expect.objectContaining({ code: 'COMMERCIAL_EVIDENCE_BINDING_MISMATCH' }));
  });
  test('rejects missing source reference', () => expect(() => validator().validate(evidence(binding(), { sourceReference: '' }), binding(), actor.actorId)).toThrow(expect.objectContaining({ code: 'COMMERCIAL_EVIDENCE_SOURCE_REQUIRED' })));
  test.each(['bad', 'a'.repeat(63), 'g'.repeat(64)])('rejects malformed checksum %s', (value) => expect(() => validator().validate(evidence(binding(), { checksum: value }), binding(), actor.actorId)).toThrow(expect.objectContaining({ code: 'EVIDENCE_CHECKSUM_INVALID' })));
  test('rejects malformed timestamp', () => expect(() => validator().validate(evidence(binding(), { evidenceTimestamp: 'not-a-date' }), binding(), actor.actorId)).toThrow(expect.objectContaining({ code: 'EVIDENCE_TIMESTAMP_INVALID' })));
  test('rejects timestamp beyond five-minute tolerance', () => expect(() => validator().validate(evidence(binding(), { evidenceTimestamp: '2026-07-22T12:05:00.001Z' }), binding(), actor.actorId)).toThrow(expect.objectContaining({ code: 'EVIDENCE_TIMESTAMP_INVALID' })));
  test('accepts timestamp at five-minute boundary', () => expect(validator().validate(evidence(binding(), { evidenceTimestamp: '2026-07-22T12:05:00.000Z' }), binding(), actor.actorId).evidenceTimestamp).toBe('2026-07-22T12:05:00.000Z'));
  test('accepts an equivalent timezone-offset timestamp', () => expect(validator().validate(evidence(binding(), { evidenceTimestamp: '2026-07-22T15:00:00+03:00' }), binding(), actor.actorId).evidenceTimestamp).toBe('2026-07-22T12:00:00.000Z'));
  test('server recordedAt overrides client value', () => expect(validator().validate(evidence(binding(), { recordedAt: '2000-01-01T00:00:00Z' }), binding(), actor.actorId).recordedAt).toBe(clock.toISOString()));
  test('hostile source text remains bounded inert data', () => {
    const result = validator().validate(evidence(binding(), { sourceReference: '<script>drop table</script>' }), binding(), actor.actorId);
    expect(result.sourceReference).not.toContain('<script>'); expect(result).not.toHaveProperty('rawPayload');
  });
});

describe('CO-1.17A-R3 fulfillment anti-replay', () => {
  const fulfillmentHarness = async (id = 'ful-1', orderId = 'order-1') => {
    const store = new MemoryCommercialOperationsStore();
    await store.create('fulfillment', id, { fulfillmentId: id, orderId, status: 'PACKED', carrierReference: 'unknown', warehouseEvidenceReference: 'unknown', carrierEvidenceReference: 'unknown' }, actor);
    return { store, service: new CommercialOperationsService({ store, evidenceIntegrityService: validator(), config: { corneropsCommercialOperationsEnabled: true } }) };
  };
  test('exact same fulfillment assertion is an idempotent retry', async () => {
    const { service, store } = await fulfillmentHarness(); const proof = evidence(binding());
    await service.transitionFulfillment('ful-1', { status: 'HANDED_TO_CARRIER', reason: 'proof', evidence: proof }, actor);
    const again = await service.transitionFulfillment('ful-1', { status: 'HANDED_TO_CARRIER', reason: 'retry', evidence: proof }, actor);
    expect(again.status).toBe('HANDED_TO_CARRIER'); expect(await store.listEvidence()).toHaveLength(1);
  });
  test('same document cannot bind another order without a distinct unit', async () => {
    const shared = new MemoryCommercialOperationsStore();
    await shared.create('fulfillment', 'ful-1', { fulfillmentId: 'ful-1', orderId: 'order-1', status: 'PACKED' }, actor);
    await shared.create('fulfillment', 'ful-2', { fulfillmentId: 'ful-2', orderId: 'order-2', status: 'PACKED' }, actor);
    const service = new CommercialOperationsService({ store: shared, evidenceIntegrityService: validator(), config: { corneropsCommercialOperationsEnabled: true } });
    await service.transitionFulfillment('ful-1', { status: 'HANDED_TO_CARRIER', reason: 'proof', evidence: evidence(binding()) }, actor);
    await expect(service.transitionFulfillment('ful-2', { status: 'HANDED_TO_CARRIER', reason: 'replay', evidence: evidence(binding({ subjectId: 'ful-2', orderId: 'order-2', fulfillmentId: 'ful-2' })) }, actor)).rejects.toMatchObject({ code: 'COMMERCIAL_EVIDENCE_REPLAY_CONFLICT' });
  });
  test('distinct evidence unit permits a second document row', async () => {
    const { service, store } = await fulfillmentHarness();
    await service.transitionFulfillment('ful-1', { status: 'HANDED_TO_CARRIER', reason: 'proof', evidence: evidence(binding(), { evidenceUnitReference: 'row-2' }) }, actor);
    expect(await store.listEvidence()).toHaveLength(1);
  });
  test('same document with distinct units supports distinct orders', async () => {
    const store = new MemoryCommercialOperationsStore();
    await store.create('fulfillment', 'ful-1', { fulfillmentId: 'ful-1', orderId: 'order-1', status: 'PACKED' }, actor);
    await store.create('fulfillment', 'ful-2', { fulfillmentId: 'ful-2', orderId: 'order-2', status: 'PACKED' }, actor);
    const service = new CommercialOperationsService({ store, evidenceIntegrityService: validator(), config: { corneropsCommercialOperationsEnabled: true } });
    await service.transitionFulfillment('ful-1', { status: 'HANDED_TO_CARRIER', evidence: evidence(binding(), { evidenceUnitReference: 'row-1' }) }, actor);
    await service.transitionFulfillment('ful-2', { status: 'HANDED_TO_CARRIER', evidence: evidence(binding({ subjectId: 'ful-2', orderId: 'order-2', fulfillmentId: 'ful-2' }), { evidenceUnitReference: 'row-2' }) }, actor);
    expect(await store.listEvidence()).toHaveLength(2);
  });
  test('same evidence cannot assert a different state', async () => {
    const { service } = await fulfillmentHarness();
    await service.transitionFulfillment('ful-1', { status: 'HANDED_TO_CARRIER', evidence: evidence(binding()) }, actor);
    await expect(service.transitionFulfillment('ful-1', { status: 'IN_TRANSIT', evidence: evidence(binding({ previousState: 'HANDED_TO_CARRIER', newState: 'IN_TRANSIT' })) }, actor)).rejects.toMatchObject({ code: 'COMMERCIAL_EVIDENCE_REPLAY_CONFLICT' });
  });
  test('replay conflict materializes a critical exception', async () => {
    const store = new MemoryCommercialOperationsStore();
    await store.create('fulfillment', 'ful-1', { fulfillmentId: 'ful-1', orderId: 'order-1', status: 'PACKED' }, actor);
    await store.create('fulfillment', 'ful-2', { fulfillmentId: 'ful-2', orderId: 'order-2', status: 'PACKED' }, actor);
    const service = new CommercialOperationsService({ store, evidenceIntegrityService: validator(), config: { corneropsCommercialOperationsEnabled: true } });
    await service.transitionFulfillment('ful-1', { status: 'HANDED_TO_CARRIER', evidence: evidence(binding()) }, actor);
    await expect(service.transitionFulfillment('ful-2', { status: 'HANDED_TO_CARRIER', evidence: evidence(binding({ subjectId: 'ful-2', orderId: 'order-2', fulfillmentId: 'ful-2' })) }, actor)).rejects.toBeDefined();
    expect((await service.list('exception')).some((item) => item.type === 'EVIDENCE_REPLAY_CONFLICT' && item.severity === 'critical')).toBe(true);
  });
});

describe('CO-1.17A-R3 economic idempotency', () => {
  test('same COD remittance under different paymentId counts once', async () => {
    const { service } = await paymentHarness(); const first = await service.recordPayment('order-1', paymentInput({ paymentId: 'a' }), actor); const second = await service.recordPayment('order-1', paymentInput({ paymentId: 'b' }), actor);
    expect(second.idempotentRetry).toBe(true); expect(first.record.paymentId).toBe(second.record.paymentId); expect((await service.summary()).cashCollected).toBe(100);
  });
  test('same bank remittance under different paymentId counts once', async () => {
    const { service } = await paymentHarness({ method: 'BANK_TRANSFER' });
    await service.recordPayment('order-1', paymentInput({ method: 'BANK_TRANSFER', paymentId: 'a', reference: 'bank-1' }), actor);
    await service.recordPayment('order-1', paymentInput({ method: 'BANK_TRANSFER', paymentId: 'b', reference: 'bank-1' }), actor);
    expect((await service.summary()).cashCollected).toBe(100);
  });
  test('same bank settlement cannot settle another order', async () => {
    const store = new MemoryCommercialOperationsStore();
    await store.create('order', 'order-1', { orderId: 'order-1', total: 100, currency: 'AED', paymentMethod: 'BANK_TRANSFER', status: 'PAYMENT_PENDING' }, actor);
    await store.create('order', 'order-2', { orderId: 'order-2', total: 100, currency: 'AED', paymentMethod: 'BANK_TRANSFER', status: 'PAYMENT_PENDING' }, actor);
    const service = new CommercialOperationsService({ store, evidenceIntegrityService: validator(), config: { corneropsCommercialOperationsEnabled: true } });
    await service.recordPayment('order-1', paymentInput({ method: 'BANK_TRANSFER', reference: 'bank-shared' }), actor);
    const second = paymentInput({ method: 'BANK_TRANSFER', reference: 'bank-shared' });
    second.evidence = paymentEvidence(paymentBinding('order-2', 100, 'BANK_TRANSFER', 'BANK_TRANSFER_SETTLEMENT_CONFIRMED'), 'bank-shared');
    await expect(service.recordPayment('order-2', second, actor)).rejects.toMatchObject({ code: 'COMMERCIAL_EVIDENCE_REPLAY_CONFLICT' });
  });
  test('bank receipt remains distinct from verified settlement', async () => {
    const { service } = await paymentHarness({ method: 'BANK_TRANSFER' });
    await service.recordPayment('order-1', { paymentId: 'receipt', method: 'BANK_TRANSFER', amount: 100, currency: 'AED', status: 'BANK_TRANSFER_PENDING_VERIFICATION' }, actor);
    await service.recordPayment('order-1', paymentInput({ method: 'BANK_TRANSFER', reference: 'verified-bank' }), actor);
    expect(await service.list('payment')).toHaveLength(2);
  });
  test('two distinct partial remittances sum exactly', async () => {
    const { service } = await paymentHarness();
    await service.recordPayment('order-1', paymentInput({ amount: 40, reference: 'part-1' }), actor);
    await service.recordPayment('order-1', paymentInput({ amount: 60, reference: 'part-2' }), actor);
    expect((await service.summary()).cashCollected).toBe(100);
  });
  test('same fingerprint with changed amount fails closed', async () => {
    const { service } = await paymentHarness();
    await service.recordPayment('order-1', paymentInput({ amount: 40, reference: 'same' }), actor);
    await expect(service.recordPayment('order-1', paymentInput({ amount: 50, reference: 'same' }), actor)).rejects.toMatchObject({ code: 'COMMERCIAL_EVIDENCE_REPLAY_CONFLICT' });
  });
  test('same COD remittance cannot settle another order', async () => {
    const store = new MemoryCommercialOperationsStore();
    for (const orderId of ['order-1', 'order-2']) await store.create('order', orderId, { orderId, total: 100, currency: 'AED', paymentMethod: 'CASH_ON_DELIVERY', status: 'PAYMENT_PENDING' }, actor);
    const service = new CommercialOperationsService({ store, evidenceIntegrityService: validator(), config: { corneropsCommercialOperationsEnabled: true } });
    await service.recordPayment('order-1', paymentInput({ reference: 'cod-shared' }), actor);
    const second = paymentInput({ reference: 'cod-shared' });
    second.evidence = paymentEvidence(paymentBinding('order-2'), 'cod-shared');
    await expect(service.recordPayment('order-2', second, actor)).rejects.toMatchObject({ code: 'COMMERCIAL_EVIDENCE_REPLAY_CONFLICT' });
  });
  test.each([0, -1, NaN, Infinity])('rejects invalid amount %s', async (amount) => {
    const { service } = await paymentHarness(); await expect(service.recordPayment('order-1', paymentInput({ amount }), actor)).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_INVALID' });
  });
  test('rejects more than two decimal places', async () => {
    const { service } = await paymentHarness(); await expect(service.recordPayment('order-1', paymentInput({ amount: 1.001 }), actor)).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_PRECISION_INVALID' });
  });
  test('currency mismatch creates no cash', async () => {
    const { service } = await paymentHarness(); await expect(service.recordPayment('order-1', paymentInput({ currency: 'USD' }), actor)).rejects.toMatchObject({ code: 'PAYMENT_CURRENCY_MISMATCH' }); expect((await service.summary()).cashCollected).toBe(0);
  });
  test('overpayment becomes discrepancy and does not inflate cash', async () => {
    const { service } = await paymentHarness({ total: 90 }); const result = await service.recordPayment('order-1', paymentInput({ amount: 100 }), actor);
    expect(result.record).toMatchObject({ status: 'COD_DISCREPANCY', overpaymentAmount: 10 }); expect((await service.summary()).cashCollected).toBe(0);
    expect((await service.list('exception')).some((item) => item.type === 'PAYMENT_OVERPAYMENT')).toBe(true);
  });
  test('settlement evidence never exposes capture or external send', async () => {
    const { service } = await paymentHarness(); const result = await service.recordPayment('order-1', paymentInput(), actor);
    expect(result.record.capturePerformed).toBe(false); expect(result.record.sensitiveFinancialDataStored).toBe(false);
  });
  test('integrity blocker prevents reconciled Daily Close', async () => {
    const { service } = await paymentHarness({ total: 90 }); await service.recordPayment('order-1', paymentInput({ amount: 100 }), actor);
    await expect(service.dailyClose({ closeStatus: 'CLOSED' }, actor)).rejects.toMatchObject({ code: 'DAILY_CLOSE_CRITICAL_EXCEPTION' });
  });
});
