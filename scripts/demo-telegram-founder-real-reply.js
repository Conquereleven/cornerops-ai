#!/usr/bin/env node
const { OperatorChatResponseFormatter } = require('../src/core/operator/OperatorChatResponseFormatter');
const { TelegramOperatorChannelAdapter } = require('../src/integrations/telegram/TelegramOperatorChannelAdapter');
const {
  TelegramFounderPollingService,
  buildTelegramPollingAdapterConfig,
} = require('../src/integrations/telegram/TelegramFounderPollingService');
const { TelegramFounderRealReplyService } = require('../src/integrations/telegram/TelegramFounderRealReplyService');

const update = (overrides = {}) => ({
  update_id: overrides.updateId || 1220,
  message: {
    message_id: overrides.messageId || 1220,
    date: 1781910000,
    chat: { id: overrides.chatId || 7001, type: overrides.chatType || 'private' },
    from: { id: overrides.userId || 7001, username: 'founder' },
    text: overrides.text || 'founder daily',
  },
});

const createMemorySecurity = () => {
  const seen = new Set();
  let rateLimited = false;
  return {
    setRateLimited: (value) => { rateLimited = value; },
    rateLimitService: {
      check: async () => (rateLimited
        ? { allowed: false, reason: 'rate_limit_exceeded', auditId: 'audit-rate-v122' }
        : { allowed: true, reason: 'allowed' }),
      health: async () => ({ healthy: true }),
    },
    replayProtectionService: {
      checkAndRecord: async (message) => {
        const key = message.metadata?.telegramUpdateId || message.id;
        if (seen.has(key)) return { allowed: false, reason: 'duplicate', auditId: 'audit-replay-v122' };
        seen.add(key);
        return { allowed: true, reason: 'new' };
      },
      health: async () => ({ healthy: true }),
    },
    rejectionTrackingService: {
      records: [],
      record: async function record(entry) {
        this.records.push({ reason: entry.reason, riskLevel: entry.riskLevel });
        return { id: `rejection-v122-${this.records.length}` };
      },
      health: async () => ({ healthy: true }),
    },
  };
};

const createDemoService = (overrides = {}) => {
  const config = {
    telegramOperatorEnabled: true,
    telegramOperatorMode: 'polling',
    telegramOperatorBotToken: 'local-token-placeholder',
    telegramOperatorAllowedUserIds: ['7001'],
    telegramOperatorAllowedChatIds: ['7001'],
    telegramOperatorRequireDm: true,
    telegramOperatorRejectGroups: true,
    telegramOperatorReplyEnabled: true,
    telegramOperatorReplyDryRun: true,
    telegramOperatorDryRun: true,
    corneropsTelegramAllowPolling: true,
    corneropsTelegramAllowRealReply: false,
    corneropsTelegramDryRun: true,
    corneropsTelegramRealMode: false,
    corneropsTelegramReadOnly: true,
    corneropsTelegramFailClosed: true,
    corneropsTelegramPollingIntervalMs: 1,
    corneropsTelegramMaxMessageChars: 4000,
    ...overrides,
  };
  const security = createMemorySecurity();
  const replyService = new TelegramFounderRealReplyService({
    config,
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true }) }),
  });
  const adapter = new TelegramOperatorChannelAdapter({
    config: buildTelegramPollingAdapterConfig(config),
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true }) }),
    rateLimitService: security.rateLimitService,
    rejectionTrackingService: security.rejectionTrackingService,
    replayProtectionService: security.replayProtectionService,
  });
  const service = new TelegramFounderPollingService({
    adapter,
    auditLogService: { record: async () => ({ id: 'audit-v122-demo' }) },
    commandRouter: {
      handle: async ({ requestId, text }) => ({
        requestId,
        status: 'success',
        answerText: `CornerOps demo response for: ${text}`,
        sourceMode: 'mock',
        auditId: 'audit-v122-router',
        warnings: [],
      }),
    },
    config,
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, result: [] }) }),
    formatter: new OperatorChatResponseFormatter({ maxMessageChars: 4000 }),
    replyService,
  });
  adapter.connect(service.createPollingChannelService());
  return { service, security };
};

const main = async () => {
  const missing = createDemoService({
    telegramOperatorEnabled: false,
    telegramOperatorBotToken: '',
    telegramOperatorAllowedUserIds: [],
    telegramOperatorAllowedChatIds: [],
    corneropsTelegramAllowPolling: false,
  }).service.checkConfig();
  const { service, security } = createDemoService();
  const approved = await service.adapter.handlePollingUpdate(update({ updateId: 1 }));
  const unknownUser = await service.adapter.handlePollingUpdate(update({ updateId: 2, userId: 9001 }));
  const unknownChat = await service.adapter.handlePollingUpdate(update({ updateId: 3, chatId: 9001 }));
  let group;
  try {
    group = await service.adapter.handlePollingUpdate(update({ updateId: 4, chatType: 'group' }));
  } catch (error) {
    group = { status: 'blocked', warnings: [error.code] };
  }
  await service.adapter.handlePollingUpdate(update({ updateId: 5 }));
  const duplicate = await service.adapter.handlePollingUpdate(update({ updateId: 5 }));
  security.setRateLimited(true);
  const limited = await service.adapter.handlePollingUpdate(update({ updateId: 6 }));
  const realReplyBlocked = await new TelegramFounderRealReplyService({
    config: service.config,
    fetchImpl: async () => ({ ok: true }),
  }).sendSameChatReply({
    chatId: '7001',
    userId: '7001',
    inReplyToMessageId: '1220',
    text: 'would send only with explicit flags',
  });
  process.stdout.write(`${JSON.stringify({
    demo: 'telegram_founder_real_reply_v1.2.2',
    missingConfig: { mode: missing.mode, missing: missing.missing, tokenPrinted: false },
    simulation: {
      approved,
      unknownUser,
      unknownChat,
      group,
      duplicate,
      limited,
      realReplyBlocked,
    },
    auditSummary: {
      rejections: security.rejectionTrackingService.records.length,
      tokenPrinted: false,
      proactiveOutbound: false,
      writes: 'blocked',
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Telegram founder real reply demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { createDemoService, main, update };
