const { execFileSync } = require('child_process');
const path = require('path');
const { TelegramOperatorChannelAdapter } = require('../src/integrations/telegram/TelegramOperatorChannelAdapter');
const { TelegramOperatorConfigValidator } = require('../src/integrations/telegram/TelegramOperatorConfigValidator');
const { CornerMexFlowEngine } = require('../src/core/flows/cornermex');
const { CornerMexMessageDraftService } = require('../src/core/drafts');
const { OperatorCommandRouter } = require('../src/core/operator/OperatorCommandRouter');
const { ControlTowerV11ReportService } = require('../src/core/control-tower/ControlTowerV11ReportService');

const root = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

const payload = (overrides = {}) => ({
  update_id: overrides.updateId || 700,
  message: {
    message_id: overrides.messageId || 700,
    date: 1781910000,
    chat: { id: overrides.chatId || 7001, type: overrides.chatType || 'private' },
    from: { id: overrides.userId || 7001, username: 'founder' },
    text: overrides.text || 'founder daily',
  },
});

const connector = (collections = {}) => ({
  getConnectorStatus: jest.fn(async () => ({
    sourceMode: 'mock',
    writesBlocked: true,
    warnings: [],
    mappedContracts: [
      { entity: 'product', confidence: 'medium', sourceMode: 'mock', warnings: [] },
      { entity: 'lead', confidence: 'medium', sourceMode: 'mock', warnings: [] },
    ],
  })),
  listProducts: jest.fn(async () => ({ data: collections.products || [{ id: 'prod-1', sku: 'MISSING', name: '', stock: 0 }], meta: { source: 'mock' } })),
  listLeads: jest.fn(async () => ({ data: collections.leads || [{ id: 'lead-1', businessName: 'Mock Restaurant', businessType: 'restaurant', status: 'needs_follow_up' }], meta: { source: 'mock' } })),
  listQuotes: jest.fn(async () => ({ data: collections.quotes || [{ id: 'quote-1', status: 'sent_needs_follow_up' }], meta: { source: 'mock' } })),
  listOrders: jest.fn(async () => ({ data: collections.orders || [{ id: 'order-1', status: 'pending_payment', paymentMethod: 'Bank Transfer', paymentStatus: 'pending' }], meta: { source: 'mock' } })),
  listCustomers: jest.fn(async () => ({ data: collections.customers || [], meta: { source: 'mock' } })),
});

