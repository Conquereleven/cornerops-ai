const { createHash, randomUUID } = require('crypto');
const { commerceOsError } = require('./commerceOsTypes');

const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};
const checksum = (value) => createHash('sha256').update(stableJson(value)).digest('hex');
const text = (value) => String(value ?? '').trim();
const timestamp = (value) => text(value) && Number.isFinite(Date.parse(value));
const minor = (value) => Number.isSafeInteger(value) && value >= 0;
const issue = (code, field, severity, details) => ({ code, field, severity, ...(details && { details }) });

class MemoryCommerceOrderIntakeStore {
  constructor() { this.records = new Map(); }
  get(sourceKey) { return this.records.get(sourceKey) || null; }
  save(sourceKey, record) { this.records.set(sourceKey, record); return record; }
}

class CanonicalOrderIntakeService {
  constructor({ store = new MemoryCommerceOrderIntakeStore() } = {}) { this.store = store; }

  assess(order = {}, profile = {}) {
    const issues = [];
    const required = [
      ['tenantId', order.tenantId], ['source.system', order.source?.system],
      ['source.externalOrderId', order.source?.externalOrderId], ['orderNumber', order.orderNumber],
      ['currency', order.currency], ['createdAt', order.createdAt],
    ];
    required.forEach(([field, value]) => { if (!text(value)) issues.push(issue('FIELD_REQUIRED', field, 'error')); });
    if (text(order.tenantId) && text(profile.tenantId) && text(order.tenantId) !== text(profile.tenantId)) {
      issues.push(issue('TENANT_MISMATCH', 'tenantId', 'error'));
    }
    if (text(order.currency) && text(profile.currency) && text(order.currency).toUpperCase() !== text(profile.currency).toUpperCase()) {
      issues.push(issue('CURRENCY_NOT_CONFIGURED', 'currency', 'configuration'));
    }
    if (order.createdAt && !timestamp(order.createdAt)) issues.push(issue('TIMESTAMP_INVALID', 'createdAt', 'error'));
    if (order.source?.externalUpdatedAt && !timestamp(order.source.externalUpdatedAt)) issues.push(issue('TIMESTAMP_INVALID', 'source.externalUpdatedAt', 'error'));

    if (!Array.isArray(order.lineItems) || order.lineItems.length === 0) issues.push(issue('LINE_ITEMS_REQUIRED', 'lineItems', 'error'));
    (order.lineItems || []).forEach((item, index) => {
      if (!text(item.externalLineItemId)) issues.push(issue('FIELD_REQUIRED', `lineItems.${index}.externalLineItemId`, 'error'));
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) issues.push(issue('QUANTITY_INVALID', `lineItems.${index}.quantity`, 'error'));
      if (!minor(item.unitPriceMinor)) issues.push(issue('MONEY_MINOR_INVALID', `lineItems.${index}.unitPriceMinor`, 'error'));
      if (!text(item.sku)) issues.push(issue('SKU_REVIEW_REQUIRED', `lineItems.${index}.sku`, 'approval'));
    });

    const moneyFields = ['subtotalMinor', 'discountMinor', 'taxMinor', 'shippingMinor', 'totalMinor'];
    moneyFields.forEach((field) => { if (!minor(order.totals?.[field])) issues.push(issue('MONEY_MINOR_INVALID', `totals.${field}`, 'error')); });
    if (moneyFields.every((field) => minor(order.totals?.[field]))) {
      const calculated = order.totals.subtotalMinor - order.totals.discountMinor + order.totals.taxMinor + order.totals.shippingMinor;
      if (calculated !== order.totals.totalMinor) issues.push(issue('TOTAL_MISMATCH', 'totals.totalMinor', 'approval', { calculated }));
    }
    if ((order.lineItems || []).some((item) => item.requiresShipping !== false) && !text(order.delivery?.emirate)) {
      issues.push(issue('DELIVERY_EMIRATE_REVIEW_REQUIRED', 'delivery.emirate', 'approval'));
    }

