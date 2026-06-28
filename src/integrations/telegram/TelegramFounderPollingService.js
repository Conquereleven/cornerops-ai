const { TelegramFounderIdHelpService } = require('./TelegramFounderIdHelpService');

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

const buildTelegramPollingAdapterConfig = (config = {}) => ({
  enabled: config.telegramOperatorEnabled
    && config.telegramOperatorMode === 'polling'
    && config.corneropsTelegramAllowPolling,
  realMode: config.corneropsTelegramRealMode,
  botToken: config.telegramOperatorBotToken,
  allowedChatIds: config.telegramOperatorAllowedChatIds || [],
  allowedUserIds: config.telegramOperatorAllowedUserIds || [],
  dryRun: config.corneropsTelegramDryRun !== false || config.telegramOperatorDryRun !== false,
  failClosed: config.corneropsTelegramFailClosed !== false,
  persistentSecurity: true,
  readOnly: config.corneropsTelegramReadOnly !== false,
  rejectGroups: config.telegramOperatorRejectGroups !== false,
  replyDryRun: config.telegramOperatorReplyDryRun !== false
    || config.corneropsTelegramAllowRealReply !== true,
  replyEnabled: config.telegramOperatorReplyEnabled !== false,
  requireDm: config.telegramOperatorRequireDm !== false,
});

class TelegramFounderPollingService {
  constructor({
    adapter,
    auditLogService,
    commandRouter,
    config = {},
    fetchImpl = global.fetch,
    formatter,
    replyService,
  } = {}) {
    this.adapter = adapter;
    this.auditLogService = auditLogService;
    this.commandRouter = commandRouter;
    this.config = config;
    this.fetchImpl = fetchImpl;
    this.formatter = formatter;
    this.replyService = replyService;
    this.offset = 0;
    this.startedAt = null;
    this.lastApprovedInbound = null;
    this.lastReply = null;
  }

  checkConfig({ discovery = false } = {}) {
    const missing = [];
    if (!this.config.telegramOperatorBotToken) missing.push('TELEGRAM_OPERATOR_BOT_TOKEN');
    if (!discovery) {
      if (this.config.telegramOperatorEnabled !== true) missing.push('TELEGRAM_OPERATOR_ENABLED=true');
      if (this.config.telegramOperatorMode !== 'polling') missing.push('TELEGRAM_OPERATOR_MODE=polling');
      if (this.config.corneropsTelegramAllowPolling !== true) missing.push('CORNEROPS_TELEGRAM_ALLOW_POLLING=true');
      if (!this.config.telegramOperatorAllowedUserIds?.length) missing.push('TELEGRAM_OPERATOR_ALLOWED_USER_IDS');
      if (!this.config.telegramOperatorAllowedChatIds?.length) missing.push('TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS');
    }
    const unsafe = [];
    if (this.config.telegramOperatorRequireDm === false) unsafe.push('dm_requirement_disabled');
    if (this.config.telegramOperatorRejectGroups === false) unsafe.push('group_rejection_disabled');
    if (this.config.corneropsTelegramReadOnly === false) unsafe.push('read_only_disabled');
    if (this.config.corneropsTelegramFailClosed === false) unsafe.push('fail_closed_disabled');
    if (this.config.corneropsTelegramAllowRealReply === true && this.config.telegramOperatorReplyDryRun !== false) {
      unsafe.push('real_reply_flag_set_but_reply_dry_run_still_enabled');
    }
    return {
      check: discovery ? 'telegram_founder_id_discovery_v1.2.2' : 'telegram_founder_polling_v1.2.2',
      safe: unsafe.length === 0,
      mode: missing.length ? 'missing_config'
        : unsafe.length ? 'blocked_unsafe_config'
          : this.config.corneropsTelegramAllowRealReply ? 'polling_real_reply_ready' : 'polling_dry_run_ready',
      enabled: this.config.telegramOperatorEnabled === true,
      operatorMode: this.config.telegramOperatorMode || 'webhook',
      pollingAllowed: this.config.corneropsTelegramAllowPolling === true,
      realMode: this.config.corneropsTelegramRealMode === true,
      readOnly: this.config.corneropsTelegramReadOnly !== false,
      dryRun: this.config.corneropsTelegramDryRun !== false,
      replyDryRun: this.config.telegramOperatorReplyDryRun !== false,
      realReplyAllowed: this.config.corneropsTelegramAllowRealReply === true,
      allowedUsersCount: this.config.telegramOperatorAllowedUserIds?.length || 0,
      allowedChatsCount: this.config.telegramOperatorAllowedChatIds?.length || 0,
      missing,
      unsafe,
      tokenPrinted: false,
      webhookSecretPrinted: false,
      proactiveOutbound: false,
      customerChannels: false,
      writesBlocked: true,
    };
  }

