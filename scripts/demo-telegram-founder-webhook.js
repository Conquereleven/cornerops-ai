#!/usr/bin/env node
const { TelegramOperatorChannelAdapter } = require('../src/integrations/telegram/TelegramOperatorChannelAdapter');
const { TelegramFounderWebhookConfigValidator } = require('../src/integrations/telegram/TelegramFounderWebhookConfigValidator');
const { TelegramFounderIdHelpService } = require('../src/integrations/telegram/TelegramFounderIdHelpService');
const env = require('../src/config/env');

const DEMO_SECRET = ['demo', 'founder', 'webhook', 'placeholder'].join('-');

const update = (overrides = {}) => ({
  update_id: overrides.updateId || 1210,
  message: {
    message_id: overrides.messageId || 1210,
    date: 1781910000,
    chat: { id: overrides.chatId || 7001, type: overrides.chatType || 'private' },
    from: { id: overrides.userId || 7001, username: 'founder' },
    text: overrides.text || 'founder daily',
  },
});

const createReplay = () => {
  const seen = new Set();
  return {
    checkAndRecord: async (message) => {
      const key = message.metadata?.telegramUpdateId || message.id;
      if (seen.has(key)) return { allowed: false, reason: 'duplicate', auditId: 'audit-v121-replay' };
      seen.add(key);
      return { allowed: true, reason: 'new', auditId: 'audit-v121-replay-new' };
    },
    health: async () => ({ healthy: true, provider: 'memory' }),
  };
};

const createRateLimit = () => ({
  blocked: false,
  check: async function check() {
    if (this.blocked) return { allowed: false, reason: 'rate_limit_exceeded', auditId: 'audit-v121-rate' };
    return { allowed: true, reason: 'allowed', auditId: 'audit-v121-rate-ok' };
  },
  health: async () => ({ healthy: true, provider: 'memory' }),
});

const runSimulation = async () => {
  const rejections = [];
  const rateLimit = createRateLimit();
  const adapter = new TelegramOperatorChannelAdapter({
    config: {
      enabled: true,
      realMode: false,
      botToken: 'present-but-never-printed',
      webhookSecret: DEMO_SECRET,
      allowedChatIds: ['7001'],
      allowedUserIds: ['7001'],
      dryRun: true,
      persistentSecurity: true,
      readOnly: true,
      rejectGroups: true,
      replyDryRun: true,
      replyEnabled: true,
      requireDm: true,
    },
    fetchImpl: async () => {
      throw new Error('Telegram API must not be called in v1.2.1 dry-run demo.');
    },
    rateLimitService: rateLimit,
    rejectionTrackingService: {
      record: async (record) => {
        rejections.push({ reason: record.reason, riskLevel: record.riskLevel });
        return { id: `rejection-v121-${rejections.length}` };
      },
    },
    replayProtectionService: createReplay(),
  }).connect({
    handleInbound: async (message) => ({
      status: 'dry_run_webhook_verified',
      provider: 'telegram',
      chatId: message.chatId,
      userId: message.userId,
      inReplyToMessageId: message.id,
      text: 'Dry-run founder reply payload generated. No Telegram message was sent.',
      auditId: 'audit-v121-approved',
      warnings: [],
    }),
    failClosed: async (_message, reason) => ({ status: 'blocked', warnings: [reason], auditId: `audit-${reason}` }),
  });

  const approved = await adapter.handleWebhook(update({ updateId: 1 }), DEMO_SECRET);
  const dryRunReplyPayload = await adapter.sendReply({
    chatId: approved.chatId,
    userId: approved.userId,
    inReplyToMessageId: approved.inReplyToMessageId,
    text: approved.text,
    dryRun: true,
  });
  const unknownUser = await adapter.handleWebhook(update({ updateId: 2, userId: 9009 }), DEMO_SECRET);
  const unknownChat = await adapter.handleWebhook(update({ updateId: 3, chatId: 9009 }), DEMO_SECRET);
  let group;
  try {
    group = await adapter.handleWebhook(update({ updateId: 4, chatType: 'group' }), DEMO_SECRET);
  } catch (error) {
    group = { status: 'blocked', warnings: [error.code] };
  }
  await adapter.handleWebhook(update({ updateId: 5 }), DEMO_SECRET);
  const duplicate = await adapter.handleWebhook(update({ updateId: 5 }), DEMO_SECRET);
  rateLimit.blocked = true;
  const limited = await adapter.handleWebhook(update({ updateId: 6 }), DEMO_SECRET);

  return {
    approved,
    unknownUser,
    unknownChat,
    group,
    duplicate,
    limited,
    dryRunReplyPayload,
    auditSummary: {
      rejections: rejections.length,
      rejectionReasons: rejections.map((record) => record.reason),
      telegramApiCalled: false,
      proactiveOutbound: false,
    },
  };
};

const main = async () => {
  const configCheck = new TelegramFounderWebhookConfigValidator({ config: env }).check();
  const idHelp = new TelegramFounderIdHelpService().extractCandidate(update({ text: 'redacted local setup ping' }));
  const simulation = await runSimulation();
  const output = {
    demo: 'telegram_founder_webhook_v1.2.1',
    missingConfigMode: {
      mode: configCheck.mode,
      missing: configCheck.missing,
      tokenPrinted: configCheck.secrets.botTokenPrinted,
      webhookSecretPrinted: configCheck.secrets.webhookSecretPrinted,
      fullChatTextPrinted: configCheck.secrets.fullChatTextPrinted,
    },
    idHelp,
    simulation,
    safety: {
      realReplies: 'disabled_by_default',
      webhookSetupApiCalls: 'disabled_by_default',
      customerChannels: 'disabled',
      writes: 'blocked',
    },
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Telegram founder webhook demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main, runSimulation };
