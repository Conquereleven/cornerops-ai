const redact = (value) => Boolean(value) ? 'present' : 'missing';

class TelegramOperatorConfigValidator {
  constructor({ config = {} } = {}) {
    this.config = config;
  }

  check() {
    const missing = [];
    if (!this.config.telegramOperatorBotToken) missing.push('TELEGRAM_OPERATOR_BOT_TOKEN');
    if (!this.config.telegramOperatorWebhookSecret) missing.push('TELEGRAM_OPERATOR_WEBHOOK_SECRET');
    if (!this.config.telegramOperatorAllowedUserIds?.length) missing.push('TELEGRAM_OPERATOR_ALLOWED_USER_IDS');
    if (!this.config.telegramOperatorAllowedChatIds?.length) missing.push('TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS');

    const unsafe = [];
    if (this.config.corneropsTelegramRealMode && !this.config.telegramOperatorBotToken) unsafe.push('real_mode_without_token');
    if (this.config.corneropsTelegramRealMode && !this.config.telegramOperatorAllowedUserIds?.length) unsafe.push('real_mode_without_user_allowlist');
    if (this.config.corneropsTelegramRealMode && !this.config.telegramOperatorAllowedChatIds?.length) unsafe.push('real_mode_without_chat_allowlist');
    if (this.config.telegramOperatorRequireDm === false) unsafe.push('dm_requirement_disabled');
    if (this.config.telegramOperatorRejectGroups === false) unsafe.push('group_rejection_disabled');
    if (this.config.telegramOperatorReplyDryRun === false || this.config.corneropsTelegramDryRun === false) unsafe.push('reply_dry_run_disabled');
    if (this.config.corneropsTelegramReadOnly === false) unsafe.push('read_only_disabled');
    if (this.config.corneropsTelegramFailClosed === false) unsafe.push('fail_closed_disabled');

    const realModeReady = Boolean(
      this.config.telegramOperatorBotToken
      && this.config.telegramOperatorAllowedUserIds?.length
      && this.config.telegramOperatorAllowedChatIds?.length
      && this.config.telegramOperatorWebhookSecret
      && this.config.telegramOperatorRequireDm !== false
      && this.config.telegramOperatorRejectGroups !== false
      && this.config.corneropsTelegramReadOnly !== false
      && this.config.corneropsTelegramFailClosed !== false
      && this.config.corneropsTelegramDryRun !== false
      && this.config.telegramOperatorReplyDryRun !== false
    );

    return {
      check: 'telegram_operator_v1.2',
      safe: unsafe.length === 0,
      mode: this.config.corneropsTelegramRealMode ? (realModeReady ? 'real_dry_run_ready' : 'missing_config') : 'dry_run',
      enabled: Boolean(this.config.telegramOperatorEnabled),
      realMode: Boolean(this.config.corneropsTelegramRealMode),
      dryRun: this.config.corneropsTelegramDryRun !== false,
      readOnly: this.config.corneropsTelegramReadOnly !== false,
      failClosed: this.config.corneropsTelegramFailClosed !== false,
      reply: {
        enabled: this.config.telegramOperatorReplyEnabled !== false,
        dryRun: this.config.telegramOperatorReplyDryRun !== false,
        proactiveOutbound: false,
        sameChatOnly: true,
      },
      security: {
        botToken: redact(this.config.telegramOperatorBotToken),
        webhookSecret: redact(this.config.telegramOperatorWebhookSecret),
        allowedUsersCount: this.config.telegramOperatorAllowedUserIds?.length || 0,
        allowedChatsCount: this.config.telegramOperatorAllowedChatIds?.length || 0,
        requireDm: this.config.telegramOperatorRequireDm !== false,
        rejectGroups: this.config.telegramOperatorRejectGroups !== false,
      },
      secrets: {
        botTokenPrinted: false,
        webhookSecretPrinted: false,
      },
      missing,
      unsafe,
      founderNextSteps: missing.length
        ? [
          `Set missing env vars: ${missing.join(', ')}.`,
          'Keep TELEGRAM_OPERATOR_REPLY_DRY_RUN=true until a founder-only DM is verified.',
        ]
        : ['Telegram operator is configured for founder-only dry-run replies.'],
    };
  }
}

module.exports = { TelegramOperatorConfigValidator };
