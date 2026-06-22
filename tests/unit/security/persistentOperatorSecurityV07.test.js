const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { FileRateLimitStore } = require('../../../src/core/security/FileRateLimitStore');
const { FileRejectionStore } = require('../../../src/core/security/FileRejectionStore');
const { FileReplayStore } = require('../../../src/core/security/FileReplayStore');
const { OperatorRateLimitService } = require('../../../src/core/security/OperatorRateLimitService');
const { RejectionTrackingService } = require('../../../src/core/security/RejectionTrackingService');
const { ReplayProtectionService } = require('../../../src/core/security/ReplayProtectionService');
const { ReplayStore } = require('../../../src/core/security/ReplayStore');

const message = (overrides = {}) => ({
  id: 'telegram-100',
  provider: 'telegram',
  chatId: '7001',
  userId: '7001',
  text: 'briefing for maria@example.com +971500001234',
  metadata: { telegramMessageId: '100', telegramUpdateId: '100' },
  ...overrides,
});

describe('persistent operator security v0.7', () => {
  let root;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'cornerops-security-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  test('allows a new message, rejects duplicate and audits it', async () => {
    const auditLogService = { record: jest.fn(async () => ({ id: 'audit-duplicate' })) };
    const service = new ReplayProtectionService({
      auditLogService,
      store: new ReplayStore(),
      ttlSeconds: 3600,
    });
    await expect(service.checkAndRecord(message())).resolves.toMatchObject({ allowed: true, reason: 'new' });
    await expect(service.checkAndRecord(message())).resolves.toMatchObject({
      allowed: false,
      reason: 'duplicate',
      auditId: 'audit-duplicate',
    });
    expect(auditLogService.record).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'operator_replay_rejected',
      errorCode: 'OPERATOR_REPLAY_DUPLICATE',
    }));
  });

  test('rejects reuse of either Telegram update ID or message ID', async () => {
    const service = new ReplayProtectionService({ store: new ReplayStore(), ttlSeconds: 3600 });
    expect((await service.checkAndRecord(message())).allowed).toBe(true);
    expect((await service.checkAndRecord(message({
      id: 'telegram-101',
      metadata: { telegramMessageId: '100', telegramUpdateId: '101' },
    }))).reason).toBe('duplicate');
    expect((await service.checkAndRecord(message({
      id: 'telegram-102',
      metadata: { telegramMessageId: '102', telegramUpdateId: '100' },
    }))).reason).toBe('duplicate');
  });

  test('persists replay records across service restarts without storing text', async () => {
    const filePath = path.join(root, 'replay.json');
    const first = new ReplayProtectionService({ store: new FileReplayStore({ filePath, root }), ttlSeconds: 3600 });
    expect((await first.checkAndRecord(message())).allowed).toBe(true);
    const second = new ReplayProtectionService({ store: new FileReplayStore({ filePath, root }), ttlSeconds: 3600 });
    expect((await second.checkAndRecord(message())).reason).toBe('duplicate');
    const stored = await fs.readFile(filePath, 'utf8');
    expect(stored).not.toContain(message().text);
    expect(stored).toContain('checksum');
  });

  test('expired records are cleaned and accepted again', async () => {
    const store = new ReplayStore();
    store.records.push({ id: 'old', expiresAt: new Date(Date.now() - 1000).toISOString() });
    const service = new ReplayProtectionService({ store, ttlSeconds: 60 });
    const result = await service.checkAndRecord(message());
    expect(result.allowed).toBe(true);
    expect(store.records.some((record) => record.id === 'old')).toBe(false);
  });

  test('fails closed when replay store is unavailable', async () => {
    const service = new ReplayProtectionService({
      failClosed: true,
      store: { checkAndSet: async () => { throw new Error('unavailable'); } },
    });
    await expect(service.checkAndRecord(message())).resolves.toMatchObject({
      allowed: false,
      reason: 'store_unavailable',
    });
  });

  test('persists sanitized rejection records and summarizes reasons', async () => {
    const filePath = path.join(root, 'rejections.json');
    const first = new RejectionTrackingService({
      retentionDays: 30,
      store: new FileRejectionStore({ filePath, root }),
    });
    await first.record({
      provider: 'telegram',
      reason: 'TELEGRAM_UNKNOWN_USER',
      chatId: '7001',
      userId: '9999',
      text: `email maria@example.com phone +971500001234 token 123456:${'x'.repeat(26)}`,
    });
    for (const reason of [
      'TELEGRAM_UNKNOWN_CHAT',
      'TELEGRAM_GROUP_DENIED',
      'TELEGRAM_REPLAY_DUPLICATE',
      'TELEGRAM_RATE_LIMIT_EXCEEDED',
    ]) {
      await first.record({ provider: 'telegram', reason, text: 'safe preview' });
    }
    const second = new RejectionTrackingService({
      retentionDays: 30,
      store: new FileRejectionStore({ filePath, root }),
    });
    const records = await second.list();
    expect(records).toHaveLength(5);
    const unknownUser = records.find((record) => record.reason === 'TELEGRAM_UNKNOWN_USER');
    expect(unknownUser.sanitizedTextPreview).toContain('ma***@example.com');
    expect(unknownUser.sanitizedTextPreview).not.toContain('+971500001234');
    expect(unknownUser.sanitizedTextPreview).not.toContain('x'.repeat(26));
    await expect(second.summary()).resolves.toMatchObject({
      rejectedLast24h: 5,
      byReason: {
        TELEGRAM_UNKNOWN_USER: 1,
        TELEGRAM_UNKNOWN_CHAT: 1,
        TELEGRAM_GROUP_DENIED: 1,
        TELEGRAM_REPLAY_DUPLICATE: 1,
        TELEGRAM_RATE_LIMIT_EXCEEDED: 1,
      },
    });
  });

  test('removes rejection records past retention from persistent storage', async () => {
    const filePath = path.join(root, 'retention.json');
    const store = new FileRejectionStore({ filePath, root });
    await store.add({
      id: 'old-rejection',
      provider: 'telegram',
      reason: 'old',
      createdAt: new Date(Date.now() - (40 * 24 * 60 * 60 * 1000)).toISOString(),
    }, 0);
    const service = new RejectionTrackingService({ retentionDays: 30, store });
    await expect(service.list()).resolves.toEqual([]);
    expect(await fs.readFile(filePath, 'utf8')).not.toContain('old-rejection');
  });

  test('rate limits by provider/chat/user and persists state across restart', async () => {
    const filePath = path.join(root, 'rate.json');
    const auditLogService = { record: jest.fn(async () => ({ id: 'audit-rate' })) };
    const first = new OperatorRateLimitService({
      auditLogService,
      burst: 2,
      limitPerMinute: 1,
      store: new FileRateLimitStore({ filePath, root }),
    });
    expect((await first.check(message())).allowed).toBe(true);
    expect((await first.check(message({ id: 'telegram-101' }))).allowed).toBe(true);
    const second = new OperatorRateLimitService({
      auditLogService,
      burst: 2,
      limitPerMinute: 1,
      store: new FileRateLimitStore({ filePath, root }),
    });
    await expect(second.check(message({ id: 'telegram-102' }))).resolves.toMatchObject({
      allowed: false,
      reason: 'rate_limit_exceeded',
      auditId: 'audit-rate',
    });
    expect(auditLogService.record).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'operator_rate_limit_rejected',
    }));
    expect((await second.check(message({ userId: 'other-user' }))).allowed).toBe(true);
  });

  test('rate limiting fails closed when its store is unavailable', async () => {
    const service = new OperatorRateLimitService({
      failClosed: true,
      store: { update: async () => { throw new Error('unavailable'); } },
    });
    await expect(service.check(message())).resolves.toMatchObject({
      allowed: false,
      reason: 'store_unavailable',
    });
  });

  test('file stores reject paths outside the safe root', () => {
    expect(() => new FileReplayStore({
      filePath: path.join(root, '..', 'escape.json'),
      root,
    })).toThrow('Path traversal blocked');
  });
});