describe('Telegram Operator + CornerMex Flow Engine v1.2', () => {
  test('Telegram config missing credentials degrades safely without printing secrets', () => {
    const fakeToken = `123456:${'t'.repeat(30)}`;
    const result = new TelegramOperatorConfigValidator({
      config: {
        telegramOperatorBotToken: fakeToken,
        telegramOperatorWebhookSecret: 'secret-not-real',
        telegramOperatorAllowedUserIds: [],
        telegramOperatorAllowedChatIds: [],
        telegramOperatorRequireDm: true,
        telegramOperatorRejectGroups: true,
        telegramOperatorReplyDryRun: true,
        corneropsTelegramDryRun: true,
        corneropsTelegramReadOnly: true,
        corneropsTelegramFailClosed: true,
      },
    }).check();
    expect(result.missing).toEqual(expect.arrayContaining(['TELEGRAM_OPERATOR_ALLOWED_USER_IDS', 'TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS']));
    expect(JSON.stringify(result)).not.toContain(fakeToken);
    expect(result.secrets.botTokenPrinted).toBe(false);
    expect(result.security.rejectGroups).toBe(true);
  });

  test('Telegram adapter rejects unknown users, groups, replay and rate limit before routing', async () => {
    const channelService = {
      handleInbound: jest.fn(async () => ({ status: 'dry_run' })),
      failClosed: jest.fn(async (_message, reason) => ({ status: 'blocked', warnings: [reason] })),
    };
    const replayProtectionService = { checkAndRecord: jest.fn(async () => ({ allowed: true, reason: 'new' })) };
    const rateLimitService = { check: jest.fn(async () => ({ allowed: true, reason: 'allowed' })) };
    const rejectionTrackingService = { record: jest.fn(async () => ({ id: 'rejection-test' })) };
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
      fetchImpl: jest.fn(),
      rateLimitService,
      rejectionTrackingService,
      replayProtectionService,
    }).connect(channelService);

    await expect(adapter.handleWebhook(payload(), 'secret')).resolves.toMatchObject({ status: 'dry_run' });
    await expect(adapter.handleWebhook(payload({ userId: 9999, updateId: 701 }), 'secret')).resolves.toMatchObject({ warnings: ['TELEGRAM_UNKNOWN_USER'] });
    await expect(adapter.handleWebhook(payload({ chatType: 'group', updateId: 702 }), 'secret')).rejects.toMatchObject({ code: 'TELEGRAM_GROUP_DENIED' });
    replayProtectionService.checkAndRecord.mockResolvedValueOnce({ allowed: false, reason: 'duplicate', auditId: 'audit-replay' });
    await expect(adapter.handleWebhook(payload({ updateId: 703 }), 'secret')).resolves.toMatchObject({ warnings: ['TELEGRAM_REPLAY_DUPLICATE'] });
    rateLimitService.check.mockResolvedValueOnce({ allowed: false, reason: 'rate_limit_exceeded', auditId: 'audit-rate' });
    await expect(adapter.handleWebhook(payload({ updateId: 704 }), 'secret')).resolves.toMatchObject({ warnings: ['TELEGRAM_RATE_LIMIT_EXCEEDED'] });
    await expect(adapter.sendReply({ chatId: '7001', userId: '7001', text: 'reply' })).resolves.toMatchObject({ status: 'blocked' });
  });

  test('CornerMex Flow Engine labels source mode, identifies candidates and never mutates connector data', async () => {
    const mockConnector = connector();
    const auditLogService = { record: jest.fn(async () => ({ id: 'audit-flow' })) };
    const engine = new CornerMexFlowEngine({ connector: mockConnector, auditLogService });
    const result = await engine.analyzeFlows({ requestId: 'flow-test' });
    expect(result.sourceMode).toBe('mock');
    expect(result.summary.candidates.quote_follow_up_flow).toBe(1);
    expect(result.summary.candidates.manual_payment_review_flow).toBe(1);
    expect(result.summary.candidates.b2b_lead_flow).toBe(1);
    expect(result.readOnly).toBe(true);
    expect(result.writesBlocked).toBe(true);
    expect(typeof mockConnector.createOrder).toBe('undefined');
  });

  test('message drafts are local only, audited and not sendable', async () => {
    const auditLogService = { record: jest.fn(async () => ({ id: 'audit-draft' })) };
    const service = new CornerMexMessageDraftService({ auditLogService });
    const whatsapp = await service.createDraft({ channel: 'whatsapp', text: 'quote #123', requestId: 'draft-test' });
    const email = await service.createDraft({ channel: 'email', text: 'lead #456', requestId: 'draft-test-email' });
    expect(whatsapp.draft.sendStatus).toBe('not_sendable_in_v1.2');
    expect(email.draft.sendStatus).toBe('not_sendable_in_v1.2');
    expect(auditLogService.record).toHaveBeenCalledTimes(2);
  });

  test('operator commands route to flows and drafts safely', async () => {
    const flowEngine = new CornerMexFlowEngine({ connector: connector(), auditLogService: { record: async () => ({ id: 'audit-flow' }) } });
    const messageDraftService = new CornerMexMessageDraftService({ auditLogService: { record: async () => ({ id: 'audit-draft' }) } });
    const router = new OperatorCommandRouter({
      auditLogService: { record: jest.fn(async () => ({ id: 'audit-router' })) },
      config: {
        allowedChannels: ['api', 'cli'],
        defaultAgent: 'cornerops-router-agent',
        dryRun: true,
        enabled: true,
        readOnly: true,
        requireApproval: true,
        requireAudit: true,
      },
      controlTowerService: {
        getReport: async () => ({
          businessData: { mode: 'mock', warnings: [] },
          firstRealSource: { mode: 'mock' },
          disabledExternalSources: [],
          realSourcesEnabled: [],
          security: { writesBlocked: true, externalSendsBlocked: true, warnings: [] },
          cornerMexLovableConnector: { sourceMode: 'mock', writesBlocked: true, warnings: [], schemaDiscovery: { status: 'mock' } },
        }),
      },
      controlledActionExecutor: {
        createDraft: jest.fn(async (_id, payload) => ({ payload, auditId: 'audit-action-draft' })),
        status: () => ({ enabled: false, dryRun: true, realExecutionAllowed: false, actions: [] }),
      },
      flowEngine,
      formatter: { format: (output) => output.answerText || 'formatted', inferSourceMode: () => 'mock' },
      messageDraftService,
      sessionService: { getOrCreate: () => ({ id: 'session-test' }), touch: jest.fn() },
    });
    await expect(router.handle({ channel: 'api', operatorId: '7001', text: 'orders needing attention' })).resolves.toMatchObject({ agentId: 'cornermex-flow-engine', sourceMode: 'mock' });
    await expect(router.handle({ channel: 'api', operatorId: '7001', text: 'draft whatsapp follow-up: quote #123' })).resolves.toMatchObject({ agentId: 'cornermex-message-draft-service', status: 'dry_run' });
    await expect(router.handle({ channel: 'api', operatorId: '7001', text: 'create internal task: pending bank transfers' })).resolves.toMatchObject({ status: 'dry_run' });
  });

  test('Control Tower exposes Telegram and Flow Engine v1.2 status', async () => {
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
            replayProtection: { enabled: true, storeHealthy: true },
            rejectionTracking: { enabled: true, storeHealthy: true },
            rateLimiting: { enabled: true, storeHealthy: true },
          },
        }),
      },
      businessDataReadinessService: { check: async () => ({ mode: 'mock', warnings: [] }) },
      cornerMexConfigIntakeService: { check: async () => ({ warnings: [], missing: [], configCompleteness: {} }) },
      cornerMexConnector: { getConnectorStatus: async () => ({ sourceMode: 'mock', writesBlocked: true, warnings: [], mappedContracts: [] }) },
      githubReadinessService: { check: async () => ({ mode: 'mock', warnings: [], connected: false }) },
      config: {
        corneropsDryRun: true,
        corneropsControlledActionsDryRun: true,
        telegramOperatorAllowedUserIds: [],
        telegramOperatorAllowedChatIds: [],
        telegramOperatorRejectGroups: true,
        telegramOperatorReplyDryRun: true,
        corneropsTelegramDryRun: true,
        corneropsTelegramReadOnly: true,
      },
    });
    const report = await service.getReport();
    expect(report.telegramOperator.version).toBe('v1.2');
    expect(report.cornerMexFlowEngine.version).toBe('v1.2');
    expect(report.cornerMexFlowEngine.whatsappDisabled).toBe(true);
  });

  test.each([
    ['scripts/telegram-operator-check.js', 'telegram_operator_v1.2'],
    ['scripts/demo-telegram-operator.js', 'telegram_operator_v1.2'],
    ['scripts/demo-cornermex-flows.js', 'cornermex_flows_v1.2'],
    ['scripts/demo-message-drafts.js', 'message_drafts_v1.2'],
    ['scripts/demo-v1.2.js', '"demo": "v1.2"'],
  ])('%s runs without credentials', (script, expected) => {
    const output = execFileSync(nodeBin, [script], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        TELEGRAM_OPERATOR_BOT_TOKEN: '',
        TELEGRAM_OPERATOR_WEBHOOK_SECRET: '',
        TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS: '',
        TELEGRAM_OPERATOR_ALLOWED_USER_IDS: '',
        CORNERMEX_SUPABASE_ANON_KEY: '',
      },
      maxBuffer: 5 * 1024 * 1024,
    });
    expect(output).toContain(expected);
    expect(output).not.toContain('demo-secret-not-printed');
  });
});