  createPollingChannelService() {
    return {
      handleInbound: async (message) => {
        this.lastApprovedInbound = {
          at: new Date().toISOString(),
          chatId: message.chatId,
          userId: message.userId,
          messageId: message.id,
          messageLength: message.text.length,
        };
        const output = await this.commandRouter.handle({
          channel: 'telegram',
          metadata: { telegramPolling: true, ...message.metadata },
          operatorId: message.userId,
          requestId: message.id,
          text: message.text,
        });
        const text = this.formatter.format(output);
        const reply = await this.replyService.sendSameChatReply({
          chatId: message.chatId,
          userId: message.userId,
          inReplyToMessageId: message.metadata?.telegramMessageId || message.id,
          text,
        });
        this.lastReply = {
          at: new Date().toISOString(),
          chatId: message.chatId,
          userId: message.userId,
          status: reply.status,
          auditId: output.auditId,
        };
        await this.auditLogService?.record({
          requestId: message.id,
          eventType: 'telegram_founder_polling_reply',
          dataSource: 'telegram_founder_polling',
          operation: 'reply_to_founder',
          userId: message.userId,
          channel: 'telegram',
          policyDecision: reply.status === 'sent' ? 'allowed' : 'dry_run',
          status: reply.status,
          sanitizedOutput: {
            chatId: message.chatId,
            replyLength: text.length,
            sameChatOnly: true,
          },
        });
        return {
          messageId: message.id,
          provider: 'telegram',
          chatId: message.chatId,
          userId: message.userId,
          text,
          status: reply.status,
          auditId: output.auditId,
          warnings: [...new Set([...(output.warnings || []), ...(reply.warnings || [])])],
        };
      },
      failClosed: async (message, reason) => ({
        messageId: message.id,
        provider: 'telegram',
        chatId: message.chatId,
        userId: message.userId,
        text: 'CornerOps rejected this Telegram message. No action was executed.',
        status: 'blocked',
        warnings: [reason],
      }),
    };
  }

  async getUpdates({ offset = this.offset, timeout = 0 } = {}) {
    const url = new URL(`https://api.telegram.org/bot${this.config.telegramOperatorBotToken}/getUpdates`);
    if (offset) url.searchParams.set('offset', String(offset));
    url.searchParams.set('timeout', String(timeout));
    url.searchParams.set('allowed_updates', JSON.stringify(['message']));
    const response = await this.fetchImpl(url.toString(), { method: 'GET' });
    if (!response.ok) {
      return { ok: false, updates: [], error: 'TELEGRAM_GET_UPDATES_FAILED' };
    }
    const payload = await response.json();
    return { ok: payload.ok === true, updates: payload.result || [], error: payload.ok ? undefined : 'TELEGRAM_GET_UPDATES_NOT_OK' };
  }

  async pollOnce() {
    const status = this.checkConfig();
    if (status.mode === 'missing_config' || status.mode === 'blocked_unsafe_config') {
      return { status: status.mode, config: status, processed: [], nextOffset: this.offset };
    }
    const updates = await this.getUpdates({ offset: this.offset, timeout: 0 });
    if (!updates.ok) return { status: 'error', config: status, processed: [], warnings: [updates.error] };
    const processed = [];
    for (const update of updates.updates) {
      this.offset = Math.max(this.offset, Number(update.update_id || 0) + 1);
      try {
        processed.push(await this.adapter.handlePollingUpdate(update));
      } catch (error) {
        processed.push({ status: 'blocked', warnings: [error.code || error.message] });
      }
    }
    return { status: 'ok', config: status, processed, nextOffset: this.offset };
  }

  async runPolling({ maxIterations = Number.POSITIVE_INFINITY, stopAfterMs } = {}) {
    this.startedAt = new Date().toISOString();
    const status = this.checkConfig();
    if (status.mode === 'missing_config' || status.mode === 'blocked_unsafe_config') {
      return { status: status.mode, config: status, iterations: 0, processed: [] };
    }
    const started = Date.now();
    const processed = [];
    let iterations = 0;
    while (iterations < maxIterations) {
      if (stopAfterMs && Date.now() - started >= stopAfterMs) break;
      const result = await this.pollOnce();
      processed.push(...result.processed);
      iterations += 1;
      if (iterations < maxIterations) await sleep(this.config.corneropsTelegramPollingIntervalMs || 3000);
    }
    return { status: 'stopped', config: status, iterations, processed };
  }

  async discoverFounderIds({ windowMs = 60000, maxIterations = Number.POSITIVE_INFINITY } = {}) {
    const status = this.checkConfig({ discovery: true });
    if (status.mode === 'missing_config' || status.mode === 'blocked_unsafe_config') {
      return { status: status.mode, config: status, candidates: [], instructions: new TelegramFounderIdHelpService().instructions() };
    }
    const helper = new TelegramFounderIdHelpService();
    const started = Date.now();
    const candidates = [];
    let iterations = 0;
    while (iterations < maxIterations && Date.now() - started < windowMs) {
      const updates = await this.getUpdates({ offset: this.offset, timeout: 0 });
      if (!updates.ok) return { status: 'error', config: status, candidates, warnings: [updates.error] };
      for (const update of updates.updates) {
        this.offset = Math.max(this.offset, Number(update.update_id || 0) + 1);
        const candidate = helper.extractCandidate(update);
        if (!candidate.groupRejected) candidates.push(candidate);
      }
      if (candidates.length) break;
      iterations += 1;
      await sleep(this.config.corneropsTelegramPollingIntervalMs || 3000);
    }
    return {
      status: candidates.length ? 'candidate_found' : 'no_candidate_found',
      config: status,
      candidates,
      instructions: helper.instructions(),
      fullMessageTextPrinted: false,
      repliesSent: false,
      autoAllowlisted: false,
    };
  }
}

module.exports = {
  TelegramFounderPollingService,
  buildTelegramPollingAdapterConfig,
};
