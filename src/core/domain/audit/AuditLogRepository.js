const { randomUUID } = require('crypto');
const env = require('../../../config/env');
const { sanitizeAuditPayload } = require('../../security/SecuritySanitizer');
const { InMemoryStore } = require('../../persistence/InMemoryStore');

const initialData = { version: 1, records: [] };

class AuditLogRepository {
  constructor({ adapter, enabled = true, store = new InMemoryStore({ initialData }) } = {}) {
    this.adapter = adapter;
    this.enabled = enabled;
    this.store = store;
  }

  async createAuditLog(input = {}) {
    if (!this.enabled) return null;
    const log = {
      id: `audit-${randomUUID().slice(0, 12)}`,
      requestId: input.requestId || `request-${randomUUID().slice(0, 12)}`,
      correlationId: input.correlationId,
      eventType: input.eventType || 'tool_invocation',
      agentId: input.agentId,
      userId: input.userId || 'unknown',
      channel: input.channel || 'internal',
      dataSource: input.dataSource,
      operation: input.operation,
      entityType: input.entityType,
      entityId: input.entityId,
      policyDecision: input.policyDecision || 'denied',
      status: input.status || 'success',
      sanitizedInput: sanitizeAuditPayload(input.sanitizedInput || input.input || {}, {
        maxBytes: env.corneropsMaxAuditPayloadBytes,
      }),
      sanitizedOutput: sanitizeAuditPayload(input.sanitizedOutput || input.output || {}, {
        maxBytes: env.corneropsMaxAuditPayloadBytes,
      }),
      errorCode: input.errorCode,
      errorMessage: input.errorMessage
        ? sanitizeAuditPayload({ message: input.errorMessage }).message
        : undefined,
      latencyMs: input.latencyMs,
      createdAt: new Date().toISOString(),
    };
    this.store.transact((current) => ({
      data: {
        version: 1,
        records: [log, ...(Array.isArray(current.records) ? current.records : [])].slice(0, 500),
      },
      result: log,
    }));
    return { ...log };
  }

  async listAuditLogs({ limit = 100 } = {}) {
    const fixtureLogs = this.adapter?.listAuditLogs ? this.adapter.listAuditLogs() : [];
    const logs = this.store.initialize().records;
    return [...logs, ...fixtureLogs].slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
  }

  clearForTests() {
    this.store.clear();
  }
}

module.exports = {
  AuditLogRepository,
};
