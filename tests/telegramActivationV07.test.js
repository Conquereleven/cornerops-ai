const path = require('path');
const { spawnSync } = require('child_process');
const { TelegramOperatorChannelAdapter } = require('../src/integrations/telegram/TelegramOperatorChannelAdapter');
const { OperatorCommandRouter } = require('../src/core/operator/OperatorCommandRouter');

const payload = (overrides = {}) => ({
  update_id: overrides.updateId || 500,
  message: {
    message_id: overrides.messageId || 500,
    date: 1781910000,
    chat: { id: overrides.chatId || 7001, type: overrides.chatType || 'private' },
    from: { id: overrides.userId || 7001, username: 'founder' },
    text: overrides.text || 'help',
  },
});

const harness = (overrides = {}) => {
  const channelService = {
    handleInbound: jest.fn(async () => ({ status: 'dry_run', text: 'safe response' })),
    failClosed: jest.fn(async (_message, reason) => ({ status: 'blocked', warnings: [reason] })),
  };
  const rejectionTrackingService = { record: jest.fn(async () => ({ id: 'rejection-1' })) };
  const replayProtectionService = { checkAndRecord: jest.fn(async () => ({ allowed: true, reason: 'new' })) };
  const rateLimitService = { check: jest.fn(async () => ({ allowed: true, reason: 'allowed' })) };
  const fetchImpl = jest.fn();
  const adapter = new TelegramOperatorChannelAdapter({
    config: {
      enabled: true,
      realMode: false,
      botToken: 'test-token-not-real',
      webhookSecret: 'test-secret',
      allowedChatIds: ['7001'],
      allowedUserIds: ['7001'],
      dryRun: true,
      persistentSecurity: true,
      rejectGroups: true,
      replyDryRun: true,
      replyEnabled: true,
      requireDm: true,
      ...(overrides.config || {}),
    },
    fetchImpl,
    rateLimitService,
    rejectionTrackingService,
    replayProtectionService,
  }).connect(channelService);
  return {
    adapter, channelService, fetchImpl, rateLimitService,
    rejectionTrackingService, replayProtectionService,
  };
};

