const fixture = require('./fixtures/commercial/commercial-input-v117a.json');
const { createHash } = require('crypto');
const { CommercialOperationsService, MemoryCommercialOperationsStore } = require('../src/core/commercial');
const { MemoryInternalOperationsStore, PostgresInternalOperationsStore, WorkQueueService } = require('../src/core/work-queue');

const context = { actorId: 'founder-remediation', reason: 'verified_test_action', correlationId: 'r1-test' };
let evidenceSequence = 0;
const evidence = (binding, sourceType = 'manual_warehouse_report') => {
  const sourceReference = `safe-test-reference-${++evidenceSequence}`;
  return { ...binding, sourceType, sourceReference, actor: context.actorId, evidenceTimestamp: new Date().toISOString(), checksum: createHash('sha256').update(sourceReference).digest('hex'), verificationStatus: 'evidence_confirmed' };
};

const harness = async ({ workQueue = false, config = {} } = {}) => {
  const store = new MemoryCommercialOperationsStore();
  const internalStore = workQueue ? new MemoryInternalOperationsStore() : null;
  const workQueueService = internalStore ? new WorkQueueService({ store: internalStore, actionEngineService: {} }) : null;
  const service = new CommercialOperationsService({ store, workQueueService, config: { corneropsCommercialOperationsEnabled: true, corneropsCommercialInventoryEvidenceStaleAfterHours: 24, ...config } });
  await service.confirmInputPack(fixture, { confirmed: true }, context);
  const opportunity = (await service.createOpportunity({ opportunityId: 'opp-r1', accountId: 'demo-account-1', owner: context.actorId, source: 'test' }, context)).record;
  return { store, internalStore, service, opportunity };
};

const createOrder = async (service, opportunity, method = 'CASH_ON_DELIVERY') => {
  await service.createQuote({ quoteId: `quote-${method}`, accountId: opportunity.accountId, opportunityId: opportunity.opportunityId, currency: 'AED', shipping: 15, shippingSource: 'test_rate', lineItems: [{ skuId: 'demo-sku-tajin', quantity: 1, unitPrice: 20, priceSource: 'test_price' }] }, context);
  const quoteId = `quote-${method}`;
  await service.transitionQuote(quoteId, { status: 'READY_FOR_REVIEW' }, context);
  await service.transitionQuote(quoteId, { status: 'APPROVED_INTERNAL', approvalId: 'test', evidence: { approvalStatus: 'approved' } }, context);
  await service.exportQuote(quoteId, 'json', context);
  await service.transitionQuote(quoteId, { status: 'SENT_MANUALLY_CONFIRMED', sentAt: new Date().toISOString() }, context);
  const order = (await service.acceptQuote(quoteId, { paymentMethod: method }, context)).record;
  await service.transitionOrder(order.orderId, { status: 'ORDER_CONFIRMED' }, context);
  return order;
};

