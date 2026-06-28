const { timingSafeEqual } = require('crypto');

const safeEqual = (left, right) => {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
};

class TelegramOperatorChannelAdapter {
  constructor({
    config,
    fetchImpl = global.fetch,
    rateLimitService,
    rejectionTrackingService,
    replayProtectionService,
  } = {}) {
    this.provider = 'telegram';
    this.config = {
      allowedChatIds: [],
      allowedUserIds: [],
      dryRun: true,
      enabled: false,
      failClosed: true,
      persistentSecurity: false,
      readOnly: true,
      realMode: false,
      rejectGroups: true,
      replyDryRun: true,
      replyEnabled: true,
      requireDm: true,
      ...config,
    };
    this.fetchImpl = fetchImpl;
    this.channelService = null;
    this.rateLimitService = rateLimitService;
    this.rejectionTrackingService = rejectionTrackingService;
    this.replayProtectionService = replayProtectionService;
  }

  connect(channelService) {
    this.channelService = channelService;
    return this;
  }

  validateWebhookSecret(secret) {
    return Boolean(this.config.webhookSecret) && safeEqual(secret, this.config.webhookSecret);
  }

  normalizeUpdate(payload = {}, secret, { validateSecret = true } = {}) {
    if (validateSecret && !this.validateWebhookSecret(secret)) {
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
    if (message.chat.type !== 'private' && (this.config.requireDm || this.config.rejectGroups)) {
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
        telegramUpdateId: payload.update_id === undefined ? undefined : String(payload.update_id),
        chatType: message.chat.type,
      },
    };
  }

  async handleWebhook(payload, secret) {
    if (!this.channelService) throw new Error('Telegram operator channel is not connected.');
    let message;
    try {
      message = this.normalizeUpdate(payload, secret);
    } catch (error) {
      try {
        await this.rejectionTrackingService?.record({
          provider: 'telegram',
          reason: error.code || 'TELEGRAM_PAYLOAD_REJECTED',
          riskLevel: error.code === 'TELEGRAM_WEBHOOK_SECRET_DENIED' ? 'critical' : 'high',
          chatId: payload.message?.chat?.id,
          userId: payload.message?.from?.id,
          messageId: payload.message?.message_id,
        });
      } catch (_storeError) {
        // Preserve the authenticated policy error; the webhook route audits it separately.
      }
      throw error;
    }
    return this.handleNormalizedMessage(message);
  }

  async handlePollingUpdate(payload) {
    if (!this.channelService) throw new Error('Telegram operator channel is not connected.');
    let message;
    try {
      message = this.normalizeUpdate(payload, undefined, { validateSecret: false });
    } catch (error) {
      try {
        await this.rejectionTrackingService?.record({
          provider: 'telegram',
          reason: error.code || 'TELEGRAM_PAYLOAD_REJECTED',
          riskLevel: 'high',
          chatId: payload.message?.chat?.id,
          userId: payload.message?.from?.id,
          messageId: payload.message?.message_id,
        });
      } catch (_storeError) {
        // Preserve the policy error.
      }
      throw error;
    }
    return this.handleNormalizedMessage(message);
  }

  async handleNormalizedMessage(message) {
    if (this.config.enabled && !this.config.botToken) {
      return this.rejectMessage(message, 'TELEGRAM_BOT_TOKEN_REQUIRED', 'critical');
    }
    if (
      this.config.realMode
      && (!this.config.persistentSecurity || !this.config.readOnly || !this.config.failClosed)
    ) {
      return this.rejectMessage(message, 'TELEGRAM_REAL_MODE_NOT_READY', 'critical');
    }
    if (this.config.realMode && !(await this.securityStoresHealthy())) {
      return this.channelService.failClosed(message, 'TELEGRAM_SECURITY_STORE_UNAVAILABLE');
    }
    if (!this.config.allowedChatIds.length || !this.config.allowedChatIds.includes(message.chatId)) {
      return this.rejectMessage(message, 'TELEGRAM_UNKNOWN_CHAT', 'high');
    }
    if (!this.config.allowedUserIds.length || !this.config.allowedUserIds.includes(message.userId)) {
      return this.rejectMessage(message, 'TELEGRAM_UNKNOWN_USER', 'high');
    }
    const replay = await this.replayProtectionService.checkAndRecord(message);
    if (!replay.allowed) {
      return this.rejectMessage(
        message,
        replay.reason === 'duplicate' ? 'TELEGRAM_REPLAY_DUPLICATE' : 'TELEGRAM_REPLAY_STORE_UNAVAILABLE',
        replay.reason === 'store_unavailable' ? 'critical' : 'high',
        replay.auditId,
      );
    }
    const rateLimit = await this.rateLimitService.check(message);
    if (!rateLimit.allowed) {
      return this.rejectMessage(
        message,
        rateLimit.reason === 'rate_limit_exceeded'
          ? 'TELEGRAM_RATE_LIMIT_EXCEEDED'
          : 'TELEGRAM_RATE_LIMIT_STORE_UNAVAILABLE',
        'high',
        rateLimit.auditId,
      );
    }
    return this.channelService.handleInbound(message);
  }

  async securityStoresHealthy() {
    const services = [
      this.replayProtectionService,
      this.rejectionTrackingService,
      this.rateLimitService,
    ];
    if (services.some((service) => typeof service?.health !== 'function')) return false;
    const health = await Promise.all(services.map((service) => service.health()));
    return health.every((status) => status.healthy);
  }

  async rejectMessage(message, reason, riskLevel, auditId) {
    let rejection;
    try {
      rejection = await this.rejectionTrackingService?.record({
        provider: 'telegram',
        reason,
        riskLevel,
        chatId: message.chatId,
        userId: message.userId,
        username: message.username,
        messageId: message.id,
        text: message.text,
        auditId,
      });
    } catch (_storeError) {
      return this.channelService.failClosed(message, 'TELEGRAM_REJECTION_STORE_UNAVAILABLE');
    }
    const response = await this.channelService.failClosed(message, reason);
    response.rejectionId = rejection?.id;
    return response;
  }

  async sendReply(response) {
    const dryRun = this.config.dryRun || this.config.replyDryRun || response.dryRun;
    const destinationAllowed = this.config.allowedChatIds.includes(String(response.chatId || ''))
      && this.config.allowedUserIds.includes(String(response.userId || ''));
    if (!response.inReplyToMessageId || !destinationAllowed) {
      return { status: 'blocked', warnings: ['Telegram proactive or destination-overridden reply was blocked.'] };
    }
    if (!this.config.enabled || !this.config.replyEnabled || dryRun) {
      return {
        status: 'dry_run',
        warnings: ['Telegram reply was not sent because the channel is disabled or in dry-run mode.'],
      };
    }
    if (!this.config.realMode || !this.config.botToken || !response.chatId) {
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
