const { timingSafeEqual } = require('crypto');

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
};

class TelegramOperatorChannelAdapter {
  constructor({ config, fetchImpl = global.fetch } = {}) {
    this.provider = 'telegram';
    this.config = config;
    this.fetchImpl = fetchImpl;
    this.channelService = null;
  }

  connect(channelService) {
    this.channelService = channelService;
    return this;
  }

  validateWebhookSecret(secret) {
    return Boolean(this.config.webhookSecret) && safeEqual(secret, this.config.webhookSecret);
  }

  normalizeUpdate(payload = {}, secret) {
    if (!this.validateWebhookSecret(secret)) {
      const error = new Error('Invalid Telegram webhook secret.');
      error.code = 'TELEGRAM_WEBHOOK_SECRET_DENIED';
      error.statusCode = 401;
      throw error;
    }
    const message = payload.message;
    if (!message || !message.text || !message.chat || !message.from) {
      const error = new Error('Telegram update does not contain a supported message.');
      error.code = 'TELEGRAM_MESSAGE_REQUIRED';
      error.statusCode = 400;
      throw error;
    }
    const chatId = String(message.chat.id);
    const userId = String(message.from.id);
    if (message.chat.type !== 'private' && !this.config.allowedChatIds.includes(chatId)) {
      const error = new Error('Telegram groups are disabled unless explicitly allowlisted.');
      error.code = 'TELEGRAM_GROUP_DENIED';
      error.statusCode = 403;
      throw error;
    }
    return {
      id: `telegram-${payload.update_id || message.message_id}`,
      provider: this.provider,
      channelId: chatId,
      chatId,
      userId,
      username: message.from.username,
      text: message.text,
      receivedAt: message.date
        ? new Date(message.date * 1000).toISOString()
        : new Date().toISOString(),
      metadata: {
        telegramMessageId: String(message.message_id),
        chatType: message.chat.type,
      },
    };
  }

  async handleWebhook(payload, secret) {
    if (!this.channelService) throw new Error('Telegram operator channel is not connected.');
    return this.channelService.handleInbound(this.normalizeUpdate(payload, secret));
  }

  async sendReply(response) {
    const dryRun = this.config.dryRun || response.dryRun;
    if (!this.config.enabled || !this.config.replyEnabled || dryRun) {
      return {
        status: 'dry_run',
        warnings: ['Telegram reply was not sent because the channel is disabled or in dry-run mode.'],
      };
    }
    if (!this.config.botToken || !response.chatId) {
      return { status: 'error', warnings: ['Telegram reply credentials or chat id are unavailable.'] };
    }
    try {
      const result = await this.fetchImpl(
        `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: response.chatId, text: response.text }),
        },
      );
      if (!result.ok) return { status: 'error', warnings: ['Telegram rejected the operator reply.'] };
      return { status: 'sent', warnings: [] };
    } catch (_error) {
      return { status: 'error', warnings: ['Telegram operator reply transport failed.'] };
    }
  }
}

module.exports = { TelegramOperatorChannelAdapter, safeEqual };
