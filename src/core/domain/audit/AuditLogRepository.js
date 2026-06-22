const { randomUUID } = require('crypto');
const env = require('../../../config/env');
const { sanitizeAuditPayload } = require('../../security/SecuritySanitizer');

class AuditLogRepository {
  constructor({ adapter, enabled = true } = {}) {
    this.adapter = adapter;
    this.enabled = enabled;
    this.logs = [];
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
    this.logs.unshift(log);
    this.logs.splice(500);
    return { ...log };
  }

  async listAuditLogs({ limit = 100 } = {}) {
    const fixtureLogs = this.adapter?.listAuditLogs ? this.adapter.listAuditLogs() : [];
    return [...this.logs, ...fixtureLogs].slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
  }

  clearForTests() {
    this.logs.splice(0);
  }
}

module.exports = {
  AuditLogRepository,
};
