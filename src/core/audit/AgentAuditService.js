const { randomUUID } = require('crypto');
const logger = require('../../utils/logger');
const { sanitize } = require('../../integrations/openclaw/AuditLogService');

const auditEvents = [];

class AgentAuditService {
  constructor({ enabled = true } = {}) {
    this.enabled = enabled;
  }

  record(event = {}) {
    if (!this.enabled) return null;
    const auditEvent = {
      id: `agent-audit-${randomUUID().slice(0, 12)}`,
      requestId: event.requestId || `request-${randomUUID().slice(0, 12)}`,
      messageId: event.messageId,
      conversationId: event.conversationId || '',
      userId: event.userId || 'unknown',
      channel: event.channel || 'internal',
      agentId: event.agentId || 'unknown',
      routedFromAgentId: event.routedFromAgentId,
      intent: event.intent || 'unknown',
      riskLevel: event.riskLevel || 'low',
      status: event.status || 'pending',
      policyDecision: event.policyDecision || 'allowed',
      approvalId: event.approvalId,
      proposedActions: sanitize(event.proposedActions || []),
      sanitizedInput: sanitize(event.input || {}),
      sanitizedOutput: sanitize(event.output || {}),
      errorCode: event.errorCode,
      errorMessage: event.errorMessage,
      createdAt: new Date().toISOString(),
    };
    auditEvents.unshift(auditEvent);
    auditEvents.splice(500);
    logger.info('agent_audit', {
      requestId: auditEvent.requestId,
      agentId: auditEvent.agentId,
      channel: auditEvent.channel,
      status: auditEvent.status,
      policyDecision: auditEvent.policyDecision,
    });
    return { ...auditEvent };
  }

  list({ limit = 100 } = {}) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    return auditEvents.slice(0, safeLimit).map((event) => ({ ...event }));
  }

  clearForTests() {
    auditEvents.splice(0);
  }
}

module.exports = {
  AgentAuditService,
};
