const redactPresence = (value) => Boolean(value) ? 'present' : 'missing';

class TelegramFounderWebhookConfigValidator {
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
    if (this.config.telegramOperatorRequireDm === false) unsafe.push('dm_requirement_disabled');
    if (this.config.telegramOperatorRejectGroups === false) unsafe.push('group_rejection_disabled');
    if (this.config.corneropsTelegramReadOnly === false) unsafe.push('read_only_disabled');
    if (this.config.corneropsTelegramFailClosed === false) unsafe.push('fail_closed_disabled');
    if (this.config.corneropsTelegramDryRun === false) unsafe.push('telegram_dry_run_disabled');
    if (this.config.telegramOperatorReplyDryRun === false && this.config.corneropsTelegramAllowRealReply !== true) {
      unsafe.push('reply_dry_run_disabled_without_explicit_real_reply_flag');
    }
    if (this.config.corneropsTelegramAllowRealReply === true && this.config.telegramOperatorReplyDryRun !== false) {
      unsafe.push('real_reply_flag_set_but_reply_dry_run_still_enabled');
    }

    const readyForDryRunWebhook = missing.length === 0
      && unsafe.length === 0
      && this.config.telegramOperatorRequireDm !== false
      && this.config.telegramOperatorRejectGroups !== false
      && this.config.corneropsTelegramReadOnly !== false
      && this.config.corneropsTelegramFailClosed !== false;

    return {
      check: 'telegram_founder_webhook_v1.2.1',
      safe: unsafe.length === 0,
      mode: readyForDryRunWebhook ? 'dry_run_webhook_ready' : 'missing_config',
      dryRunWebhookVerified: false,
      enabled: Boolean(this.config.telegramOperatorEnabled),
      realReceiveModeReady: readyForDryRunWebhook,
      realMode: Boolean(this.config.corneropsTelegramRealMode),
      dryRun: this.config.corneropsTelegramDryRun !== false,
      readOnly: this.config.corneropsTelegramReadOnly !== false,
      failClosed: this.config.corneropsTelegramFailClosed !== false,
      webhookSetup: {
        allowed: this.config.corneropsTelegramAllowWebhookSetup === true,
        default: 'disabled',
        apiCallAttempted: false,
      },
      reply: {
        enabled: this.config.telegramOperatorReplyEnabled !== false,
        dryRun: this.config.telegramOperatorReplyDryRun !== false,
        realReplyAllowed: this.config.corneropsTelegramAllowRealReply === true,
        proactiveOutbound: false,
        sameChatOnly: true,
      },
      credentials: {
        botToken: redactPresence(this.config.telegramOperatorBotToken),
        webhookSecret: redactPresence(this.config.telegramOperatorWebhookSecret),
        allowedUsersCount: this.config.telegramOperatorAllowedUserIds?.length || 0,
        allowedChatsCount: this.config.telegramOperatorAllowedChatIds?.length || 0,
      },
      controls: {
        requireDm: this.config.telegramOperatorRequireDm !== false,
        rejectGroups: this.config.telegramOperatorRejectGroups !== false,
      },
      secrets: {
        botTokenPrinted: false,
        webhookSecretPrinted: false,
        fullChatTextPrinted: false,
      },
      missing,
      unsafe,
      founderNextSteps: missing.length
        ? [
          `Set missing env vars locally only: ${missing.join(', ')}.`,
          'Keep TELEGRAM_OPERATOR_REPLY_DRY_RUN=true and CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY=false.',
        ]
        : ['Run npm run demo:telegram-founder-webhook to verify a dry-run webhook path.'],
    };
  }
}

module.exports = { TelegramFounderWebhookConfigValidator };
