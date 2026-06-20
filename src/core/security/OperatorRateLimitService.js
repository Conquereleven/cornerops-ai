const { createHash } = require('crypto');
const { RATE_LIMIT_REASONS } = require('./rateLimitTypes');

class OperatorRateLimitService {
  constructor({
    auditLogService,
    burst = 20,
    enabled = true,
    failClosed = true,
    limitPerMinute = 12,
    store,
  } = {}) {
    this.auditLogService = auditLogService;
    this.burst = burst;
    this.enabled = enabled;
    this.failClosed = failClosed;
    this.limitPerMinute = limitPerMinute;
    this.store = store;
  }

  async check(message = {}) {
    if (!this.enabled) return { allowed: true, reason: RATE_LIMIT_REASONS.ALLOWED, warnings: ['Rate limiting is disabled.'] };
    if (!message.provider || !message.chatId || !message.userId) {
      return { allowed: false, reason: RATE_LIMIT_REASONS.STORE_UNAVAILABLE };
    }
    const identity = `${message.provider}:${message.chatId}:${message.userId}`;
    const key = createHash('sha256').update(identity).digest('hex');
    const now = Date.now();
    try {
      const result = await this.store.update(key, (current) => {
        const elapsedMinutes = current ? Math.max(0, now - current.updatedAt) / 60000 : 0;
        const available = current
          ? Math.min(this.burst, current.tokens + (elapsedMinutes * this.limitPerMinute))
          : this.burst;
        const allowed = available >= 1;
        return {
          state: {
            provider: message.provider,
            chatId: String(message.chatId),
            userId: String(message.userId),
            tokens: allowed ? available - 1 : available,
            updatedAt: now,
          },
          result: {
            allowed,
            reason: allowed ? RATE_LIMIT_REASONS.ALLOWED : RATE_LIMIT_REASONS.EXCEEDED,
            remaining: Math.max(0, Math.floor(allowed ? available - 1 : available)),
          },
        };
      });
      if (!result.allowed) {
        const audit = await this.auditLogService?.record({
          requestId: message.id,
          eventType: 'operator_rate_limit_rejected',
          dataSource: 'operator_channel',
          operation: 'rate_limit_check',
          userId: message.userId,
          channel: message.provider,
          policyDecision: 'denied',
          status: 'denied',
          sanitizedInput: { chatId: message.chatId, limitPerMinute: this.limitPerMinute, burst: this.burst },
          errorCode: 'OPERATOR_RATE_LIMIT_EXCEEDED',
        });
        result.auditId = audit?.id;
      }
      return result;
    } catch (error) {
      await this.auditLogService?.record({
        requestId: message.id,
        eventType: 'operator_rate_limit_store_error',
        dataSource: 'operator_channel',
        operation: 'rate_limit_check',
        userId: message.userId,
        channel: message.provider,
        policyDecision: this.failClosed ? 'denied' : 'degraded',
        status: 'error',
        errorCode: error.code || 'RATE_LIMIT_STORE_UNAVAILABLE',
      });
      return {
        allowed: !this.failClosed,
        reason: RATE_LIMIT_REASONS.STORE_UNAVAILABLE,
        warnings: ['Rate limit store is unavailable.'],
      };
    }
  }

  health() {
    return this.store?.health?.() || Promise.resolve({ healthy: false, provider: 'unavailable' });
  }
}

module.exports = { OperatorRateLimitService };
