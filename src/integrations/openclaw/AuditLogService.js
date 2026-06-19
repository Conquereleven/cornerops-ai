const { randomUUID } = require('crypto');
const logger = require('../../utils/logger');
const { AUDIT_STATUS } = require('./types');
const env = require('../../config/env');
const { sanitizeAuditPayload } = require('../../core/security/SecuritySanitizer');

const auditLogs = [];

const sanitize = (value) => sanitizeAuditPayload(value, {
  maxBytes: env.corneropsMaxAuditPayloadBytes,
});

class AuditLogService {
  constructor({ enabled = true } = {}) {
    this.enabled = enabled;
  }

  record(event) {
    if (!this.enabled) return null;
    const auditLog = {
      id: `audit-${randomUUID().slice(0, 12)}`,
      requestId: event.requestId || `request-${randomUUID().slice(0, 12)}`,
      correlationId: event.correlationId,
      userId: event.userId || 'unknown',
      channel: event.channel || 'internal',
      conversationId: event.conversationId || '',
      actionType: event.actionType || 'unknown',
      toolName: event.toolName,
      policyDecision: event.policyDecision || 'denied',
      status: event.status || AUDIT_STATUS.PENDING,
      sanitizedInput: sanitize(event.input || event.sanitizedInput || {}),
      sanitizedOutput: sanitize(event.output || event.sanitizedOutput || {}),
      errorCode: event.errorCode,
      errorMessage: event.errorMessage
        ? sanitizeAuditPayload({ message: event.errorMessage }).message
        : undefined,
      latencyMs: event.latencyMs,
      approvalId: event.approvalId,
      createdAt: new Date().toISOString(),
    };
    auditLogs.unshift(auditLog);
    auditLogs.splice(500);
    logger.info('openclaw_audit', {
      requestId: auditLog.requestId,
      channel: auditLog.channel,
      actionType: auditLog.actionType,
      policyDecision: auditLog.policyDecision,
      status: auditLog.status,
    });
    return { ...auditLog };
  }

  list({ limit = 100 } = {}) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    return auditLogs.slice(0, safeLimit).map((item) => ({ ...item }));
  }

  clearForTests() {
    auditLogs.splice(0);
  }
}

module.exports = {
  AuditLogService,
  sanitize,
};