describe('CO-1.17A-R1 Work Queue reconciliation', () => {
  test('unrelated commercial conditions remain independently active and refresh without duplicates', async () => {
    const { service, internalStore } = await harness({ workQueue: true });
    const add = (entityType, entityId, conditionKind) => service.queue({ entityType, entityId, conditionKind, sourceFlow: conditionKind, actionType: `review_${conditionKind}`, idempotencyKey: `commercial:${conditionKind}:${entityId}`, title: conditionKind, evidence: { revision: 1 } }, context);
    await add('quote', 'Q-123', 'quote_review');
    await add('order', 'O-456', 'fulfillment_preparation');
    await add('exception', 'E-789', 'critical_exception');
    expect(internalStore.state.workItems).toHaveLength(3);
    expect(internalStore.state.workItems.every((item) => item.evidence.conditionActive)).toBe(true);
    await service.queue({ entityType: 'quote', entityId: 'Q-123', conditionKind: 'quote_review', sourceFlow: 'quote_review', actionType: 'review_quote_review', idempotencyKey: 'commercial:quote_review:Q-123', title: 'quote_review', evidence: { revision: 2 } }, context);
    expect(internalStore.state.workItems).toHaveLength(3);
    expect(internalStore.state.workItems.find((item) => item.idempotencyKey === 'commercial:quote_review:Q-123').evidence.revision).toBe(2);
    await service.workQueueService.resolveCommercial('commercial:critical_exception:E-789', context);
    expect(internalStore.state.workItems.find((item) => item.idempotencyKey === 'commercial:critical_exception:E-789').status).toBe('manually_completed');
    expect(internalStore.state.workItems.filter((item) => item.status !== 'manually_completed').every((item) => item.evidence.conditionActive)).toBe(true);
  });

  test('PostgreSQL synchronization receives the same stable source scopes', async () => {
    const calls = [];
    const postgresContractStore = Object.create(PostgresInternalOperationsStore.prototype);
    postgresContractStore.syncRecommendations = async (recommendations, ctx) => { calls.push({ recommendations, ctx }); return { scannedRecommendations: 1, createdWorkItems: 1, reusedWorkItems: 0, reopenedWorkItems: 0, skippedRecommendations: 0, errors: [], items: recommendations }; };
    const queue = new WorkQueueService({ store: postgresContractStore });
    await queue.syncCommercial([
      { sourceId: 'commercial_operations:quote:Q-1:quote_review', idempotencyKey: 'q', title: 'q', actionType: 'q' },
      { sourceId: 'commercial_operations:order:O-1:fulfillment', idempotencyKey: 'o', title: 'o', actionType: 'o' },
    ], context);
    expect(calls.map((call) => call.ctx.sourceId)).toEqual(['commercial_operations:quote:Q-1:quote_review', 'commercial_operations:order:O-1:fulfillment']);
    expect(PostgresInternalOperationsStore.prototype.syncRecommendationsWithClient.toString()).toContain('source_id=$3');
  });
});

describe('CO-1.17A-R1 Intermex fulfillment evidence', () => {
  test('roles and manual Intermex readiness are explicit', async () => {
    const { service, opportunity } = await harness();
    const order = await createOrder(service, opportunity);
    const item = (await service.createFulfillment(order.orderId, {}, context)).record;
    expect(item).toMatchObject({ status: 'READY_FOR_INTERMEX_HANDOFF', commercialOwner: { party: 'CornerMex' }, warehouseCustodian: { party: 'Intermex UAE', integrationMode: 'manual_evidence_only' }, carrierProvider: { truthStatus: 'unknown' } });
  });

  test.each(['PICKING', 'PACKED'])('%s cannot bypass Intermex confirmation', async (status) => {
    const { service, opportunity } = await harness();
    const order = await createOrder(service, opportunity);
    const fulfillment = (await service.createFulfillment(order.orderId, {}, context)).record;
    await expect(service.transitionFulfillment(fulfillment.fulfillmentId, { status, evidence: evidence({}) }, context)).rejects.toMatchObject({ code: 'COMMERCIAL_TRANSITION_INVALID' });
  });

  test.each(['INTERMEX_HANDOFF_CONFIRMED', 'ACCEPTED_BY_INTERMEX', 'PICKING', 'PACKED', 'HANDED_TO_CARRIER', 'DELIVERED', 'DELIVERY_FAILED'])('%s requires attributable evidence', async (target) => {
    const { service, store } = await harness();
    await store.create('fulfillment', 'f-evidence', { fulfillmentId: 'f-evidence', orderId: 'o-evidence', status: ({ INTERMEX_HANDOFF_CONFIRMED: 'INTERMEX_HANDOFF_PENDING', ACCEPTED_BY_INTERMEX: 'INTERMEX_HANDOFF_CONFIRMED', PICKING: 'READY_TO_PICK', PACKED: 'PICKING', HANDED_TO_CARRIER: 'PACKED', DELIVERED: 'IN_TRANSIT', DELIVERY_FAILED: 'IN_TRANSIT' })[target], intermexFulfillmentReference: 'unknown', carrierReference: 'unknown' }, context);
    await expect(service.transitionFulfillment('f-evidence', { status: target }, context)).rejects.toMatchObject({ code: 'FULFILLMENT_EXTERNAL_EVIDENCE_REQUIRED' });
  });
});

