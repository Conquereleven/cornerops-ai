#!/usr/bin/env node
const env = require('../src/config/env');
const { TelegramOperatorChannelAdapter } = require('../src/integrations/telegram/TelegramOperatorChannelAdapter');
const { TelegramOperatorConfigValidator } = require('../src/integrations/telegram/TelegramOperatorConfigValidator');

const update = (overrides = {}) => ({
  update_id: overrides.updateId || 1200,
  message: {
    message_id: overrides.messageId || 1200,
    date: 1781910000,
    chat: { id: overrides.chatId || 7001, type: overrides.chatType || 'private' },
    from: { id: overrides.userId || 7001, username: 'founder' },
    text: overrides.text || 'founder daily',
  },
});

const makeReplay = () => {
  const seen = new Set();
  return {
    checkAndRecord: async (message) => {
      const key = message.metadata?.telegramUpdateId || message.id;
      if (seen.has(key)) return { allowed: false, reason: 'duplicate', auditId: 'audit-replay-demo' };
      seen.add(key);
      return { allowed: true, reason: 'new' };
    },
    health: async () => ({ healthy: true, provider: 'memory' }),
  };
};

const makeRateLimit = () => ({
  count: 0,
  check: async () => {
    this.count = (this.count || 0) + 1;
    return { allowed: true, reason: 'allowed' };
  },
  health: async () => ({ healthy: true, provider: 'memory' }),
});

const main = async () => {
  const validation = new TelegramOperatorConfigValidator({ config: env }).check();
  const rejections = [];
  const replay = makeReplay();
  const rateLimit = makeRateLimit();
  const channelService = {
    handleInbound: async (message) => ({
      status: 'dry_run',
      provider: 'telegram',
      chatId: message.chatId,
      userId: message.userId,
      text: `dry-run reply to ${message.text}`,
      auditId: 'audit-telegram-demo',
      warnings: [],
    }),
    failClosed: async (_message, reason) => ({ status: 'blocked', warnings: [reason] }),
  };
  const adapter = new TelegramOperatorChannelAdapter({
    config: {
      enabled: true,
      realMode: false,
      botToken: 'demo-token-not-real',
      webhookSecret: 'demo-secret-not-printed',
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
    rateLimitService: rateLimit,
    rejectionTrackingService: { record: async (record) => { rejections.push(record); return { id: `rej-${rejections.length}` }; }, summary: async () => ({ rejectedLast24h: rejections.length }) },
    replayProtectionService: replay,
  }).connect(channelService);

  const approved = await adapter.handleWebhook(update({ updateId: 1 }), 'demo-secret-not-printed');
  const unknownUser = await adapter.handleWebhook(update({ updateId: 2, userId: 9999 }), 'demo-secret-not-printed');
  const unknownChat = await adapter.handleWebhook(update({ updateId: 3, chatId: 9999 }), 'demo-secret-not-printed');
  let group;
  try {
    group = await adapter.handleWebhook(update({ updateId: 4, chatType: 'group' }), 'demo-secret-not-printed');
  } catch (error) {
    group = { status: 'blocked', warnings: [error.code] };
  }
  await adapter.handleWebhook(update({ updateId: 5 }), 'demo-secret-not-printed');
  const duplicate = await adapter.handleWebhook(update({ updateId: 5 }), 'demo-secret-not-printed');
  rateLimit.check = async () => ({ allowed: false, reason: 'rate_limit_exceeded', auditId: 'audit-rate-demo' });
  const limited = await adapter.handleWebhook(update({ updateId: 6 }), 'demo-secret-not-printed');
  const reply = await adapter.sendReply({
    chatId: '7001',
    userId: '7001',
    text: 'safe dry-run reply',
    inReplyToMessageId: 'telegram-1',
  });

  process.stdout.write(`${JSON.stringify({
    demo: 'telegram_operator_v1.2',
    validation: {
      mode: validation.mode,
      missing: validation.missing,
      botTokenPrinted: validation.secrets.botTokenPrinted,
      webhookSecretPrinted: validation.secrets.webhookSecretPrinted,
    },
    simulation: { approved, unknownUser, unknownChat, group, duplicate, limited, reply },
    auditSummary: { rejections: rejections.length, proactiveOutbound: false, externalSends: 'blocked' },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Telegram operator demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
