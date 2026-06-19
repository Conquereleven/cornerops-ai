const { OPERATOR_CHANNEL_STATUSES } = require('./operatorChannelTypes');

class OperatorChannelResponseService {
  constructor({ registry, statusStore } = {}) {
    this.registry = registry;
    this.statusStore = statusStore;
  }

  async reply(message, { text, auditId, warnings = [], policy } = {}) {
    if (!policy?.replyAllowed) {
      return this.response(message, text, OPERATOR_CHANNEL_STATUSES.BLOCKED, auditId, warnings);
    }
    const adapter = this.registry.get(message.provider);
    if (!adapter) {
      return this.response(message, text, OPERATOR_CHANNEL_STATUSES.ERROR, auditId, [
        ...warnings,
        'OPERATOR_CHANNEL_ADAPTER_UNAVAILABLE',
      ]);
    }
    const result = await adapter.sendReply({
      provider: message.provider,
      channelId: message.channelId,
      chatId: message.chatId,
      userId: message.userId,
      text,
      dryRun: policy.dryRun,
    });
    if (result.status === OPERATOR_CHANNEL_STATUSES.SENT || result.status === OPERATOR_CHANNEL_STATUSES.DRY_RUN) {
      this.statusStore.recordOutbound();
    }
    return this.response(message, text, result.status, auditId, [...warnings, ...(result.warnings || [])]);
  }

  response(message, text, status, auditId, warnings) {
    return {
      messageId: message.id,
      provider: message.provider,
      channelId: message.channelId,
      chatId: message.chatId,
      userId: message.userId,
      text,
      status,
      auditId,
      warnings: [...new Set(warnings)],
    };
  }
}

module.exports = { OperatorChannelResponseService };
