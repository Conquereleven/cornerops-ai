const { createHash, randomUUID } = require('crypto');
const { REPLAY_REASONS } = require('./replayTypes');

class ReplayProtectionService {
  constructor({ auditLogService, enabled = true, failClosed = true, store, ttlSeconds = 86400 } = {}) {
    this.auditLogService = auditLogService;
    this.enabled = enabled;
    this.failClosed = failClosed;
    this.store = store;
    this.ttlSeconds = ttlSeconds;
  }

  async checkAndRecord(message = {}) {
    if (!this.enabled) return { allowed: true, reason: REPLAY_REASONS.NEW, warnings: ['Replay protection is disabled.'] };
    const externalMessageId = message.externalMessageId || message.metadata?.telegramMessageId;
    const externalUpdateId = message.externalUpdateId || message.metadata?.telegramUpdateId;
    if (!message.provider || !message.chatId || !message.userId || (!externalMessageId && !externalUpdateId)) {
      return { allowed: false, reason: REPLAY_REASONS.INVALID_INPUT };
    }
    const now = new Date();
    const identity = [message.provider, message.chatId, message.userId, externalUpdateId, externalMessageId].join(':');
    const id = `replay-${createHash('sha256').update(identity).digest('hex').slice(0, 24)}`;
    const record = {
      id,
      provider: message.provider,
      externalMessageId: externalMessageId ? String(externalMessageId) : undefined,
      externalUpdateId: externalUpdateId ? String(externalUpdateId) : undefined,
      chatId: String(message.chatId),
      userId: String(message.userId),
      checksum: createHash('sha256').update(`${identity}:${message.text || ''}`).digest('hex'),
      firstSeenAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + (this.ttlSeconds * 1000)).toISOString(),
    };
    try {
      const result = await this.store.checkAndSet(record, now);
      if (result.inserted) return { allowed: true, reason: REPLAY_REASONS.NEW, recordId: id };
      const audit = await this.auditLogService?.record({
        requestId: message.id || `replay-${randomUUID().slice(0, 12)}`,
        eventType: 'operator_replay_rejected',
        dataSource: 'operator_channel',
        operation: 'replay_check',
        userId: message.userId,
        channel: message.provider,
        policyDecision: 'denied',
        status: 'denied',
        sanitizedInput: { recordId: id, chatId: message.chatId, externalMessageId, externalUpdateId },
        errorCode: 'OPERATOR_REPLAY_DUPLICATE',
      });
      return { allowed: false, reason: REPLAY_REASONS.DUPLICATE, recordId: id, auditId: audit?.id };
    } catch (error) {
      await this.auditLogService?.record({
        requestId: message.id,
        eventType: 'operator_replay_store_error',
        dataSource: 'operator_channel',
        operation: 'replay_check',
        userId: message.userId,
        channel: message.provider,
        policyDecision: this.failClosed ? 'denied' : 'degraded',
        status: 'error',
        errorCode: error.code || 'REPLAY_STORE_UNAVAILABLE',
      });
      return {
        allowed: !this.failClosed,
        reason: REPLAY_REASONS.STORE_UNAVAILABLE,
        warnings: ['Replay store is unavailable.'],
      };
    }
  }

  health() {
    return this.store?.health?.() || Promise.resolve({ healthy: false, provider: 'unavailable' });
  }
}

module.exports = { ReplayProtectionService };
