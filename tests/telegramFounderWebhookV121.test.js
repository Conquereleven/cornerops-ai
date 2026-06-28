const { execFileSync } = require('child_process');
const path = require('path');
const { TelegramOperatorChannelAdapter } = require('../src/integrations/telegram/TelegramOperatorChannelAdapter');
const { TelegramFounderWebhookConfigValidator } = require('../src/integrations/telegram/TelegramFounderWebhookConfigValidator');
const { TelegramFounderIdHelpService } = require('../src/integrations/telegram/TelegramFounderIdHelpService');
const { ControlTowerV11ReportService } = require('../src/core/control-tower/ControlTowerV11ReportService');

const root = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

const payload = (overrides = {}) => ({
  update_id: overrides.updateId || 121,
  message: {
    message_id: overrides.messageId || 121,
    date: 1781910000,
    chat: { id: overrides.chatId || 7001, type: overrides.chatType || 'private' },
    from: { id: overrides.userId || 7001, username: 'founder' },
    text: overrides.text || 'founder daily',
  },
});

describe('Telegram founder webhook dry-run verification v1.2.1', () => {
  test('config check degrades safely and never prints token or webhook secret', () => {
    const result = new TelegramFounderWebhookConfigValidator({
      config: {
        telegramOperatorBotToken: 'local-token-placeholder',
        telegramOperatorWebhookSecret: 'present-webhook-placeholder',
        telegramOperatorAllowedUserIds: [],
        telegramOperatorAllowedChatIds: [],
        telegramOperatorRequireDm: true,
        telegramOperatorRejectGroups: true,
        telegramOperatorReplyDryRun: true,
        corneropsTelegramDryRun: true,
        corneropsTelegramReadOnly: true,
        corneropsTelegramFailClosed: true,
        corneropsTelegramAllowWebhookSetup: false,
        corneropsTelegramAllowRealReply: false,
      },
    }).check();
    expect(result.mode).toBe('missing_config');
    expect(result.missing).toEqual(expect.arrayContaining([
      'TELEGRAM_OPERATOR_ALLOWED_USER_IDS',
      'TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS',
    ]));
    expect(result.webhookSetup.allowed).toBe(false);
    expect(result.reply.realReplyAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain('local-token-placeholder');
    expect(JSON.stringify(result)).not.toContain('present-webhook-placeholder');
    expect(result.secrets.fullChatTextPrinted).toBe(false);
  });

  test('unsafe real reply and webhook posture is blocked by readiness', () => {
    const result = new TelegramFounderWebhookConfigValidator({
      config: {
        telegramOperatorBotToken: 'present',
        telegramOperatorWebhookSecret: 'present',
        telegramOperatorAllowedUserIds: ['7001'],
        telegramOperatorAllowedChatIds: ['7001'],
        telegramOperatorRequireDm: false,
        telegramOperatorRejectGroups: false,
        telegramOperatorReplyDryRun: false,
        corneropsTelegramDryRun: false,
        corneropsTelegramReadOnly: true,
        corneropsTelegramFailClosed: true,
        corneropsTelegramAllowWebhookSetup: false,
        corneropsTelegramAllowRealReply: false,
      },
    }).check();
    expect(result.safe).toBe(false);
    expect(result.unsafe).toEqual(expect.arrayContaining([
      'dm_requirement_disabled',
      'group_rejection_disabled',
      'telegram_dry_run_disabled',
      'reply_dry_run_disabled_without_explicit_real_reply_flag',
    ]));
  });

  test('approved founder update returns dry-run webhook payload and same-chat dry-run reply only', async () => {
    const channelService = {
      handleInbound: jest.fn(async (message) => ({
        status: 'dry_run_webhook_verified',
        chatId: message.chatId,
        userId: message.userId,
        inReplyToMessageId: message.id,
        text: 'dry-run reply',
        auditId: 'audit-approved',
      })),
      failClosed: jest.fn(async (_message, reason) => ({ status: 'blocked', warnings: [reason] })),
    };
    const fetchImpl = jest.fn();
    const adapter = new TelegramOperatorChannelAdapter({
      config: {
        enabled: true,
        realMode: false,
        botToken: 'token-not-real',
        webhookSecret: 'secret',
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
      fetchImpl,
      rateLimitService: { check: jest.fn(async () => ({ allowed: true })) },
      rejectionTrackingService: { record: jest.fn(async () => ({ id: 'rej' })) },
      replayProtectionService: { checkAndRecord: jest.fn(async () => ({ allowed: true })) },
    }).connect(channelService);
    const result = await adapter.handleWebhook(payload(), 'secret');
    expect(result.status).toBe('dry_run_webhook_verified');
    const reply = await adapter.sendReply({
      chatId: result.chatId,
      userId: result.userId,
      inReplyToMessageId: result.inReplyToMessageId,
      text: result.text,
    });
    expect(reply.status).toBe('dry_run');
    expect(fetchImpl).not.toHaveBeenCalled();
    await expect(adapter.sendReply({ chatId: '9999', userId: '7001', text: 'bad target', inReplyToMessageId: 'x' }))
      .resolves.toMatchObject({ status: 'blocked' });
  });

  test('unknown user, unknown chat, group, duplicate and rate limit are rejected', async () => {
    const seen = new Set();
    let rateLimited = false;
    const adapter = new TelegramOperatorChannelAdapter({
      config: {
        enabled: true,
        realMode: false,
        botToken: 'token-not-real',
        webhookSecret: 'secret',
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
      rateLimitService: {
        check: jest.fn(async () => (rateLimited
          ? { allowed: false, reason: 'rate_limit_exceeded', auditId: 'audit-rate' }
          : { allowed: true })),
      },
      rejectionTrackingService: { record: jest.fn(async () => ({ id: 'rej' })) },
      replayProtectionService: {
        checkAndRecord: jest.fn(async (message) => {
          const key = message.metadata.telegramUpdateId;
          if (seen.has(key)) return { allowed: false, reason: 'duplicate', auditId: 'audit-replay' };
          seen.add(key);
          return { allowed: true };
        }),
      },
    }).connect({
      handleInbound: jest.fn(async () => ({ status: 'dry_run_webhook_verified' })),
      failClosed: jest.fn(async (_message, reason) => ({ status: 'blocked', warnings: [reason] })),
    });
    await expect(adapter.handleWebhook(payload({ updateId: 1, userId: 9999 }), 'secret'))
      .resolves.toMatchObject({ warnings: ['TELEGRAM_UNKNOWN_USER'] });
    await expect(adapter.handleWebhook(payload({ updateId: 2, chatId: 9999 }), 'secret'))
      .resolves.toMatchObject({ warnings: ['TELEGRAM_UNKNOWN_CHAT'] });
    await expect(adapter.handleWebhook(payload({ updateId: 3, chatType: 'group' }), 'secret'))
      .rejects.toMatchObject({ code: 'TELEGRAM_GROUP_DENIED' });
    await adapter.handleWebhook(payload({ updateId: 4 }), 'secret');
    await expect(adapter.handleWebhook(payload({ updateId: 4 }), 'secret'))
      .resolves.toMatchObject({ warnings: ['TELEGRAM_REPLAY_DUPLICATE'] });
    rateLimited = true;
    await expect(adapter.handleWebhook(payload({ updateId: 5 }), 'secret'))
      .resolves.toMatchObject({ warnings: ['TELEGRAM_RATE_LIMIT_EXCEEDED'] });
  });

  test('founder ID help surfaces candidate IDs without storing text or auto-allowlisting', () => {
    const service = new TelegramFounderIdHelpService();
    const candidate = service.extractCandidate(payload({ text: 'this text must not be stored' }));
    expect(candidate.candidateUserId).toBe('7001');
    expect(candidate.candidateChatId).toBe('7001');
    expect(candidate.storedMessageText).toBe(false);
    expect(candidate.autoAllowlisted).toBe(false);
    expect(JSON.stringify(candidate)).not.toContain('this text must not be stored');
  });

  test('Control Tower exposes v1.2.1 founder webhook readiness', async () => {
    const service = new ControlTowerV11ReportService({
      baseService: {
        getReport: async () => ({
          status: 'healthy',
          safety: { warnings: [], externalSendsBlocked: true, whatsappDisabled: true, nativeToolsDisabled: true, clawhubExecutionDisabled: true },
          github: {},
          businessData: {},
          openclaw: { enabled: false, mode: 'disabled' },
          telegram: {
            warnings: [],
            replayProtection: { enabled: true, duplicatesLast24h: 0 },
            rejectionTracking: { enabled: true, byReason: { TELEGRAM_UNKNOWN_USER: 1 } },
            rateLimiting: { enabled: true },
          },
          operatorChannel: {},
        }),
      },
      businessDataReadinessService: { check: async () => ({ mode: 'mock', warnings: [] }) },
      cornerMexConfigIntakeService: { check: async () => ({ warnings: [], missing: [] }) },
      cornerMexConnector: { getConnectorStatus: async () => ({ sourceMode: 'repo_discovered', writesBlocked: true, warnings: [], mappedContracts: [] }) },
      githubReadinessService: { check: async () => ({ mode: 'mock', warnings: [], connected: false }) },
      config: {
        corneropsDryRun: true,
        corneropsControlledActionsDryRun: true,
        telegramOperatorBotToken: '',
        telegramOperatorWebhookSecret: '',
        telegramOperatorAllowedUserIds: [],
        telegramOperatorAllowedChatIds: [],
        telegramOperatorRejectGroups: true,
        telegramOperatorRequireDm: true,
        telegramOperatorReplyDryRun: true,
        corneropsTelegramDryRun: true,
        corneropsTelegramReadOnly: true,
        corneropsTelegramFailClosed: true,
        corneropsTelegramAllowWebhookSetup: false,
        corneropsTelegramAllowRealReply: false,
      },
    });
    const report = await service.getReport();
    expect(report.telegramOperator.founderWebhookVersion).toBe('v1.2.1');
    expect(report.telegramOperator.founderWebhookReadiness).toBe('missing_config');
    expect(report.telegramOperator.realReplyAllowed).toBe(false);
    expect(report.telegramOperator.webhookSetupAllowed).toBe(false);
    expect(report.telegramOperator.exactNextFounderAction).toMatch(/TELEGRAM_OPERATOR_BOT_TOKEN/);
  });

  test.each([
    ['scripts/telegram-founder-webhook-check.js', 'telegram_founder_webhook_v1.2.1'],
    ['scripts/telegram-founder-id-help.js', 'telegram_founder_id_help_v1.2.1'],
    ['scripts/demo-telegram-founder-webhook.js', 'telegram_founder_webhook_v1.2.1'],
    ['scripts/demo-v1.2.1.js', '"demo": "v1.2.1"'],
  ])('%s runs without credentials and does not print demo secrets', (script, expected) => {
    const output = execFileSync(nodeBin, [script], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        TELEGRAM_OPERATOR_BOT_TOKEN: '',
        TELEGRAM_OPERATOR_WEBHOOK_SECRET: '',
        TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS: '',
        TELEGRAM_OPERATOR_ALLOWED_USER_IDS: '',
        CORNEROPS_TELEGRAM_ALLOW_REAL_REPLY: '',
        CORNEROPS_TELEGRAM_ALLOW_WEBHOOK_SETUP: '',
      },
      maxBuffer: 5 * 1024 * 1024,
    });
    expect(output).toContain(expected);
    expect(output).not.toContain('local-token-placeholder');
    expect(output).not.toContain('present-webhook-placeholder');
    expect(output).not.toContain('demo-founder-webhook-placeholder');
  });
});