    const status = issues.some((item) => item.severity === 'error') ? 'rejected'
      : issues.some((item) => item.severity === 'configuration') ? 'configuration_required'
        : issues.some((item) => item.severity === 'approval') ? 'approval_required' : 'accepted';
    return { status, issues, externalWritesPerformed: false, paymentCapturePerformed: false, customerMessagesSent: false };
  }

  ingest(order = {}, profile = {}, context = {}) {
    if (!text(context.actorId)) throw commerceOsError('Actor is required.', 'COMMERCE_OS_ACTOR_REQUIRED');
    const assessment = this.assess(order, profile);
    const fingerprint = checksum(order);
    const sourceKey = `${text(order.tenantId)}:${text(order.source?.system).toLowerCase()}:${text(order.source?.externalOrderId)}`;
    if (assessment.status === 'rejected' || !text(order.source?.externalOrderId)) {
      return { assessment, record: null, idempotentReplay: false, sourceKey, fingerprint };
    }
    const previous = this.store.get(sourceKey);
    if (previous?.fingerprint === fingerprint) return { assessment: previous.assessment, record: previous, idempotentReplay: true, sourceKey, fingerprint };
    const incomingVersion = Date.parse(order.source?.externalUpdatedAt || order.createdAt);
    const previousVersion = previous ? Date.parse(previous.sourceUpdatedAt) : null;
    if (previous && (!Number.isFinite(incomingVersion) || incomingVersion <= previousVersion)) {
      return {
        assessment: { ...assessment, status: 'rejected', issues: [...assessment.issues, issue('SOURCE_VERSION_CONFLICT', 'source.externalUpdatedAt', 'error')] },
        record: previous, idempotentReplay: false, sourceKey, fingerprint,
      };
    }
    const record = {
      id: previous?.id || randomUUID(), sourceKey, fingerprint, revision: (previous?.revision || 0) + 1,
      tenantId: order.tenantId, externalOrderId: order.source.externalOrderId,
      sourceUpdatedAt: order.source.externalUpdatedAt || order.createdAt, assessment,
      canonicalOrder: order, actorId: context.actorId, receivedAt: new Date().toISOString(),
    };
    this.store.save(sourceKey, record);
    return { assessment, record, idempotentReplay: false, sourceKey, fingerprint };
  }

  async ingestDurable(order = {}, profile = {}, context = {}) {
    if (!text(context.actorId)) throw commerceOsError('Actor is required.', 'COMMERCE_OS_ACTOR_REQUIRED');
    if (typeof this.store.ingest !== 'function') throw commerceOsError('Durable order persistence is required.', 'COMMERCE_OS_ORDER_PERSISTENCE_REQUIRED');
    const assessment = this.assess(order, profile);
    const fingerprint = checksum(order);
    const sourceKey = `${text(order.tenantId)}:${text(order.source?.system).toLowerCase()}:${text(order.source?.externalOrderId)}`;
    if (assessment.status === 'rejected' || !text(order.source?.externalOrderId)) {
      return { assessment, record: null, idempotentReplay: false, sourceKey, fingerprint };
    }
    const persisted = await this.store.ingest({ order, assessment, fingerprint, sourceKey }, context);
    if (persisted.conflict) {
      return {
        assessment: { ...assessment, status: 'rejected', issues: [...assessment.issues, issue('SOURCE_VERSION_CONFLICT', 'source.externalUpdatedAt', 'error')] },
        record: persisted.record, idempotentReplay: false, sourceKey, fingerprint,
      };
    }
    return { assessment: persisted.record.assessment, record: persisted.record, idempotentReplay: persisted.idempotentReplay, sourceKey, fingerprint };
  }
}

module.exports = { CanonicalOrderIntakeService, MemoryCommerceOrderIntakeStore };
