const { createHash } = require('crypto');
const { InMemoryStore } = require('../persistence/InMemoryStore');
const { createActionError, normalizeIdempotencyText, stableStringify } = require('./actionTypes');

const initialData = { version: 1, records: [] };

class ActionIdempotencyService {
  constructor({ store = new InMemoryStore({ initialData }) } = {}) {
    this.store = store;
  }

  generateKey({ actionId, payload = {}, sourceRequestId, approvalId, operatorId } = {}) {
    const normalizedPayload = {
      title: normalizeIdempotencyText(payload.title),
      body: normalizeIdempotencyText(payload.body || payload.description),
      relatedEntityType: payload.relatedEntityType || '',
      relatedEntityId: payload.relatedEntityId || '',
    };
    return createHash('sha256').update(stableStringify({
      actionId,
      normalizedPayload,
      sourceRequestId: sourceRequestId || '',
      approvalId: approvalId || '',
      operatorId: operatorId || '',
    })).digest('hex');
  }

  begin(input, { failClosed = true } = {}) {
    const key = this.generateKey(input);
    try {
      return this.store.transact((current) => {
        const records = Array.isArray(current.records) ? current.records : [];
        const existing = records.find((record) => record.key === key);
        if (existing) return { data: current, result: { duplicate: true, record: existing } };
        const record = {
          key,
          actionId: input.actionId,
          approvalId: input.approvalId,
          operatorId: input.operatorId,
          status: 'executing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          data: { version: 1, records: [record, ...records].slice(0, 1000) },
          result: { duplicate: false, record },
        };
      });
    } catch (error) {
      if (failClosed) throw createActionError('Idempotency store is unavailable.', 'CONTROLLED_ACTION_IDEMPOTENCY_UNAVAILABLE', 503);
      return { duplicate: false, unavailable: true, key };
    }
  }

  find(input) {
    const key = this.generateKey(input);
    const record = this.store.initialize().records.find((item) => item.key === key);
    return record ? { ...record } : null;
  }

  complete(key, status, result = {}) {
    return this.store.transact((current) => {
      const records = Array.isArray(current.records) ? current.records : [];
      const index = records.findIndex((record) => record.key === key);
      if (index === -1) throw createActionError('Idempotency reservation is missing.', 'CONTROLLED_ACTION_IDEMPOTENCY_MISSING', 503);
      records[index] = {
        ...records[index],
        status,
        result: {
          status: result.status,
          externalResourceId: result.externalResourceId,
          externalUrl: result.externalUrl,
          resourceId: result.resource?.id,
        },
        updatedAt: new Date().toISOString(),
      };
      return { data: { version: 1, records }, result: records[index] };
    });
  }

  health() {
    return this.store.health ? this.store.health() : { healthy: false, provider: 'unknown' };
  }

  list({ limit = 100 } = {}) {
    return this.store.initialize().records.slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
  }
}

module.exports = { ActionIdempotencyService };
