const fs = require('fs');
const path = require('path');
const fixture = require('./fixtures/commercial/commercial-input-v117a.json');
const {
  CommercialInputPackService, CommercialOperationsService, MemoryCommercialOperationsStore,
} = require('../src/core/commercial');
const { ApprovalEngineService, MemoryInternalOperationsStore, WorkQueueService } = require('../src/core/work-queue');

const context = { actorId: 'founder-test', reason: 'test', evidence: { approved: true }, correlationId: 'commercial-test' };
const make = async () => {
  const store = new MemoryCommercialOperationsStore();
  const service = new CommercialOperationsService({ store, config: { corneropsCommercialOperationsEnabled: true } });
  await service.confirmInputPack(fixture, { confirmed: true, source: 'test_fixture' }, context);
  const opportunity = (await service.createOpportunity({ opportunityId: 'opp-1', accountId: 'demo-account-1', owner: 'founder-test', source: 'test', currency: 'AED' }, context)).record;
  return { service, store, opportunity };
};
const quoteInput = (opportunity, overrides = {}) => ({
  quoteId: overrides.quoteId || 'quote-1', accountId: opportunity.accountId,
  opportunityId: opportunity.opportunityId, currency: 'AED', shipping: 15, shippingSource: 'founder_approved_shipping',
  lineItems: [{ skuId: 'demo-sku-tajin', quantity: 2, unitPrice: 10, priceSource: 'founder_approved_price', ...overrides.line }],
  ...overrides,
});
const approvedQuote = async (service, opportunity, quoteId = 'quote-approved') => {
  await service.createQuote(quoteInput(opportunity, { quoteId }), context);
  await service.transitionQuote(quoteId, { status: 'READY_FOR_REVIEW', reason: 'review' }, context);
  await service.transitionQuote(quoteId, { status: 'APPROVED_INTERNAL', reason: 'approved', approvalId: 'approval-test', evidence: { approvalStatus: 'approved' } }, context);
  return service.list('quote').then((items) => items.find((item) => item.quoteId === quoteId));
};

describe('CO-1.17A Commercial Input Pack', () => {
  test('accepts real-shaped partial coverage without inventing target records', async () => {
    const input = new CommercialInputPackService();
    const preview = input.preview(fixture);
    expect(preview.valid).toBe(true);
    expect(preview.coverage).toMatchObject({ accountCount: 1, skuCount: 3, priorityAccountsTarget: 10, launchSkusTarget: 18, accountsTargetComplete: false, skusTargetComplete: false });
    expect(preview.writesPerformed).toBe(false);
  });
  test('reports empty IDs, duplicate IDs and incomplete fields per record', () => {
    const input = new CommercialInputPackService();
    const bad = JSON.parse(JSON.stringify(fixture));
    bad.accounts.push({ ...bad.accounts[0] });
    bad.skus[0].skuId = '';
    bad.skus[1].unitCost = -1;
    const preview = input.preview(bad);
    expect(preview.valid).toBe(false);
    expect(preview.errors.map((error) => error.code)).toEqual(expect.arrayContaining(['DUPLICATE_ID', 'ID_REQUIRED', 'MONEY_INVALID']));
  });
  test('parses valid CSV and produces deterministic checksum', () => {
    const headers = ['recordType', ...Object.keys(fixture.accounts[0])];
    const csv = `${headers.join(',')}\n${headers.map((key) => key === 'recordType' ? 'account' : fixture.accounts[0][key]).join(',')}`;
    const service = new CommercialInputPackService();
    const first = service.preview(csv, { format: 'csv' });
    expect(first.records.accounts).toHaveLength(1);
    expect(first.checksum).toHaveLength(64);
    expect(service.preview(csv, { format: 'csv' }).checksum).toBe(first.checksum);
  });
  test('requires explicit confirmation and reuses identical pack checksum', async () => {
    const store = new MemoryCommercialOperationsStore();
    const service = new CommercialOperationsService({ store, config: { corneropsCommercialOperationsEnabled: true } });
    await expect(service.confirmInputPack(fixture, {}, context)).rejects.toMatchObject({ code: 'COMMERCIAL_INPUT_CONFIRMATION_REQUIRED' });
    const first = await service.confirmInputPack(fixture, { confirmed: true }, context);
    const second = await service.confirmInputPack(fixture, { confirmed: true }, context);
    expect(first.reused).toBe(false);
    expect(second.reused).toBe(true);
    expect(await service.list('account')).toHaveLength(1);
  });
});

