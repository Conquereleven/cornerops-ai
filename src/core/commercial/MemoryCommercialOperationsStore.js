const { randomUUID } = require('crypto');

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();

class MemoryCommercialOperationsStore {
  constructor({ state } = {}) {
    this.state = state || { entities: [], transitions: [], auditEvents: [], evidenceRegistry: [] };
    this.state.evidenceRegistry ||= [];
  }
  async health() { return { healthy: true, provider: 'memory_test_only', durable: false }; }
  async get(kind, stableKey) { return clone(this.state.entities.find((item) => item.kind === kind && item.stableKey === stableKey)?.payload || null); }
  async list(kind) { return clone(this.state.entities.filter((item) => item.kind === kind).map((item) => item.payload)); }
  async create(kind, stableKey, payload, context = {}) {
    const existing = this.state.entities.find((item) => item.kind === kind && item.stableKey === stableKey);
    if (existing) return { record: clone(existing.payload), created: false };
    const timestamp = now();
    const record = { ...clone(payload), createdAt: payload.createdAt || timestamp, updatedAt: payload.updatedAt || timestamp, version: 1 };
    this.state.entities.push({ id: randomUUID(), kind, stableKey, payload: record, version: 1 });
    this.appendTransition(kind, stableKey, null, record.status || 'CREATED', context, record);
    return { record: clone(record), created: true };
  }
  async update(kind, stableKey, updater, context = {}) {
    const entity = this.state.entities.find((item) => item.kind === kind && item.stableKey === stableKey);
    if (!entity) return null;
    const previous = clone(entity.payload);
    const next = updater(clone(previous));
    entity.version += 1;
    entity.payload = { ...next, updatedAt: now(), version: entity.version };
    this.appendTransition(kind, stableKey, previous.status || null, entity.payload.status || null, context, entity.payload);
    return clone(entity.payload);
  }
  appendTransition(kind, stableKey, previousState, newState, context, payload) {
    const event = {
      id: randomUUID(), entityType: kind, entityId: stableKey, previousState, newState,
      actor: context.actorId || 'system', reason: context.reason || 'internal_operation',
      evidence: clone(context.evidence || {}), correlationId: context.correlationId || null,
      payloadChecksum: context.payloadChecksum || null, createdAt: now(),
    };
    this.state.transitions.push(event);
    this.state.auditEvents.push({ ...event, eventType: `${kind}_transition`, payload: undefined, sanitized: true });
    return event;
  }
  async listTransitions(filters = {}) { return clone(this.state.transitions.filter((item) => (!filters.entityType || item.entityType === filters.entityType) && (!filters.entityId || item.entityId === filters.entityId))); }
  async claimEvidence(record) {
    const existing = this.state.evidenceRegistry.find((item) => item.evidenceFingerprint === record.evidenceFingerprint);
    if (existing) return { record: clone(existing), created: false };
    this.state.evidenceRegistry.push(clone(record));
    return { record: clone(record), created: true };
  }
  async listEvidence() { return clone(this.state.evidenceRegistry); }
}

module.exports = { MemoryCommercialOperationsStore };
