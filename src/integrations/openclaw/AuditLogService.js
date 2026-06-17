const { randomUUID } = require('crypto');
const logger = require('../../utils/logger');
const { AUDIT_STATUS } = require('./types');

const SENSITIVE_KEYS = [
  'apiKey',
  'authorization',
  'password',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'OPENCLAW_GATEWAY_TOKEN',
  'OPENCLAW_GATEWAY_PASSWORD',
];

const auditLogs = [];

const isSensitiveKey = (key) =>
  SENSITIVE_KEYS.some((sensitive) =>
    String(key).toLowerCase().includes(String(sensitive).toLowerCase()),
  );

const sanitize = (value, depth = 0) => {
  if (depth > 6) return '[Truncated]';
  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      isSensitiveKey(key) ? '[REDACTED]' : sanitize(entry, depth + 1),
    ]),
  );
};

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
      policyDecision: event.policyDecision || 'allowed',
      status: event.status || AUDIT_STATUS.PENDING,
      sanitizedInput: sanitize(event.input || event.sanitizedInput || {}),
      sanitizedOutput: sanitize(event.output || event.sanitizedOutput || {}),
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
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
