const { randomUUID } = require('crypto');
const logger = require('../../utils/logger');
const { sanitize } = require('../../integrations/openclaw/AuditLogService');
const { InMemoryStore } = require('../persistence/InMemoryStore');

const initialData = { version: 1, records: [] };

class AgentAuditService {
  constructor({ enabled = true, store = new InMemoryStore({ initialData }) } = {}) {
    this.enabled = enabled;
    this.store = store;
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
      policyDecision: event.policyDecision || 'denied',
      approvalId: event.approvalId,
      proposedActions: sanitize(event.proposedActions || []),
      sanitizedInput: sanitize(event.input || {}),
      sanitizedOutput: sanitize(event.output || {}),
      errorCode: event.errorCode,
      errorMessage: event.errorMessage ? sanitize({ message: event.errorMessage }).message : undefined,
      createdAt: new Date().toISOString(),
    };
    this.store.transact((current) => ({
      data: {
        version: 1,
        records: [auditEvent, ...(Array.isArray(current.records) ? current.records : [])].slice(0, 500),
      },
      result: auditEvent,
    }));
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
    return this.store.initialize().records.slice(0, safeLimit).map((event) => ({ ...event }));
  }

  clearForTests() {
    this.store.clear();
  }
}

module.exports = {
  AgentAuditService,
};
