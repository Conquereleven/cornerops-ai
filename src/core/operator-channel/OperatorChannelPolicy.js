const { OPERATOR_CHANNEL_PROVIDERS } = require('./operatorChannelTypes');

const normalize = (value) => String(value || '').toLowerCase();
const includesAny = (text, patterns) => patterns.some((pattern) => text.includes(pattern));

class OperatorChannelPolicy {
  constructor(config = {}) {
    this.config = config;
  }

  evaluate(message = {}) {
    const deny = (reason, code, options = {}) => ({
      allowed: false,
      reason,
      code,
      riskLevel: options.riskLevel || 'high',
      replyAllowed: Boolean(options.replyAllowed),
      dryRun: this.config.dryRun !== false,
      requiresApproval: Boolean(options.requiresApproval),
      warnings: [code],
    });
    if (!OPERATOR_CHANNEL_PROVIDERS.includes(message.provider)) {
      return deny('Unknown operator channel provider.', 'OPERATOR_CHANNEL_PROVIDER_DENIED');
    }
    if (!this.config.enabled) {
      return deny('Real operator channel is disabled.', 'OPERATOR_CHANNEL_DISABLED');
    }
    if (message.provider !== this.config.provider) {
      return deny('Operator channel provider is not selected.', 'OPERATOR_CHANNEL_PROVIDER_MISMATCH');
    }
    if (this.config.providerEnabled === false) {
      return deny('Selected operator channel provider is disabled.', 'OPERATOR_CHANNEL_PROVIDER_DISABLED');
    }
    if (
      !this.config.failClosed
      || !this.config.requireAudit
      || !this.config.piiMasking
      || !this.config.logSanitization
      || !this.config.rejectUnknownSenders
      || !this.config.requireApproval
      || !this.config.requireApprovalForExternalActions
      || !this.config.requireApprovalForWrites
      || this.config.dryRun !== true
      || this.config.mode !== 'read_only'
    ) {
      return deny('Required operator channel safety controls are unavailable.', 'OPERATOR_CHANNEL_UNSAFE_CONFIG');
    }
    if (!message.userId) {
      return deny('Operator identity is required.', 'OPERATOR_CHANNEL_USER_REQUIRED');
    }
    const users = this.config.allowedUserIds || [];
    const destinations = [
      ...(this.config.allowedChannelIds || []),
      ...(this.config.allowedChatIds || []),
    ];
    const destination = message.chatId || message.channelId;
    if (this.config.requireAllowlist && message.provider !== 'mock' && (!users.length || !destinations.length)) {
      return deny('Operator channel allowlists are required.', 'OPERATOR_CHANNEL_ALLOWLIST_REQUIRED');
    }
    if (users.length && !users.includes(message.userId)) {
      return deny('Unknown operator sender.', 'OPERATOR_CHANNEL_UNKNOWN_SENDER');
    }
    if (!destination) {
      return deny('Operator channel destination is required.', 'OPERATOR_CHANNEL_DESTINATION_REQUIRED');
    }
    if (destinations.length && !destinations.includes(destination)) {
      return deny('Unknown operator channel or chat.', 'OPERATOR_CHANNEL_UNKNOWN_DESTINATION');
    }
    if (message.text.length > this.config.maxMessageChars) {
      return deny('Operator message exceeds the configured safety limit.', 'OPERATOR_CHANNEL_MESSAGE_TOO_LONG', {
        replyAllowed: true,
        riskLevel: 'medium',
      });
    }
    const text = normalize(message.text);
    if (includesAny(text, ['send ', 'envia ', 'enviar ', 'email real', 'whatsapp', 'sync whatsapp', 'message to '])) {
      return deny('External sends and WhatsApp are blocked in v0.6.', 'OPERATOR_CHANNEL_EXTERNAL_SEND_BLOCKED', {
        replyAllowed: true,
        requiresApproval: true,
      });
    }
    if (includesAny(text, [
      'mark paid',
      'mark this order',
      'as paid',
      'marca como pagad',
      'update status',
      'cambia el estado',
      'delete ',
      'borra ',
      'merge ',
      'deploy ',
    ])) {
      return deny('Production writes are blocked in v0.6.', 'OPERATOR_CHANNEL_WRITE_BLOCKED', {
        replyAllowed: true,
        requiresApproval: true,
      });
    }
    return {
      allowed: true,
      riskLevel: 'low',
      replyAllowed: this.config.replyEnabled !== false,
      dryRun: this.config.replyDryRun !== false,
      requiresApproval: false,
      warnings: [],
    };
  }
}

module.exports = { OperatorChannelPolicy };
