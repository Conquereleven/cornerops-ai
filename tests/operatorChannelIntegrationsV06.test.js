const path = require('path');
const { spawnSync } = require('child_process');
const request = require('supertest');
const telegramUpdate = require('./fixtures/operator-channel/telegram-private-message.json');
const openclawMessage = require('./fixtures/operator-channel/openclaw-operator-message.json');
const app = require('../src/app');
const { TelegramOperatorChannelAdapter } = require('../src/integrations/telegram/TelegramOperatorChannelAdapter');
const { OpenClawOperatorChannelBridge } = require('../src/integrations/openclaw/OpenClawOperatorChannelBridge');

describe('Operator channel integrations v0.6', () => {
  test('Telegram adapter normalizes a private message and validates webhook secret', () => {
    const adapter = new TelegramOperatorChannelAdapter({
      config: {
        webhookSecret: 'test-webhook-secret',
        allowedChatIds: ['123456'],
        dryRun: true,
      },
    });
    expect(adapter.normalizeUpdate(telegramUpdate, 'test-webhook-secret')).toMatchObject({
      provider: 'telegram',
      chatId: '123456',
      userId: '123456',
      text: "Give me today's briefing",
    });
    expect(() => adapter.normalizeUpdate(telegramUpdate, 'wrong-secret')).toThrow('Invalid Telegram webhook secret.');
  });

  test('Telegram adapter keeps replies dry-run and never calls fetch', async () => {
    const fetchImpl = jest.fn();
    const adapter = new TelegramOperatorChannelAdapter({
      fetchImpl,
      config: {
        enabled: true,
        replyEnabled: true,
        botToken: 'test-token-not-real',
        webhookSecret: 'secret',
        allowedChatIds: ['123456'],
        dryRun: true,
      },
    });
    await expect(adapter.sendReply({ chatId: '123456', text: 'safe reply' })).resolves.toMatchObject({ status: 'dry_run' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('Telegram transport errors return a generic failure without exposing the token', async () => {
    const adapter = new TelegramOperatorChannelAdapter({
      fetchImpl: jest.fn(async () => { throw new Error('network failed with URL'); }),
      config: {
        enabled: true,
        replyEnabled: true,
        botToken: '123456:secret-test-token',
        webhookSecret: 'secret',
        allowedChatIds: ['123456'],
        dryRun: false,
      },
    });
    const result = await adapter.sendReply({ chatId: '123456', text: 'safe reply', dryRun: false });
    expect(result).toEqual({
      status: 'error',
      warnings: ['Telegram operator reply transport failed.'],
    });
    expect(JSON.stringify(result)).not.toContain('secret-test-token');
  });

  test('OpenClaw bridge passes complete metadata through the channel service', async () => {
    const channelService = { handleInbound: jest.fn(async (input) => input), failClosed: jest.fn() };
    const bridge = new OpenClawOperatorChannelBridge().connect(channelService);
    const result = await bridge.handleMessage(openclawMessage);
    expect(result).toMatchObject({
      provider: 'openclaw',
      userId: 'founder-001',
      channelId: 'operator-dm-001',
      text: 'Show security audit risks',
    });
    expect(channelService.handleInbound).toHaveBeenCalledTimes(1);
  });

  test('OpenClaw bridge fails closed when required metadata is missing', async () => {
    const channelService = {
      handleInbound: jest.fn(),
      failClosed: jest.fn(async (_input, code) => ({ status: 'blocked', warnings: [code] })),
    };
    const bridge = new OpenClawOperatorChannelBridge().connect(channelService);
    const result = await bridge.handleMessage({ id: 'missing-user', text: 'help' });
    expect(result).toMatchObject({ status: 'blocked', warnings: ['OPENCLAW_OPERATOR_METADATA_REQUIRED'] });
    expect(channelService.handleInbound).not.toHaveBeenCalled();
  });

  test('Telegram webhook is disabled and audited by default', async () => {
    await request(app).post('/api/operator-channel/telegram/webhook')
      .send(telegramUpdate)
      .expect(404)
      .expect((res) => expect(res.body.auditId).toMatch(/^audit-/));
  });

  test('mock and real-channel readiness demos run without credentials or sends', () => {
    const mock = spawnSync(process.execPath, ['scripts/demo-operator-channel.js'], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      maxBuffer: 3 * 1024 * 1024,
    });
    expect(mock.status).toBe(0);
    expect(mock.stderr).toBe('');
    expect(mock.stdout).toContain('CornerOps Real Operator Channel v0.6');
    expect(mock.stdout).toContain('=== 7. Unknown sender ===');
    expect(mock.stdout).toContain('=== 8. Write request ===');
    expect(mock.stdout).toContain('Delivery: blocked');
    expect(mock.stdout).toContain('=== 10. Channel audit summary ===');

    const real = spawnSync(process.execPath, ['scripts/demo-real-operator-channel.js'], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      env: {
        ...process.env,
        CORNEROPS_REAL_OPERATOR_CHANNEL_ENABLED: 'false',
        TELEGRAM_OPERATOR_ENABLED: 'false',
      },
    });
    expect(real.status).toBe(0);
    expect(real.stdout).toContain('No message was sent.');
  });
});
