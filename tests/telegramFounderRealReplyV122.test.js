const { execFileSync } = require('child_process');
const path = require('path');
const { OperatorChatResponseFormatter } = require('../src/core/operator/OperatorChatResponseFormatter');
const { TelegramOperatorChannelAdapter } = require('../src/integrations/telegram/TelegramOperatorChannelAdapter');
const {
  TelegramFounderPollingService,
  buildTelegramPollingAdapterConfig,
} = require('../src/integrations/telegram/TelegramFounderPollingService');
const { TelegramFounderRealReplyService } = require('../src/integrations/telegram/TelegramFounderRealReplyService');
const { ControlTowerV11ReportService } = require('../src/core/control-tower/ControlTowerV11ReportService');

const root = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

const telegramUpdate = (overrides = {}) => ({
  update_id: overrides.updateId || 1222,
  message: {
    message_id: overrides.messageId || 1222,
    date: 1781910000,
    chat: { id: overrides.chatId || 7001, type: overrides.chatType || 'private' },
    from: { id: overrides.userId || 7001, username: 'founder' },
    text: overrides.text || 'founder daily',
  },
});

const baseConfig = (overrides = {}) => ({
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
});

const createServices = (configOverrides = {}) => {
  const config = baseConfig(configOverrides);
  const seen = new Set();
  let rateLimited = false;
  const rejectionRecords = [];
  const replyFetch = jest.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
  const replyService = new TelegramFounderRealReplyService({ config, fetchImpl: replyFetch });
  const adapter = new TelegramOperatorChannelAdapter({
    config: buildTelegramPollingAdapterConfig(config),
    rateLimitService: {
      check: jest.fn(async () => (rateLimited
        ? { allowed: false, reason: 'rate_limit_exceeded', auditId: 'audit-rate' }
        : { allowed: true })),
      health: async () => ({ healthy: true }),
    },
    rejectionTrackingService: {
      record: jest.fn(async (record) => {
        rejectionRecords.push(record);
        return { id: `rejection-${rejectionRecords.length}` };
      }),
      health: async () => ({ healthy: true }),
    },
    replayProtectionService: {
      checkAndRecord: jest.fn(async (message) => {
        const key = message.metadata?.telegramUpdateId;
        if (seen.has(key)) return { allowed: false, reason: 'duplicate', auditId: 'audit-replay' };
        seen.add(key);
        return { allowed: true };
      }),
      health: async () => ({ healthy: true }),
    },
  });
  const service = new TelegramFounderPollingService({
    adapter,
    auditLogService: { record: jest.fn(async () => ({ id: 'audit-polling' })) },
    commandRouter: {
      handle: jest.fn(async ({ requestId, text }) => ({
        requestId,
        status: 'success',
        answerText: `reply for ${text}`,
        sourceMode: 'mock',
        auditId: 'audit-router',
        warnings: [],
      })),
    },
    config,
    formatter: new OperatorChatResponseFormatter({ maxMessageChars: 4000 }),
    replyService,
  });
  adapter.connect(service.createPollingChannelService());
  return {
    adapter,
    config,
    rejectionRecords,
    replyFetch,
    service,
    setRateLimited: (value) => { rateLimited = value; },
  };
};