describe('CO-1.17A quote and order controls', () => {
  test.each([
    ['missing price', { line: { unitPrice: 'unknown' } }],
    ['missing currency', { currency: 'unknown' }],
    ['missing price source', { line: { priceSource: 'not_provided' } }],
  ])('%s blocks READY_FOR_REVIEW', async (_name, override) => {
    const { service, opportunity } = await make();
    await service.createQuote(quoteInput(opportunity, override), context);
    await expect(service.transitionQuote('quote-1', { status: 'READY_FOR_REVIEW' }, context)).rejects.toMatchObject({ code: 'QUOTE_EVIDENCE_INCOMPLETE' });
  });
  test('unapproved SKU blocks review', async () => {
    const { service, opportunity, store } = await make();
    await store.update('sku', 'demo-sku-tajin', (sku) => ({ ...sku, commercialStatus: 'pending_verification' }), context);
    await service.createQuote(quoteInput(opportunity), context);
    await expect(service.transitionQuote('quote-1', { status: 'READY_FOR_REVIEW' }, context)).rejects.toMatchObject({ code: 'QUOTE_EVIDENCE_INCOMPLETE' });
  });
  test('totals are deterministic and discounts cannot make totals negative', async () => {
    const { service, opportunity } = await make();
    expect(service.quoteTotals(quoteInput(opportunity))).toMatchObject({ subtotal: 20, shipping: 15, total: 35 });
    expect(() => service.quoteTotals({ lineItems: [{ quantity: 1, unitPrice: 1 }], shipping: 0, discount: 2 })).toThrow(expect.objectContaining({ code: 'QUOTE_TOTAL_NEGATIVE' }));
  });
  test('approval and export never send; manual confirmation requires actor and timestamp', async () => {
    const { service, opportunity } = await make();
    await approvedQuote(service, opportunity);
    const exported = await service.exportQuote('quote-approved', 'json', context);
    expect(exported).toMatchObject({ sendStatus: 'DRAFT_NOT_SENT', externallySent: false });
    await expect(service.transitionQuote('quote-approved', { status: 'SENT_MANUALLY_CONFIRMED' }, {})).rejects.toMatchObject({ code: 'COMMERCIAL_ACTOR_REQUIRED' });
    await expect(service.transitionQuote('quote-approved', { status: 'SENT_MANUALLY_CONFIRMED' }, context)).rejects.toMatchObject({ code: 'QUOTE_MANUAL_SEND_EVIDENCE_REQUIRED' });
  });
  test('accepted quote creates exactly one idempotent order', async () => {
    const { service, opportunity } = await make();
    await approvedQuote(service, opportunity);
    await service.exportQuote('quote-approved', 'json', context);
    await service.transitionQuote('quote-approved', { status: 'SENT_MANUALLY_CONFIRMED', sentAt: '2026-07-22T00:00:00.000Z' }, context);
    const first = await service.acceptQuote('quote-approved', { paymentMethod: 'BANK_TRANSFER' }, context);
    const second = await service.acceptQuote('quote-approved', { paymentMethod: 'BANK_TRANSFER' }, context);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(await service.list('order')).toHaveLength(1);
  });
});

