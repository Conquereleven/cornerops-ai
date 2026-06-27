const { sanitizeAuditPayload } = require('../security/SecuritySanitizer');
const { withinLast24Hours } = require('./ControlTowerService');

const previewFor = (event) => {
  const value = sanitizeAuditPayload({
    input: event.sanitizedInput,
    output: event.sanitizedOutput,
    errorCode: event.errorCode,
    errorMessage: event.errorMessage,
    reason: event.reason,
  }, { maxBytes: 1024 });
  return JSON.stringify(value).slice(0, 360);
};

const normalizeEvent = (event, source = 'audit') => ({
  timestamp: event.createdAt,
  eventType: event.eventType || event.actionType || event.intent || 'unknown',
  agentId: event.agentId,
  source: event.dataSource || source,
  channel: event.channel || event.provider || 'internal',
  policyDecision: event.policyDecision || 'unknown',
  status: event.status || 'unknown',
  auditId: event.id,
  riskLevel: event.riskLevel,
  preview: previewFor(event),
});

class AuditViewerService {
  constructor({ agentAuditService, auditLogService, config, openclawAuditService, rejectionProvider } = {}) {
    this.agentAuditService = agentAuditService;
    this.auditLogService = auditLogService;
    this.config = config;
    this.openclawAuditService = openclawAuditService;
    this.rejectionProvider = rejectionProvider;
  }

  async getEvents({ filter = 'all', limit } = {}) {
    if (!this.config.corneropsAuditViewerEnabled) {
      return { enabled: false, events: [], summary: {} };
    }
    const safeLimit = Math.max(1, Math.min(
      Number(limit) || this.config.corneropsAuditViewerMaxEvents,
      this.config.corneropsAuditViewerMaxEvents,
    ));
    const [domain, agents, openclaw, rejections] = await Promise.all([
      this.auditLogService.list({ limit: safeLimit }),
      Promise.resolve(this.agentAuditService.list({ limit: safeLimit })),
      Promise.resolve(this.openclawAuditService.list({ limit: safeLimit })),
      this.rejectionProvider ? this.rejectionProvider({ limit: safeLimit }) : Promise.resolve([]),
    ]);
    const rejectionEvents = rejections.map((item) => ({
      ...item,
      eventType: 'operator_channel_rejected',
      policyDecision: 'denied',
      status: 'denied',
      channel: item.provider,
      sanitizedInput: { reason: item.reason },
    }));
    let events = [
      ...domain.map((event) => normalizeEvent(event, 'business_data')),
      ...agents.map((event) => normalizeEvent(event, 'agent')),
      ...openclaw.map((event) => normalizeEvent(event, 'openclaw')),
      ...rejectionEvents.map((event) => normalizeEvent(event, 'operator_channel')),
    ].sort((left, right) => new Date(right.timestamp || 0) - new Date(left.timestamp || 0));
    if (filter === 'denied') {
      events = events.filter((event) => event.status === 'denied' || event.policyDecision === 'denied');
    } else if (filter === 'errors') {
      events = events.filter((event) => event.status === 'error' || event.preview.includes('errorCode'));
    } else if (filter === 'approvals') {
      events = events.filter((event) => event.eventType.includes('approval'));
    } else if (filter === 'telegram') {
      events = events.filter((event) => event.channel === 'telegram');
    } else if (filter === 'actions') {
      events = events.filter((event) => event.eventType.includes('controlled_action'));
    }
    const recent = events.filter((event) => withinLast24Hours(event.timestamp));
    return {
      enabled: true,
      maskPii: this.config.corneropsAuditViewerMaskPii,
      summary: {
        eventsLast24h: recent.length,
        deniedLast24h: recent.filter((event) => event.status === 'denied' || event.policyDecision === 'denied').length,
        errorsLast24h: recent.filter((event) => event.status === 'error').length,
      },
      events: events.slice(0, safeLimit),
    };
  }

  async getRejections({ limit = 100 } = {}) {
    const records = this.rejectionProvider ? await this.rejectionProvider({ limit }) : [];
    return records.map((record) => sanitizeAuditPayload({
      id: record.id,
      provider: record.provider,
      reason: record.reason,
      riskLevel: record.riskLevel,
      createdAt: record.createdAt,
      auditId: record.auditId,
    }));
  }
}

module.exports = { AuditViewerService, normalizeEvent, previewFor };