describe('Telegram founder real reply pilot v1.2.2', () => {
  test('missing token and allowlist degrade safely without printing token', () => {
    const service = new TelegramFounderPollingService({
      config: baseConfig({
        telegramOperatorBotToken: '',
        telegramOperatorAllowedUserIds: [],
        telegramOperatorAllowedChatIds: [],
      }),
    });
    const result = service.checkConfig();
    expect(result.mode).toBe('missing_config');
    expect(result.missing).toEqual(expect.arrayContaining([
      'TELEGRAM_OPERATOR_BOT_TOKEN',
      'TELEGRAM_OPERATOR_ALLOWED_USER_IDS',
      'TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS',
    ]));
    expect(JSON.stringify(result)).not.toContain('local-token-placeholder');
    expect(result.tokenPrinted).toBe(false);
  });

  test('approved founder update routes and creates dry-run reply by default', async () => {
    const { service, replyFetch } = createServices();
    const result = await service.adapter.handlePollingUpdate(telegramUpdate({ updateId: 1 }));
    expect(result.status).toBe('dry_run');
    expect(result.chatId).toBe('7001');
    expect(result.userId).toBe('7001');
    expect(result.text).toContain('Source: mock');
    expect(result.text).toContain('Audit: audit-router');
    expect(replyFetch).not.toHaveBeenCalled();
  });

  test('unknown user, unknown chat, group, duplicate and rate limit are rejected', async () => {
    const { service, setRateLimited } = createServices();
    await expect(service.adapter.handlePollingUpdate(telegramUpdate({ updateId: 2, userId: 9999 })))
      .resolves.toMatchObject({ status: 'blocked', warnings: ['TELEGRAM_UNKNOWN_USER'] });
    await expect(service.adapter.handlePollingUpdate(telegramUpdate({ updateId: 3, chatId: 9999 })))
      .resolves.toMatchObject({ status: 'blocked', warnings: ['TELEGRAM_UNKNOWN_CHAT'] });
    await expect(service.adapter.handlePollingUpdate(telegramUpdate({ updateId: 4, chatType: 'group' })))
      .rejects.toMatchObject({ code: 'TELEGRAM_GROUP_DENIED' });
    await service.adapter.handlePollingUpdate(telegramUpdate({ updateId: 5 }));
    await expect(service.adapter.handlePollingUpdate(telegramUpdate({ updateId: 5 })))
      .resolves.toMatchObject({ status: 'blocked', warnings: ['TELEGRAM_REPLAY_DUPLICATE'] });
    setRateLimited(true);
    await expect(service.adapter.handlePollingUpdate(telegramUpdate({ updateId: 6 })))
      .resolves.toMatchObject({ status: 'blocked', warnings: ['TELEGRAM_RATE_LIMIT_EXCEEDED'] });
  });

  test('real replies require explicit flags and remain same-chat only', async () => {
    const dryRunReply = new TelegramFounderRealReplyService({ config: baseConfig() });
    await expect(dryRunReply.sendSameChatReply({
      chatId: '7001',
      userId: '7001',
      inReplyToMessageId: '1222',
      text: 'hello',
    })).resolves.toMatchObject({ status: 'dry_run' });

    const fetchImpl = jest.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    const realReply = new TelegramFounderRealReplyService({
      config: baseConfig({
        corneropsTelegramAllowRealReply: true,
        corneropsTelegramDryRun: false,
        corneropsTelegramRealMode: true,
        telegramOperatorReplyDryRun: false,
        telegramOperatorDryRun: false,
      }),
      fetchImpl,
    });
    await expect(realReply.sendSameChatReply({
      chatId: '7001',
      userId: '7001',
      inReplyToMessageId: '1222',
      text: 'hello',
    })).resolves.toMatchObject({ status: 'sent' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await expect(realReply.sendSameChatReply({
      chatId: '9999',
      userId: '7001',
      inReplyToMessageId: '1222',
      text: 'wrong chat',
    })).resolves.toMatchObject({ status: 'blocked' });
  });

  test('ID discovery uses getUpdates, surfaces IDs, rejects groups and does not store text', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        result: [
          telegramUpdate({ updateId: 10, chatType: 'group', text: 'group secret text' }),
          telegramUpdate({ updateId: 11, text: 'private secret text' }),
        ],
      }),
    }));
    const service = new TelegramFounderPollingService({
      config: baseConfig(),
      fetchImpl,
    });
    const result = await service.discoverFounderIds({ windowMs: 10, maxIterations: 1 });
    expect(result.status).toBe('candidate_found');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({ candidateUserId: '7001', candidateChatId: '7001' });
    expect(JSON.stringify(result)).not.toContain('private secret text');
    expect(result.repliesSent).toBe(false);
    expect(result.autoAllowlisted).toBe(false);
  });

  test('Control Tower and founder daily expose polling readiness', async () => {
    const service = new ControlTowerV11ReportService({
      baseService: {
        getReport: async () => ({
          status: 'healthy',
          safety: { warnings: [], externalSendsBlocked: true, whatsappDisabled: true, nativeToolsDisabled: true, clawhubExecutionDisabled: true },
          github: {},
          businessData: {},
          openclaw: { enabled: false, mode: 'disabled' },
          telegram: { warnings: [], replayProtection: {}, rejectionTracking: {}, rateLimiting: {} },
          operatorChannel: {},
        }),
      },
      businessDataReadinessService: { check: async () => ({ mode: 'mock', warnings: [] }) },
      cornerMexConfigIntakeService: { check: async () => ({ warnings: [], missing: [] }) },
      cornerMexConnector: { getConnectorStatus: async () => ({ sourceMode: 'mock', writesBlocked: true, warnings: [], mappedContracts: [] }) },
      githubReadinessService: { check: async () => ({ mode: 'mock', warnings: [], connected: false }) },
      config: baseConfig({ telegramOperatorBotToken: '' }),
    });
    const report = await service.getReport();
    expect(report.telegramOperator.founderPollingVersion).toBe('v1.2.2');
    expect(report.telegramOperator.pollingAvailable).toBe(true);
    expect(report.telegramOperator.pollingMissingConfig).toContain('TELEGRAM_OPERATOR_BOT_TOKEN');
    expect(report.telegramOperator.exactFounderPollingCommands).toEqual([
      'npm run telegram:founder-id-discovery',
      'npm run telegram:founder-polling',
    ]);
  });

  test.each([
    ['scripts/telegram-founder-id-discovery.js', 'telegram_founder_id_discovery_v1.2.2'],
    ['scripts/telegram-founder-polling.js', 'telegram_founder_polling_v1.2.2'],
    ['scripts/demo-telegram-founder-real-reply.js', 'telegram_founder_real_reply_v1.2.2'],
    ['scripts/demo-v1.2.2.js', '"demo": "v1.2.2"'],
  ])('%s runs without credentials and does not print tokens', (script, expected) => {
    const output = execFileSync(nodeBin, [script], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        TELEGRAM_OPERATOR_BOT_TOKEN: '',
        TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS: '',
        TELEGRAM_OPERATOR_ALLOWED_USER_IDS: '',
        CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY: '',
        CORNEROPS_TELEGRAM_ALLOW_POLLING: '',
      },
      maxBuffer: 5 * 1024 * 1024,
    });
    expect(output).toContain(expected);
    expect(output).not.toContain('local-token-placeholder');
    expect(output).not.toContain('private secret text');
  });
});