describe('CO-1.17A payments, fulfillment and close', () => {
  const orderHarness = async (method = 'BANK_TRANSFER') => {
    const harness = await make();
    await approvedQuote(harness.service, harness.opportunity);
    await harness.service.exportQuote('quote-approved', 'json', context);
    await harness.service.transitionQuote('quote-approved', { status: 'SENT_MANUALLY_CONFIRMED', sentAt: '2026-07-22T00:00:00.000Z' }, context);
    const order = (await harness.service.acceptQuote('quote-approved', { paymentMethod: method }, context)).record;
    await harness.service.transitionOrder(order.orderId, { status: 'ORDER_CONFIRMED' }, context);
    return { ...harness, order: await harness.store.get('order', order.orderId) };
  };
  test.each(['BANK_TRANSFER', 'CASH_ON_DELIVERY'])('records %s metadata without payment capture', async (method) => {
    const { service, order } = await orderHarness(method);
    const payment = (await service.recordPayment(order.orderId, { method, amount: 5, currency: 'AED', status: 'PENDING_VERIFICATION', reference: `ref-${method}` }, context)).record;
    expect(payment.capturePerformed).toBe(false);
    expect(payment.sensitiveFinancialDataStored).toBe(false);
  });
  test('partial and paid transitions follow confirmed evidence', async () => {
    const { service, store, order } = await orderHarness();
    await service.transitionOrder(order.orderId, { status: 'PAYMENT_PENDING' }, context);
    await service.recordPayment(order.orderId, { method: 'BANK_TRANSFER', amount: 5, currency: 'AED', status: 'CONFIRMED', evidence: { receiptChecksum: 'a'.repeat(64) }, reference: 'partial' }, context);
    expect((await store.get('order', order.orderId)).status).toBe('PAYMENT_PARTIAL');
    await service.recordPayment(order.orderId, { method: 'BANK_TRANSFER', amount: 30, currency: 'AED', status: 'CONFIRMED', evidence: { receiptChecksum: 'b'.repeat(64) }, reference: 'balance' }, context);
    expect((await store.get('order', order.orderId)).status).toBe('PAID');
  });
  test('fulfillment is one-per-order and rejects premature fulfillment', async () => {
    const { service, order } = await orderHarness();
    await expect(service.createFulfillment(order.orderId, {}, context)).rejects.toMatchObject({ code: 'FULFILLMENT_ORDER_NOT_READY' });
    await service.transitionOrder(order.orderId, { status: 'PAID' }, context);
    const first = await service.createFulfillment(order.orderId, {}, context);
    const second = await service.createFulfillment(order.orderId, {}, context);
    expect(first.created).toBe(false);
    expect(second.created).toBe(false);
    expect(await service.list('fulfillment')).toHaveLength(1);
  });
  test('delivery failure materializes one exception and closure needs evidence', async () => {
    const { service, store, order } = await orderHarness('CASH_ON_DELIVERY');
    const fulfillment = (await service.createFulfillment(order.orderId, {}, context)).record;
    for (const status of ['PICKING', 'PACKED', 'HANDED_TO_CARRIER', 'IN_TRANSIT']) {
      await service.transitionFulfillment(fulfillment.fulfillmentId, { status, evidence: status === 'HANDED_TO_CARRIER' ? { handoff: true } : undefined }, context);
    }
    await service.transitionFulfillment(fulfillment.fulfillmentId, { status: 'DELIVERY_FAILED' }, context);
    expect(await service.list('exception')).toHaveLength(1);
    const exception = (await service.list('exception'))[0];
    await expect(service.transitionException(exception.exceptionId, { status: 'RESOLVED', reason: 'reviewed' }, context)).rejects.toMatchObject({ code: 'EXCEPTION_RESOLUTION_EVIDENCE_REQUIRED' });
    await service.transitionException(exception.exceptionId, { status: 'RESOLVED', reason: 'reviewed', evidence: { proof: true } }, context);
    expect((await store.get('exception', exception.exceptionId)).status).toBe('RESOLVED');
  });
  test('Founder Daily separates quotes, orders and cash; unknown inventory stays unknown', async () => {
    const { service, opportunity } = await make();
    await service.createQuote(quoteInput(opportunity), context);
    const daily = await service.founderDaily();
    expect(daily.revenueConfirmed).toBe(0);
    expect(daily.cashCollected).toBe(0);
    expect(daily.metricSemantics).toEqual({ quotes: 'not_revenue', unpaidOrders: 'not_cash', inventoryUnknown: 'not_available' });
  });
  test('Daily Close blocks unacknowledged critical exceptions', async () => {
    const { service } = await make();
    await service.createException({ type: 'PAYMENT_MISMATCH', entityType: 'order', entityId: 'order-x', severity: 'critical' }, context);
    await expect(service.dailyClose({ closeStatus: 'CLOSED' }, context)).rejects.toMatchObject({ code: 'DAILY_CLOSE_CRITICAL_EXCEPTION' });
  });
  test('audit transitions are append-only evidence in memory implementation', async () => {
    const { service, store, opportunity } = await make();
    await service.createQuote(quoteInput(opportunity), context);
    await service.transitionQuote('quote-1', { status: 'READY_FOR_REVIEW' }, context);
    const events = await store.listTransitions({ entityType: 'quote', entityId: 'quote-1' });
    expect(events.map((event) => event.newState)).toEqual(['DRAFT_NOT_SENT', 'READY_FOR_REVIEW']);
    expect(events.every((event) => event.actor === 'founder-test')).toBe(true);
  });
  test('quote review, confirmed order and financial exception materialize idempotent work and approval', async () => {
    const internalStore = new MemoryInternalOperationsStore();
    const workQueueService = new WorkQueueService({ store: internalStore, actionEngineService: {} });
    const store = new MemoryCommercialOperationsStore();
    const service = new CommercialOperationsService({ store, workQueueService, config: { corneropsCommercialOperationsEnabled: true } });
    await service.confirmInputPack(fixture, { confirmed: true }, context);
    const opportunity = (await service.createOpportunity({ opportunityId: 'opp-work', accountId: 'demo-account-1', owner: 'founder-test', source: 'test' }, context)).record;
    await service.createQuote(quoteInput(opportunity, { quoteId: 'quote-work' }), context);
    await service.transitionQuote('quote-work', { status: 'READY_FOR_REVIEW' }, context);
    await service.transitionQuote('quote-work', { status: 'DRAFT_NOT_SENT' }, context);
    await service.transitionQuote('quote-work', { status: 'READY_FOR_REVIEW' }, context);
    await service.createException({ type: 'PAYMENT_MISMATCH', entityType: 'order', entityId: 'order-work', severity: 'critical' }, context);
    expect(internalStore.state.workItems.map((item) => item.idempotencyKey)).toEqual(expect.arrayContaining(['commercial:quote-review:quote-work']));
    expect(internalStore.state.workItems.filter((item) => item.idempotencyKey === 'commercial:quote-review:quote-work')).toHaveLength(1);
    expect(internalStore.state.approvals.filter((item) => item.status === 'pending')).toHaveLength(2);
  });
  test('APPROVED_INTERNAL requires the exact approved Work Queue request', async () => {
    const internalStore = new MemoryInternalOperationsStore();
    const workQueueService = new WorkQueueService({ store: internalStore, actionEngineService: {} });
    const approvalEngineService = new ApprovalEngineService({ store: internalStore });
    const store = new MemoryCommercialOperationsStore();
    const service = new CommercialOperationsService({ store, workQueueService, approvalEngineService, config: { corneropsCommercialOperationsEnabled: true } });
    await service.confirmInputPack(fixture, { confirmed: true }, context);
    const opportunity = (await service.createOpportunity({ opportunityId: 'opp-approval', accountId: 'demo-account-1', owner: 'founder-test', source: 'test' }, context)).record;
    await service.createQuote(quoteInput(opportunity, { quoteId: 'quote-approval' }), context);
    await service.transitionQuote('quote-approval', { status: 'READY_FOR_REVIEW', reason: 'review' }, context);
    const approval = internalStore.state.approvals[0];
    await expect(service.transitionQuote('quote-approval', { status: 'APPROVED_INTERNAL', reason: 'approve' }, context)).rejects.toMatchObject({ code: 'QUOTE_APPROVAL_REQUIRED' });
    await approvalEngineService.decide(approval.id, 'approved', context);
    await service.transitionQuote('quote-approval', { status: 'APPROVED_INTERNAL', reason: 'approve', approvalId: approval.id }, context);
    expect((await store.get('quote', 'quote-approval')).approvalStatus).toBe('approved');
  });
});

