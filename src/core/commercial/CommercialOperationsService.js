const { createHash, randomUUID } = require('crypto');
const { CommercialInputPackService } = require('./CommercialInputPackService');
const {
  EXCEPTION_STATES, EXCEPTION_TYPES, FULFILLMENT_STATES, OPPORTUNITY_STATES,
  ORDER_STATES, PAYMENT_METHODS, QUOTE_STATES, UNKNOWN_VALUES, commercialError, transitions,
} = require('./commercialTypes');

const now = () => new Date().toISOString();
const stableId = (prefix, value) => `${prefix}-${createHash('sha256').update(String(value)).digest('hex').slice(0, 20)}`;
const knownNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const requiredActor = (context) => {
  if (!String(context?.actorId || '').trim()) throw commercialError('Actor is required.', 'COMMERCIAL_ACTOR_REQUIRED');
};
const requireTransition = (kind, current, next) => {
  if (!(transitions[kind]?.[current] || []).includes(next)) {
    throw commercialError(`${kind} transition ${current} -> ${next} is not allowed.`, 'COMMERCIAL_TRANSITION_INVALID', 409);
  }
};

class CommercialOperationsService {
  constructor({ store, workQueueService, approvalEngineService, inputPackService = new CommercialInputPackService(), config = {} } = {}) {
    this.store = store;
    this.workQueueService = workQueueService;
    this.approvalEngineService = approvalEngineService;
    this.inputPackService = inputPackService;
    this.config = config;
  }
  assertEnabled() {
    if (this.config.corneropsCommercialOperationsEnabled === false) {
      throw commercialError('Commercial operations are disabled.', 'COMMERCIAL_OPERATIONS_DISABLED', 503);
    }
  }
  async queue(recommendation, context) {
    if (!this.workQueueService?.syncCommercial) return null;
    return this.workQueueService.syncCommercial([{
      sourceType: 'commercial_operations',
      sourceId: recommendation.sourceId,
      sourceFlow: recommendation.sourceFlow,
      actionType: recommendation.actionType,
      idempotencyKey: recommendation.idempotencyKey,
      title: recommendation.title,
      description: recommendation.description,
      priority: recommendation.priority || 'medium',
      approvalRequired: Boolean(recommendation.approvalRequired),
      evidence: { ...(recommendation.evidence || {}), conditionActive: true, commercialInternalOnly: true },
      safePayload: { ...(recommendation.safePayload || {}), externalSendAllowed: false, paymentCaptureAllowed: false, cornerMexWriteAllowed: false },
    }], context);
  }
  transitionContext(command, context) {
    const reason = command.reason || context.reason;
    const evidence = command.evidence || context.evidence;
    if (!String(reason || '').trim()) throw commercialError('Transition reason is required.', 'COMMERCIAL_TRANSITION_REASON_REQUIRED');
    return { ...context, reason, evidence: evidence || {} };
  }
  async assertQuoteApproval(quoteId, command) {
    if (!command.approvalId) throw commercialError('Approved quote requires an approval ID.', 'QUOTE_APPROVAL_REQUIRED', 409);
    if (!this.approvalEngineService) {
      if (command.evidence?.approvalStatus !== 'approved') throw commercialError('Approved quote requires verified approval evidence.', 'QUOTE_APPROVAL_REQUIRED', 409);
      return;
    }
    const approval = await this.approvalEngineService.get(command.approvalId);
    const workItem = approval ? await this.workQueueService.get(approval.workItemId) : null;
    if (!approval || approval.status !== 'approved' || workItem?.idempotencyKey !== `commercial:quote-review:${quoteId}`) {
      throw commercialError('Approval does not authorize this quote.', 'QUOTE_APPROVAL_INVALID', 409);
    }
  }
  async status() {
    const persistence = await this.store.health();
    const summary = await this.summary();
    return { status: persistence.healthy ? 'ready' : 'configuration_required', persistence, ...summary, externalSendsBlocked: true, paymentCaptureBlocked: true, cornerMexWritesBlocked: true };
  }
  previewInputPack(input, options) { return this.inputPackService.preview(input, options); }
  async confirmInputPack(input, options = {}, context = {}) {
    this.assertEnabled(); requiredActor(context);
    if (!options.confirmed) throw commercialError('Explicit confirmation is required.', 'COMMERCIAL_INPUT_CONFIRMATION_REQUIRED', 409);
    const preview = this.previewInputPack(input, options);
    if (!preview.valid) throw commercialError('Input pack validation failed.', 'COMMERCIAL_INPUT_INVALID', 422, preview.errors);
    const existing = await this.store.get('input_pack', preview.checksum);
    if (existing) return { checksum: preview.checksum, reused: true, coverage: preview.coverage };
    for (const account of preview.records.accounts) await this.store.create('account', account.accountId, account, { ...context, payloadChecksum: preview.checksum });
    for (const sku of preview.records.skus) await this.store.create('sku', sku.skuId, sku, { ...context, payloadChecksum: preview.checksum });
    await this.store.create('input_pack', preview.checksum, { checksum: preview.checksum, source: options.source || 'founder_authorized_input', coverage: preview.coverage, status: 'IMPORTED_CONFIRMED' }, context);
    return { checksum: preview.checksum, reused: false, coverage: preview.coverage, accountCount: preview.records.accounts.length, skuCount: preview.records.skus.length };
  }
  async createOpportunity(input, context = {}) {
    this.assertEnabled(); requiredActor(context);
    if (!OPPORTUNITY_STATES.includes(input.status || 'NEW')) throw commercialError('Opportunity status is invalid.', 'OPPORTUNITY_STATUS_INVALID');
    if (!await this.store.get('account', input.accountId)) throw commercialError('Account does not exist.', 'ACCOUNT_NOT_FOUND', 404);
    const id = input.opportunityId || stableId('opp', input.idempotencyKey || randomUUID());
    const payload = { opportunityId: id, accountId: input.accountId, owner: input.owner, source: input.source, estimatedValue: input.estimatedValue ?? 'unknown', currency: input.currency || 'unknown', priority: input.priority || 'medium', nextAction: input.nextAction || 'not_provided', nextActionAt: input.nextActionAt || null, status: input.status || 'NEW', lossReason: null };
    return this.store.create('opportunity', id, payload, context);
  }
  validateQuoteForReview(quote) {
    const errors = [];
    if (!quote.currency || UNKNOWN_VALUES.includes(quote.currency)) errors.push('currency');
    if (!knownNumber(quote.shipping) || !quote.shippingSource || UNKNOWN_VALUES.includes(quote.shippingSource)) errors.push('shippingEvidence');
    (quote.lineItems || []).forEach((line, index) => {
      if (!line.skuId) errors.push(`lineItems.${index}.skuId`);
      if (!knownNumber(line.quantity) || line.quantity <= 0) errors.push(`lineItems.${index}.quantity`);
      if (!knownNumber(line.unitPrice)) errors.push(`lineItems.${index}.unitPrice`);
      if (!line.priceSource || UNKNOWN_VALUES.includes(line.priceSource)) errors.push(`lineItems.${index}.priceSource`);
      if (line.commercialStatus !== 'authorized') errors.push(`lineItems.${index}.commercialStatus`);
    });
    if (errors.length) throw commercialError('Quote is not ready for review.', 'QUOTE_EVIDENCE_INCOMPLETE', 422, errors);
  }
  quoteTotals(input) {
    const subtotal = (input.lineItems || []).reduce((sum, line) => sum + (knownNumber(line.quantity) && knownNumber(line.unitPrice) ? line.quantity * line.unitPrice : 0), 0);
    const shipping = knownNumber(input.shipping) ? input.shipping : 'unknown';
    const tax = knownNumber(input.tax) ? input.tax : 0;
    const discount = knownNumber(input.discount) ? input.discount : 0;
    const totalBeforeDiscount = knownNumber(shipping) ? subtotal + shipping + tax : 'unknown';
    if (knownNumber(totalBeforeDiscount) && discount > totalBeforeDiscount) throw commercialError('Discount cannot make total negative.', 'QUOTE_TOTAL_NEGATIVE');
    return { subtotal, shipping, tax, discount, total: knownNumber(totalBeforeDiscount) ? totalBeforeDiscount - discount : 'unknown' };
  }
  async createQuote(input, context = {}) {
    this.assertEnabled(); requiredActor(context);
    const opportunity = await this.store.get('opportunity', input.opportunityId);
    if (!opportunity || opportunity.accountId !== input.accountId) throw commercialError('Opportunity/account link is invalid.', 'QUOTE_OPPORTUNITY_INVALID', 422);
    const quoteId = input.quoteId || stableId('quote', input.idempotencyKey || randomUUID());
    const lines = [];
    for (const line of input.lineItems || []) {
      const sku = await this.store.get('sku', line.skuId);
      lines.push({ ...line, skuName: sku?.name || 'unknown', commercialStatus: sku?.commercialStatus || 'unknown', costSource: line.costSource || 'not_provided', priceSource: line.priceSource || 'not_provided', costObservedAt: line.costObservedAt || null, priceApprovedBy: line.priceApprovedBy || null, marginAmount: line.marginAmount ?? 'unknown', marginPercent: line.marginPercent ?? 'unknown', commercialEvidenceStatus: line.commercialEvidenceStatus || 'pending_verification' });
    }
    const shipping = knownNumber(input.shipping) ? input.shipping
      : input.shippingRule === 'default_local_uae' ? this.config.corneropsCommercialDefaultLocalShippingAed : 'unknown';
    const shippingSource = knownNumber(input.shipping) ? input.shippingSource || 'not_provided'
      : input.shippingRule === 'default_local_uae' ? 'configured_default_local_shipping' : 'not_provided';
    const totals = this.quoteTotals({ ...input, shipping, lineItems: lines });
    return this.store.create('quote', quoteId, { quoteId, accountId: input.accountId, opportunityId: input.opportunityId, lineItems: lines, currency: input.currency || 'unknown', ...totals, shippingSource, validUntil: input.validUntil || null, paymentTerms: input.paymentTerms || 'not_provided', deliveryTerms: input.deliveryTerms || 'not_provided', evidenceStatus: input.evidenceStatus || 'pending_verification', approvalStatus: 'pending', sendStatus: 'DRAFT_NOT_SENT', status: 'DRAFT_NOT_SENT' }, context);
  }
  async transitionQuote(quoteId, command, context = {}) {
    this.assertEnabled(); requiredActor(context);
    if (!QUOTE_STATES.includes(command.status)) throw commercialError('Quote status is invalid.', 'QUOTE_STATUS_INVALID');
    const transitionContext = this.transitionContext(command, context);
    if (command.status === 'APPROVED_INTERNAL') await this.assertQuoteApproval(quoteId, command);
    if (command.status === 'SENT_MANUALLY_CONFIRMED' && (!context.actorId || !command.sentAt)) throw commercialError('Manual send confirmation requires actor and timestamp.', 'QUOTE_MANUAL_SEND_EVIDENCE_REQUIRED');
    const result = await this.store.update('quote', quoteId, (quote) => {
      requireTransition('quote', quote.status, command.status);
      if (command.status === 'READY_FOR_REVIEW') this.validateQuoteForReview(quote);
      return { ...quote, status: command.status, approvalStatus: command.status === 'APPROVED_INTERNAL' ? 'approved' : quote.approvalStatus, sendStatus: command.status === 'SENT_MANUALLY_CONFIRMED' ? 'SENT_MANUALLY_CONFIRMED' : quote.sendStatus, sentAt: command.sentAt || quote.sentAt || null, sentBy: command.status === 'SENT_MANUALLY_CONFIRMED' ? context.actorId : quote.sentBy || null };
    }, transitionContext);
    if (result?.status === 'READY_FOR_REVIEW') await this.queue({
      sourceId: quoteId, sourceFlow: 'commercial_quote_review', actionType: 'approve_commercial_quote',
      idempotencyKey: `commercial:quote-review:${quoteId}`, title: `Review commercial quote ${quoteId}`,
      priority: 'high', approvalRequired: true, evidence: { quoteId },
    }, context);
    return result;
  }
  async exportQuote(quoteId, format, context = {}) {
    this.assertEnabled(); requiredActor(context);
    if (!['json', 'csv', 'pdf'].includes(format)) throw commercialError('Export format is invalid.', 'QUOTE_EXPORT_FORMAT_INVALID');
    const quote = await this.store.get('quote', quoteId);
    if (!quote || quote.status !== 'APPROVED_INTERNAL') throw commercialError('Only internally approved quotes can be exported.', 'QUOTE_EXPORT_NOT_ALLOWED', 409);
    await this.transitionQuote(quoteId, { status: 'EXPORTED_FOR_MANUAL_SEND', reason: `export_${format}` }, context);
    return { quoteId, format, sendStatus: 'DRAFT_NOT_SENT', externallySent: false, payload: format === 'json' ? quote : { generated: true, sanitized: true } };
  }
  async acceptQuote(quoteId, input = {}, context = {}) {
    this.assertEnabled(); requiredActor(context);
    const quote = await this.store.get('quote', quoteId);
    if (!quote) throw commercialError('Quote not found.', 'QUOTE_NOT_FOUND', 404);
    if (quote.status !== 'SENT_MANUALLY_CONFIRMED' && quote.status !== 'ACCEPTED') throw commercialError('Quote must be manually sent before acceptance.', 'QUOTE_ACCEPTANCE_INVALID', 409);
    if (quote.status !== 'ACCEPTED') await this.transitionQuote(quoteId, { status: 'ACCEPTED', reason: input.reason || 'customer_acceptance_recorded', evidence: input.evidence }, context);
    const orderId = stableId('order', quoteId);
    const order = { orderId, accountId: quote.accountId, quoteId, channel: input.channel || 'manual_b2b', lineItems: quote.lineItems, currency: quote.currency, subtotal: quote.subtotal, shipping: quote.shipping, tax: quote.tax, total: quote.total, paymentMethod: input.paymentMethod || 'OTHER', paymentStatus: 'PENDING', fulfillmentStatus: 'WAITING_PAYMENT', deliveryStatus: 'PENDING', owner: input.owner || context.actorId, status: 'ORDER_DRAFT' };
    if (!PAYMENT_METHODS.includes(order.paymentMethod)) throw commercialError('Payment method is invalid.', 'PAYMENT_METHOD_INVALID');
    return this.store.create('order', orderId, order, context);
  }
  async transitionOrder(orderId, command, context = {}) {
    this.assertEnabled(); requiredActor(context);
    if (!ORDER_STATES.includes(command.status)) throw commercialError('Order status is invalid.', 'ORDER_STATUS_INVALID');
    const transitionContext = this.transitionContext(command, context);
    const result = await this.store.update('order', orderId, (order) => {
      requireTransition('order', order.status, command.status);
      return { ...order, status: command.status, paymentStatus: ['PAID', 'READY_FOR_FULFILLMENT', 'FULFILLING', 'SHIPPED', 'DELIVERED'].includes(command.status) ? 'PAID' : order.paymentStatus };
    }, transitionContext);
    if (result?.status === 'ORDER_CONFIRMED') {
      const fulfillmentId = stableId('fulfillment', orderId);
      await this.store.create('fulfillment', fulfillmentId, { fulfillmentId, orderId, provider: 'not_provided', trackingReference: null, assignedTo: context.actorId, status: 'WAITING_PAYMENT', expectedDispatchAt: null, dispatchedAt: null, deliveredAt: null, blockers: ['payment_pending'], notes: null, handoffConfirmedBy: null, handoffConfirmedAt: null }, context);
      await this.queue({
        sourceId: orderId, sourceFlow: 'commercial_order_fulfillment', actionType: 'prepare_commercial_fulfillment',
        idempotencyKey: `commercial:fulfillment:${orderId}`, title: `Prepare fulfillment for ${orderId}`,
        priority: 'high', approvalRequired: false, evidence: { orderId, fulfillmentId },
      }, context);
    }
    if (result?.status === 'PAID') {
      const fulfillmentId = stableId('fulfillment', orderId);
      const fulfillment = await this.store.get('fulfillment', fulfillmentId);
      if (fulfillment?.status === 'WAITING_PAYMENT') await this.store.update('fulfillment', fulfillmentId, (item) => ({ ...item, status: 'READY_TO_PICK', blockers: [] }), { ...context, reason: 'payment_confirmed' });
    }
    return result;
  }
  async recordPayment(orderId, input, context = {}) {
    this.assertEnabled(); requiredActor(context);
    const order = await this.store.get('order', orderId);
    if (!order) throw commercialError('Order not found.', 'ORDER_NOT_FOUND', 404);
    if (!PAYMENT_METHODS.includes(input.method)) throw commercialError('Payment method is invalid.', 'PAYMENT_METHOD_INVALID');
    if (!['PENDING_VERIFICATION', 'CONFIRMED', 'REJECTED'].includes(input.status || 'PENDING_VERIFICATION')) throw commercialError('Payment status is invalid.', 'PAYMENT_STATUS_INVALID');
    if (!knownNumber(input.amount) || input.amount <= 0 || input.currency !== order.currency) throw commercialError('Payment amount/currency is invalid.', 'PAYMENT_RECORD_INVALID');
    if (input.status === 'CONFIRMED' && !input.evidence) throw commercialError('Confirmed payment requires evidence.', 'PAYMENT_EVIDENCE_REQUIRED');
    const paymentId = input.paymentId || stableId('payment', input.idempotencyKey || `${orderId}:${input.reference || input.amount}`);
    const result = await this.store.create('payment', paymentId, { paymentId, orderId, method: input.method, amount: input.amount, currency: input.currency, status: input.status || 'PENDING_VERIFICATION', reference: input.reference || 'not_provided', capturePerformed: false, sensitiveFinancialDataStored: false, evidence: input.evidence || null, confirmedBy: input.status === 'CONFIRMED' ? context.actorId : null, confirmedAt: input.status === 'CONFIRMED' ? now() : null }, context);
    if (result.created && input.status === 'CONFIRMED') {
      const payments = (await this.store.list('payment')).filter((payment) => payment.orderId === orderId && payment.status === 'CONFIRMED');
      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const target = totalPaid >= order.total ? 'PAID' : 'PAYMENT_PARTIAL';
      if ((transitions.order[order.status] || []).includes(target)) await this.transitionOrder(orderId, { status: target, reason: 'confirmed_payment_recorded', evidence: { paymentId } }, context);
    }
    return result;
  }
  async createFulfillment(orderId, input = {}, context = {}) {
    this.assertEnabled(); requiredActor(context);
    const order = await this.store.get('order', orderId);
    if (!order) throw commercialError('Order not found.', 'ORDER_NOT_FOUND', 404);
    if (!['PAID', 'READY_FOR_FULFILLMENT'].includes(order.status) && order.paymentMethod !== 'CASH_ON_DELIVERY') throw commercialError('Order is not eligible for fulfillment.', 'FULFILLMENT_ORDER_NOT_READY', 409);
    const fulfillmentId = stableId('fulfillment', orderId);
    const existing = await this.store.get('fulfillment', fulfillmentId);
    if (existing) {
      if (existing.status === 'WAITING_PAYMENT' && (order.paymentMethod === 'CASH_ON_DELIVERY' || order.status === 'PAID')) {
        return { record: await this.store.update('fulfillment', fulfillmentId, (item) => ({ ...item, status: 'READY_TO_PICK', blockers: [] }), { ...context, reason: 'fulfillment_released' }), created: false };
      }
      return { record: existing, created: false };
    }
    return this.store.create('fulfillment', fulfillmentId, { fulfillmentId, orderId, provider: input.provider || 'not_provided', trackingReference: input.trackingReference || null, assignedTo: input.assignedTo || context.actorId, status: order.paymentMethod === 'CASH_ON_DELIVERY' || order.status === 'PAID' ? 'READY_TO_PICK' : 'WAITING_PAYMENT', expectedDispatchAt: input.expectedDispatchAt || null, dispatchedAt: null, deliveredAt: null, blockers: [], notes: input.notes || null, handoffConfirmedBy: null, handoffConfirmedAt: null }, context);
  }
  async transitionFulfillment(fulfillmentId, command, context = {}) {
    this.assertEnabled(); requiredActor(context);
    if (!FULFILLMENT_STATES.includes(command.status)) throw commercialError('Fulfillment status is invalid.', 'FULFILLMENT_STATUS_INVALID');
    const transitionContext = this.transitionContext(command, context);
    const result = await this.store.update('fulfillment', fulfillmentId, (fulfillment) => {
      requireTransition('fulfillment', fulfillment.status, command.status);
      if (command.status === 'HANDED_TO_CARRIER' && !command.evidence) throw commercialError('Manual handoff requires evidence.', 'FULFILLMENT_HANDOFF_EVIDENCE_REQUIRED');
      return { ...fulfillment, status: command.status, trackingReference: command.trackingReference || fulfillment.trackingReference, handoffConfirmedBy: command.status === 'HANDED_TO_CARRIER' ? context.actorId : fulfillment.handoffConfirmedBy, handoffConfirmedAt: command.status === 'HANDED_TO_CARRIER' ? now() : fulfillment.handoffConfirmedAt, dispatchedAt: command.status === 'HANDED_TO_CARRIER' ? now() : fulfillment.dispatchedAt, deliveredAt: command.status === 'DELIVERED' ? now() : fulfillment.deliveredAt };
    }, transitionContext);
    if (result?.status === 'DELIVERY_FAILED') await this.createException({ type: 'DELIVERY_FAILED', entityType: 'fulfillment', entityId: fulfillmentId, severity: 'high', owner: result.assignedTo, blocker: 'delivery_failed', recommendedAction: 'Review carrier evidence and contact plan manually.' }, context);
    return result;
  }
  async createException(input, context = {}) {
    this.assertEnabled(); requiredActor(context);
    if (!EXCEPTION_TYPES.includes(input.type)) throw commercialError('Exception type is invalid.', 'EXCEPTION_TYPE_INVALID');
    const key = stableId('exception', `${input.type}:${input.entityType}:${input.entityId}`);
    const result = await this.store.create('exception', key, { exceptionId: key, type: input.type, entityType: input.entityType, entityId: input.entityId, severity: input.severity || 'medium', owner: input.owner || context.actorId, status: 'OPEN', blocker: input.blocker || 'not_provided', recommendedAction: input.recommendedAction || 'Founder review required.', resolvedAt: null, resolution: null }, context);
    await this.queue({
      sourceId: key, sourceFlow: 'commercial_exception', actionType: 'resolve_commercial_exception',
      idempotencyKey: `commercial:exception:${key}`, title: `Resolve ${input.type} for ${input.entityId}`,
      priority: input.severity === 'critical' ? 'critical' : input.severity === 'high' ? 'high' : 'medium',
      approvalRequired: ['PAYMENT_MISMATCH', 'INVENTORY_UNKNOWN', 'OUT_OF_STOCK'].includes(input.type),
      evidence: { exceptionId: key, entityType: input.entityType, entityId: input.entityId },
    }, context);
    return result;
  }
  async transitionException(exceptionId, command, context = {}) {
    this.assertEnabled(); requiredActor(context);
    if (!EXCEPTION_STATES.includes(command.status)) throw commercialError('Exception status is invalid.', 'EXCEPTION_STATUS_INVALID');
    if (['RESOLVED', 'DISMISSED_WITH_REASON'].includes(command.status) && (!command.reason || !command.evidence)) throw commercialError('Exception closure requires reason and evidence.', 'EXCEPTION_RESOLUTION_EVIDENCE_REQUIRED');
    return this.store.update('exception', exceptionId, (item) => ({ ...item, status: command.status, resolvedAt: ['RESOLVED', 'DISMISSED_WITH_REASON'].includes(command.status) ? now() : null, resolution: command.reason || null }), { ...context, reason: command.reason, evidence: command.evidence });
  }
  async dailyClose(input, context = {}) {
    this.assertEnabled(); requiredActor(context);
    const exceptions = await this.store.list('exception');
    const critical = exceptions.filter((item) => item.severity === 'critical' && item.status === 'OPEN');
    if (input.closeStatus === 'CLOSED' && critical.length) throw commercialError('Critical exceptions must be acknowledged before close.', 'DAILY_CLOSE_CRITICAL_EXCEPTION', 409);
    const date = input.date || now().slice(0, 10);
    const [quotes, orders, payments, fulfillments] = await Promise.all(['quote', 'order', 'payment', 'fulfillment'].map((kind) => this.store.list(kind)));
    const summary = {
      quotesCreated: quotes.length,
      quotesApproved: quotes.filter((item) => ['APPROVED_INTERNAL', 'EXPORTED_FOR_MANUAL_SEND', 'SENT_MANUALLY_CONFIRMED', 'ACCEPTED'].includes(item.status)).length,
      quotesSentManually: quotes.filter((item) => ['SENT_MANUALLY_CONFIRMED', 'ACCEPTED'].includes(item.status)).length,
      ordersCreated: orders.length,
      ordersConfirmed: orders.filter((item) => item.status !== 'ORDER_DRAFT').length,
      ordersPaid: orders.filter((item) => ['PAID', 'READY_FOR_FULFILLMENT', 'FULFILLING', 'SHIPPED', 'DELIVERED'].includes(item.status)).length,
      cashCollected: payments.filter((item) => item.status === 'CONFIRMED').reduce((sum, item) => sum + item.amount, 0),
      ordersFulfilled: fulfillments.filter((item) => ['HANDED_TO_CARRIER', 'IN_TRANSIT', 'DELIVERED'].includes(item.status)).length,
      ordersShipped: fulfillments.filter((item) => ['IN_TRANSIT', 'DELIVERED'].includes(item.status)).length,
      ordersDelivered: fulfillments.filter((item) => item.status === 'DELIVERED').length,
      deliveryFailures: fulfillments.filter((item) => item.status === 'DELIVERY_FAILED').length,
      openExceptions: exceptions.filter((item) => !['RESOLVED', 'DISMISSED_WITH_REASON'].includes(item.status)).length,
      unresolvedPaymentIssues: exceptions.filter((item) => ['PAYMENT_OVERDUE', 'PAYMENT_MISMATCH'].includes(item.type) && !['RESOLVED', 'DISMISSED_WITH_REASON'].includes(item.status)).length,
    };
    return this.store.create('daily_close', date, { date, closeStatus: input.closeStatus || 'OPEN', closedBy: input.closeStatus === 'CLOSED' ? context.actorId : null, closedAt: input.closeStatus === 'CLOSED' ? now() : null, notes: input.notes || null, unresolvedItems: input.unresolvedItems || [], metrics: summary }, context);
  }
  async summary() {
    const [accounts, skus, opportunities, quotes, orders, payments, fulfillments, exceptions] = await Promise.all(['account', 'sku', 'opportunity', 'quote', 'order', 'payment', 'fulfillment', 'exception'].map((kind) => this.store.list(kind)));
    const confirmedPayments = payments.filter((payment) => payment.status === 'CONFIRMED');
    return {
      accounts: accounts.length, skus: skus.length, opportunities: opportunities.length, quotes: quotes.length, orders: orders.length,
      revenueConfirmed: orders.filter((order) => order.status === 'DELIVERED').reduce((sum, order) => sum + (knownNumber(order.total) ? order.total : 0), 0),
      revenuePending: orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status)).reduce((sum, order) => sum + (knownNumber(order.total) ? order.total : 0), 0),
      cashCollected: confirmedPayments.reduce((sum, payment) => sum + payment.amount, 0),
      codExposure: orders.filter((order) => order.paymentMethod === 'CASH_ON_DELIVERY' && order.status !== 'DELIVERED').reduce((sum, order) => sum + (knownNumber(order.total) ? order.total : 0), 0),
      inventoryUnknownExposure: quotes.filter((quote) => quote.lineItems.some((line) => line.inventoryStatus === 'unknown' || line.inventoryStatus === undefined)).length,
      fulfillment: fulfillments.length, openExceptions: exceptions.filter((item) => !['RESOLVED', 'DISMISSED_WITH_REASON'].includes(item.status)).length,
      writesInternalOnly: true, externalSendsBlocked: true, paymentCaptureBlocked: true,
    };
  }
  async founderDaily() {
    const [opportunities, quotes, orders, fulfillments, exceptions] = await Promise.all(['opportunity', 'quote', 'order', 'fulfillment', 'exception'].map((kind) => this.store.list(kind)));
    const summary = await this.summary();
    return {
      ...summary,
      newOpportunities: opportunities.filter((item) => item.status === 'NEW').length,
      quotesRequiringAction: quotes.filter((item) => ['DRAFT_NOT_SENT', 'REJECTED_INTERNAL'].includes(item.status)).length,
      quotesAwaitingApproval: quotes.filter((item) => item.status === 'READY_FOR_REVIEW').length,
      ordersAwaitingPayment: orders.filter((item) => ['PAYMENT_PENDING', 'PAYMENT_PARTIAL', 'ORDER_CONFIRMED'].includes(item.status)).length,
      ordersReadyForFulfillment: orders.filter((item) => item.status === 'READY_FOR_FULFILLMENT').length,
      ordersDelayed: fulfillments.filter((item) => ['BLOCKED', 'DELIVERY_FAILED'].includes(item.status)).length,
      deliveriesFailed: fulfillments.filter((item) => item.status === 'DELIVERY_FAILED').length,
      nextFiveFounderDecisions: exceptions.filter((item) => !['RESOLVED', 'DISMISSED_WITH_REASON'].includes(item.status)).sort((a, b) => ({ critical: 4, high: 3, medium: 2, low: 1 }[b.severity] - { critical: 4, high: 3, medium: 2, low: 1 }[a.severity])).slice(0, 5).map((item) => ({ exceptionId: item.exceptionId, type: item.type, recommendedAction: item.recommendedAction })),
      metricSemantics: { quotes: 'not_revenue', unpaidOrders: 'not_cash', inventoryUnknown: 'not_available' },
    };
  }
  async list(kind) { return this.store.list(kind); }
}

module.exports = { CommercialOperationsService, stableId };