describe('Telegram activation v0.7', () => {
  test.each([
    ['help', 'help'],
    ['status', 'control_tower_status'],
    ['control tower', 'control_tower_status'],
    ['daily briefing', 'briefing'],
    ['b2b leads follow-up', 'b2b_leads_followup'],
    ['quotes needing follow-up', 'quotes_review'],
    ['orders requiring action', 'orders_review'],
    ['manual payments review', 'manual_payments_review'],
    ['github engineering summary', 'github_engineering_summary'],
    ['security audit', 'security_audit_summary'],
    ['pending approvals', 'pending_approvals'],
    ['audit summary', 'audit_summary'],
    ['data health', 'data_health'],
    ['context health', 'context_health'],
  ])('supports Telegram command %s', (text, intent) => {
    const router = new OperatorCommandRouter();
    expect(router.classify(text).intent).toBe(intent);
  });

  test('checks replay and rate limit before routing an approved DM', async () => {
    const test = harness();
    await expect(test.adapter.handleWebhook(payload(), 'test-secret')).resolves.toMatchObject({ status: 'dry_run' });
    expect(test.replayProtectionService.checkAndRecord).toHaveBeenCalledTimes(1);
    expect(test.rateLimitService.check).toHaveBeenCalledTimes(1);
    expect(test.channelService.handleInbound).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['unknown chat', payload({ chatId: 9999 }), 'TELEGRAM_UNKNOWN_CHAT'],
    ['unknown user', payload({ userId: 9999 }), 'TELEGRAM_UNKNOWN_USER'],
  ])('rejects %s before routing', async (_label, update, reason) => {
    const test = harness();
    await expect(test.adapter.handleWebhook(update, 'test-secret')).resolves.toMatchObject({
      status: 'blocked', warnings: [reason],
    });
    expect(test.channelService.handleInbound).not.toHaveBeenCalled();
    expect(test.rejectionTrackingService.record).toHaveBeenCalledWith(expect.objectContaining({ reason }));
  });

  test('rejects groups and tracks the rejection', async () => {
    const test = harness();
    await expect(test.adapter.handleWebhook(payload({ chatType: 'group' }), 'test-secret'))
      .rejects.toMatchObject({ code: 'TELEGRAM_GROUP_DENIED' });
    expect(test.rejectionTrackingService.record).toHaveBeenCalledWith(expect.objectContaining({
      reason: 'TELEGRAM_GROUP_DENIED',
    }));
  });

  test('rejects invalid webhook secret and never logs token values', async () => {
    const test = harness();
    await expect(test.adapter.handleWebhook(payload(), 'bad-secret'))
      .rejects.toMatchObject({ code: 'TELEGRAM_WEBHOOK_SECRET_DENIED' });
    expect(JSON.stringify(test.rejectionTrackingService.record.mock.calls)).not.toContain('test-token-not-real');
  });

  test('rejects replay duplicate and rate limit before OperatorCommandRouter', async () => {
    const duplicate = harness();
    duplicate.replayProtectionService.checkAndRecord.mockResolvedValue({
      allowed: false, reason: 'duplicate', auditId: 'audit-replay',
    });
    await expect(duplicate.adapter.handleWebhook(payload(), 'test-secret')).resolves.toMatchObject({
      status: 'blocked', warnings: ['TELEGRAM_REPLAY_DUPLICATE'],
    });
    expect(duplicate.rateLimitService.check).not.toHaveBeenCalled();

    const limited = harness();
    limited.rateLimitService.check.mockResolvedValue({
      allowed: false, reason: 'rate_limit_exceeded', auditId: 'audit-rate',
    });
    await expect(limited.adapter.handleWebhook(payload(), 'test-secret')).resolves.toMatchObject({
      status: 'blocked', warnings: ['TELEGRAM_RATE_LIMIT_EXCEEDED'],
    });
    expect(limited.channelService.handleInbound).not.toHaveBeenCalled();
  });

  test('allows only same-chat replies and keeps dry-run off the network', async () => {
    const test = harness();
    await expect(test.adapter.sendReply({
      chatId: '7001', userId: '7001', text: 'reply', inReplyToMessageId: 'telegram-500',
    })).resolves.toMatchObject({ status: 'dry_run' });
    await expect(test.adapter.sendReply({
      chatId: '9999', userId: '7001', text: 'override', inReplyToMessageId: 'telegram-500',
    })).resolves.toMatchObject({ status: 'blocked' });
    await expect(test.adapter.sendReply({ chatId: '7001', userId: '7001', text: 'proactive' }))
      .resolves.toMatchObject({ status: 'blocked' });
    expect(test.fetchImpl).not.toHaveBeenCalled();
  });

  test('sends one same-chat reply only when explicit real transport flags are enabled', async () => {
    const test = harness({
      config: { dryRun: false, realMode: true, replyDryRun: false },
    });
    test.adapter.fetchImpl.mockResolvedValue({ ok: true });
    await expect(test.adapter.sendReply({
      chatId: '7001',
      userId: '7001',
      text: 'approved operator reply',
      inReplyToMessageId: 'telegram-500',
      dryRun: false,
    })).resolves.toMatchObject({ status: 'sent' });
    expect(test.adapter.fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('/sendMessage'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ chat_id: '7001', text: 'approved operator reply' }),
      }),
    );
  });

  test('fails closed when real mode lacks persistent security', async () => {
    const test = harness({ config: { realMode: true, persistentSecurity: false } });
    await expect(test.adapter.handleWebhook(payload(), 'test-secret')).resolves.toMatchObject({
      status: 'blocked', warnings: ['TELEGRAM_REAL_MODE_NOT_READY'],
    });
  });
});

describe('v0.7 commands and demos', () => {
  test('telegram:check reports token presence without printing its value or sending', () => {
    const fakeToken = `123456:${'t'.repeat(30)}`;
    const result = spawnSync(process.execPath, ['scripts/telegram-check.js'], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      env: {
        ...process.env,
        TELEGRAM_OPERATOR_BOT_TOKEN: fakeToken,
        TELEGRAM_OPERATOR_WEBHOOK_SECRET: 'check-secret-not-real',
        TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS: '7001',
        TELEGRAM_OPERATOR_ALLOWED_USER_IDS: '7001',
      },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('TELEGRAM_OPERATOR_BOT_TOKEN: present');
    expect(result.stdout).not.toContain(fakeToken);
    expect(result.stdout).toContain('no message was sent');
  });

  test.each([
    ['scripts/telegram-check.js', 'No token value was printed and no message was sent.'],
    ['scripts/demo-telegram-activation.js', '=== 8. Audit summary ==='],
    ['scripts/demo-first-real-source.js', 'Selected source: mock'],
    ['scripts/demo-v0.7.js', 'Safety: Telegram dry-run'],
  ])('%s runs without real credentials', (script, expected) => {
    const result = spawnSync(process.execPath, [script], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      env: {
        ...process.env,
        TELEGRAM_OPERATOR_BOT_TOKEN: '',
        GITHUB_TOKEN: '',
        SUPABASE_READONLY_KEY: '',
        READONLY_DATABASE_URL: '',
      },
      maxBuffer: 4 * 1024 * 1024,
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(expected);
    expect(result.stdout).not.toContain('demo-webhook-secret');
  });
});