describe('CO-1.17A migration and safety boundary', () => {
  const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260722010000_cornerops_commercial_operations_v117a.sql'), 'utf8').toLowerCase();
  test('migration stays private, is not self-applied and protects transition evidence', () => {
    expect(migration).toContain('cornerops_internal.commercial_entities');
    expect(migration).toContain('commercial_transition_events_append_only');
    expect(migration).toContain('from public, anon, authenticated, service_role');
    expect(migration).toContain('external_send_performed=false');
    expect(migration).toContain('payment_capture_performed=false');
    expect(migration).not.toContain('public.products');
  });
  test('routes expose no external send, payment capture or CornerMex write action', () => {
    const routes = fs.readFileSync(path.join(__dirname, '../src/routes/intelligence.js'), 'utf8');
    expect(routes).not.toMatch(/commercial.*(send-email|whatsapp|capture|refund|purchase|activate)/i);
    expect(routes).toContain("'/commercial/input-packs/confirm', founderActionAuth");
  });
  test('frontend modules exist inside the current Command Center', () => {
    const registry = fs.readFileSync(path.join(__dirname, '../frontend/src/config/moduleRegistry.ts'), 'utf8');
    ['Commercial Overview', 'Accounts', 'Opportunities', 'Quotes', 'Commercial Orders', 'Payments', 'Fulfillment', 'Deliveries', 'Exceptions', 'Daily Close'].forEach((label) => expect(registry).toContain(`'${label}'`));
  });
});
