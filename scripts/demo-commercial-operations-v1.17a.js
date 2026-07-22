#!/usr/bin/env node
const fixture = require('../tests/fixtures/commercial/commercial-input-v117a.json');
const { CommercialOperationsService, MemoryCommercialOperationsStore } = require('../src/core/commercial');

const context = { actorId: 'founder-demo', reason: 'COMMERCIAL_DEMO_DATA_NOT_PRODUCTION', evidence: { fixture: true } };

const main = async () => {
  const store = new MemoryCommercialOperationsStore();
  const service = new CommercialOperationsService({ store, config: { corneropsCommercialOperationsEnabled: true, corneropsCommercialShippingRatesAed: { dubai: 15 }, corneropsCommercialShippingConfigVersion: 'demo-only-v1' } });
  await service.confirmInputPack(fixture, { confirmed: true, source: 'COMMERCIAL_DEMO_DATA_NOT_PRODUCTION' }, context);
  const opportunity = (await service.createOpportunity({ accountId: 'demo-account-1', opportunityId: 'demo-opportunity-1', owner: 'founder-demo', source: 'commercial_demo', currency: 'AED', status: 'NEW' }, context)).record;
  await service.createQuote({ quoteId: 'demo-quote-draft', accountId: opportunity.accountId, opportunityId: opportunity.opportunityId, currency: 'AED', destinationEmirate: 'Dubai', lineItems: [{ skuId: 'demo-sku-tajin', quantity: 1, unitPrice: 10, priceSource: 'founder_demo_approved' }] }, context);
  await service.createQuote({ quoteId: 'demo-quote-approved', accountId: opportunity.accountId, opportunityId: opportunity.opportunityId, currency: 'AED', destinationEmirate: 'Dubai', lineItems: [{ skuId: 'demo-sku-pulparindo', quantity: 2, unitPrice: 25, priceSource: 'founder_demo_approved' }] }, context);
  await service.transitionQuote('demo-quote-approved', { status: 'READY_FOR_REVIEW', reason: 'demo_review' }, context);
  await service.transitionQuote('demo-quote-approved', { status: 'APPROVED_INTERNAL', reason: 'demo_approval', approvalId: 'demo-approval', evidence: { approvalStatus: 'approved', demoOnly: true } }, context);
  await service.exportQuote('demo-quote-approved', 'json', context);
  await service.transitionQuote('demo-quote-approved', { status: 'SENT_MANUALLY_CONFIRMED', sentAt: '2026-07-22T00:00:00.000Z', reason: 'demo_manual_send' }, context);
  const order = (await service.acceptQuote('demo-quote-approved', { paymentMethod: 'BANK_TRANSFER' }, context)).record;
  await service.transitionOrder(order.orderId, { status: 'ORDER_CONFIRMED', reason: 'demo_confirmed' }, context);
  await service.transitionOrder(order.orderId, { status: 'PAYMENT_PENDING', reason: 'demo_bank_transfer_pending' }, context);
  await service.recordPayment(order.orderId, { method: 'BANK_TRANSFER', amount: order.total, currency: 'AED', status: 'BANK_TRANSFER_PENDING_VERIFICATION', reference: 'demo-bank-transfer' }, context);
  await store.create('order', 'demo-cod-order', { orderId: 'demo-cod-order', accountId: 'demo-account-1', quoteId: 'demo-quote-approved', lineItems: [], currency: 'AED', total: 12, paymentMethod: 'CASH_ON_DELIVERY', paymentStatus: 'COD_PENDING_COLLECTION', fulfillmentStatus: 'READY_FOR_INTERMEX_HANDOFF', deliveryStatus: 'PENDING', owner: 'founder-demo', status: 'ORDER_CONFIRMED' }, context);
  await store.create('fulfillment', 'demo-delayed-fulfillment', { fulfillmentId: 'demo-delayed-fulfillment', orderId: order.orderId, commercialOwner: { party: 'CornerMex' }, warehouseCustodian: { party: 'Intermex UAE', integrationMode: 'manual_evidence_only' }, carrierProvider: { party: 'unknown' }, assignedTo: 'founder-demo', status: 'BLOCKED', blockers: ['COMMERCIAL_DEMO_DATA_NOT_PRODUCTION'] }, context);
  await service.createException({ type: 'FULFILLMENT_DELAY', entityType: 'fulfillment', entityId: 'demo-delayed-fulfillment', severity: 'high', blocker: 'demo_delay' }, context);
  await store.create('fulfillment', 'demo-failed-delivery', { fulfillmentId: 'demo-failed-delivery', orderId: 'demo-cod-order', commercialOwner: { party: 'CornerMex' }, warehouseCustodian: { party: 'Intermex UAE', integrationMode: 'manual_evidence_only' }, carrierProvider: { party: 'unknown' }, assignedTo: 'founder-demo', status: 'DELIVERY_FAILED', blockers: [] }, context);
  await service.createException({ type: 'DELIVERY_FAILED', entityType: 'fulfillment', entityId: 'demo-failed-delivery', severity: 'high', blocker: 'demo_delivery_failure' }, context);
  process.stdout.write(`${JSON.stringify({ classification: 'COMMERCIAL_DEMO_DATA_NOT_PRODUCTION', founderDaily: await service.founderDaily(), dailyClosePreview: await service.dailyClose({ date: '2026-07-22', closeStatus: 'OPEN', notes: 'demo only' }, context), externalSendsPerformed: false, paymentCapturePerformed: false, cornerMexWritesPerformed: false }, null, 2)}\n`);
};

if (require.main === module) main().catch((error) => { process.stderr.write(`Commercial demo failed safely: ${error.message}\n`); process.exitCode = 1; });
module.exports = { main };