describe('CO-1.17A-R1 payment, shipping and inventory truth', () => {
  test('COD delivery evidence without collection does not settle the order', async () => {
    const { service, store, opportunity } = await harness();
    const order = await createOrder(service, opportunity);
    const fulfillment = (await service.createFulfillment(order.orderId, {}, context)).record;
    for (const status of ['INTERMEX_HANDOFF_PENDING', 'INTERMEX_HANDOFF_CONFIRMED', 'ACCEPTED_BY_INTERMEX', 'READY_TO_PICK', 'PICKING', 'PACKED', 'HANDED_TO_CARRIER', 'IN_TRANSIT', 'DELIVERED']) {
      const current = await store.get('fulfillment', fulfillment.fulfillmentId);
      await service.transitionFulfillment(fulfillment.fulfillmentId, { status, evidence: ['INTERMEX_HANDOFF_CONFIRMED', 'ACCEPTED_BY_INTERMEX', 'PICKING', 'PACKED', 'HANDED_TO_CARRIER', 'IN_TRANSIT', 'DELIVERED'].includes(status) ? evidence({ subjectType: 'fulfillment', subjectId: fulfillment.fulfillmentId, orderId: order.orderId, fulfillmentId: fulfillment.fulfillmentId, previousState: current.status, newState: status }) : undefined }, context);
    }
    expect((await store.get('order', order.orderId)).status).toBe('ORDER_CONFIRMED');
    expect((await service.summary()).cashCollected).toBe(0);
  });

  test('COD collection and discrepancies never settle; only full verified remittance settles', async () => {
    const { service, store, opportunity } = await harness();
    const order = await createOrder(service, opportunity);
    const base = { method: 'CASH_ON_DELIVERY', amount: 35, currency: 'AED', amountExpected: 35, amountCollected: 35, amountRemitted: 0 };
    await service.recordPayment(order.orderId, { ...base, paymentId: 'cod-lifecycle', status: 'COD_PENDING_COLLECTION' }, context);
    await service.recordPayment(order.orderId, { ...base, paymentId: 'cod-lifecycle', status: 'COD_COLLECTED_PENDING_REMITTANCE' }, context);
    expect((await store.get('order', order.orderId)).status).toBe('ORDER_CONFIRMED');
    await service.recordPayment(order.orderId, { ...base, paymentId: 'cod-lifecycle', status: 'COD_DISCREPANCY', amountRemitted: 20, discrepancyReason: 'partial_remittance' }, context);
    expect((await store.get('order', order.orderId)).status).toBe('ORDER_CONFIRMED');
    await service.recordPayment(order.orderId, { ...base, paymentId: 'cod-lifecycle', status: 'COD_REMITTANCE_PENDING_VERIFICATION', amountRemitted: 35 }, context);
    await service.recordPayment(order.orderId, { ...base, paymentId: 'cod-lifecycle', status: 'COD_REMITTED_CONFIRMED', amountRemitted: 35, previousState: 'COD_REMITTANCE_PENDING_VERIFICATION', evidence: evidence({ subjectType: 'payment', subjectId: `${order.orderId}:CASH_ON_DELIVERY:COD_REMITTED_CONFIRMED`, orderId: order.orderId, paymentMethod: 'CASH_ON_DELIVERY', previousState: 'COD_REMITTANCE_PENDING_VERIFICATION', newState: 'COD_REMITTED_CONFIRMED', amount: 35, currency: 'AED' }, 'carrier_remittance') }, context);
    expect((await store.get('order', order.orderId)).status).toBe('PAID');
    expect((await store.listTransitions({ entityType: 'payment', entityId: 'cod-lifecycle' })).map((item) => item.newState)).toEqual(['COD_PENDING_COLLECTION', 'COD_COLLECTED_PENDING_REMITTANCE', 'COD_DISCREPANCY', 'COD_REMITTANCE_PENDING_VERIFICATION']);
    expect((await service.list('payment')).some((item) => item.status === 'COD_REMITTED_CONFIRMED')).toBe(true);
  });

  test('bank receipt pending does not settle, verified settlement does', async () => {
    const { service, store, opportunity } = await harness();
    const order = await createOrder(service, opportunity, 'BANK_TRANSFER');
    await service.recordPayment(order.orderId, { paymentId: 'bank-lifecycle', method: 'BANK_TRANSFER', amount: 35, currency: 'AED', status: 'BANK_TRANSFER_PENDING_VERIFICATION' }, context);
    expect((await store.get('order', order.orderId)).status).toBe('ORDER_CONFIRMED');
    await service.recordPayment(order.orderId, { paymentId: 'bank-lifecycle', method: 'BANK_TRANSFER', amount: 35, currency: 'AED', status: 'BANK_TRANSFER_SETTLEMENT_CONFIRMED', previousState: 'BANK_TRANSFER_PENDING_VERIFICATION', evidence: evidence({ subjectType: 'payment', subjectId: `${order.orderId}:BANK_TRANSFER:BANK_TRANSFER_SETTLEMENT_CONFIRMED`, orderId: order.orderId, paymentMethod: 'BANK_TRANSFER', previousState: 'BANK_TRANSFER_PENDING_VERIFICATION', newState: 'BANK_TRANSFER_SETTLEMENT_CONFIRMED', amount: 35, currency: 'AED' }, 'bank_settlement') }, context);
    expect((await store.get('order', order.orderId)).status).toBe('PAID');
  });

  test('shipping is destination-aware, unknown by default and fallback is explicit', async () => {
    const { service } = await harness({ config: { corneropsCommercialShippingRatesAed: { dubai: 15 }, corneropsCommercialShippingConfigVersion: 'test-v1' } });
    expect(service.shippingRate({ destinationEmirate: 'Dubai' })).toMatchObject({ amount: 15, fallbackApplied: false });
    expect(service.shippingRate({ destinationEmirate: 'Sharjah' }).amount).toBe('unknown');
    expect(service.shippingRate({}).amount).toBe('unknown');
    const fallback = (await harness({ config: { corneropsCommercialShippingFallbackEnabled: true, corneropsCommercialShippingFallbackAed: 20 } })).service.shippingRate({ destinationEmirate: 'Ajman' });
    expect(fallback).toMatchObject({ amount: 20, fallbackApplied: true, source: 'explicit_configured_fallback' });
    expect(service.shippingRate({ destinationEmirate: 'Dubai', cod: true }).amount).toBe('unknown');
  });

  test('inventory timestamps distinguish unknown, stale, zero and reserved', async () => {
    const { service } = await harness();
    expect(service.inventoryEvidence({ status: 'REPORTED' }).status).toBe('CONFIRMATION_REQUIRED');
    expect(service.inventoryEvidence({ status: 'REPORTED', observedAt: '2020-01-01T00:00:00.000Z', quantity: 5 }).status).toBe('STALE');
    expect(service.inventoryEvidence({ status: 'REPORTED', observedAt: new Date().toISOString(), quantity: 0 })).toMatchObject({ status: 'REPORTED', quantity: 0 });
    expect(service.inventoryEvidence({ status: 'RESERVED', observedAt: new Date().toISOString(), quantity: 1 }).status).toBe('RESERVED');
    expect(() => service.inventoryEvidence({ status: 'REPORTED', observedAt: 'bad-date' })).toThrow(expect.objectContaining({ code: 'INVENTORY_TIMESTAMP_INVALID' }));
  });
});
