const { randomUUID } = require('crypto');
const { sanitizeMessage } = require('./SecuritySanitizer');

const sanitizePreview = (value) => sanitizeMessage(String(value || ''))
  .replace(/\b\d{6,12}:[A-Za-z0-9_-]{20,}\b/g, '[REDACTED_TELEGRAM_TOKEN]')
  .slice(0, 160);

class RejectionTrackingService {
  constructor({ enabled = true, retentionDays = 30, store } = {}) {
    this.enabled = enabled;
    this.retentionDays = retentionDays;
    this.store = store;
  }

  async record(input = {}) {
    if (!this.enabled || !this.store) return null;
    const record = {
      id: `rejection-${randomUUID().slice(0, 12)}`,
      provider: input.provider || 'mock',
      reason: sanitizeMessage(input.reason || 'policy_error'),
      riskLevel: input.riskLevel || 'high',
      chatId: input.chatId ? String(input.chatId) : undefined,
      userId: input.userId ? String(input.userId) : undefined,
      username: input.username ? sanitizeMessage(input.username) : undefined,
      messageId: input.messageId ? String(input.messageId) : undefined,
      sanitizedTextPreview: input.text ? sanitizePreview(input.text) : undefined,
      createdAt: input.createdAt || new Date().toISOString(),
      auditId: input.auditId,
    };
    const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
    return this.store.add(record, cutoff);
  }

  async list(options) {
    const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
    return this.store?.list?.({ ...options, cutoff }) || [];
  }

  async summary() {
    const records = await this.list({ limit: 5000 });
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    const recent = records.filter((record) => new Date(record.createdAt).getTime() >= cutoff);
    return {
      total: records.length,
      rejectedLast24h: recent.length,
      byReason: recent.reduce((acc, record) => ({
        ...acc,
        [record.reason]: (acc[record.reason] || 0) + 1,
      }), {}),
    };
  }

  health() {
    return this.store?.health?.() || Promise.resolve({ healthy: false, provider: 'unavailable' });
  }
}

module.exports = { RejectionTrackingService, sanitizePreview };
