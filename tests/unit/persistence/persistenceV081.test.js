const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { FileJsonStore } = require('../../../src/core/persistence/FileJsonStore');
const { HumanApprovalService } = require('../../../src/integrations/openclaw/HumanApprovalService');
const { AuditLogRepository } = require('../../../src/core/domain/audit/AuditLogRepository');
const { AuditLogService } = require('../../../src/core/domain/audit/AuditLogService');
const { AuditViewerService } = require('../../../src/core/control-tower/AuditViewerService');

const records = { version: 1, records: [] };

describe('persistence hardening v0.8.1', () => {
  let root;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'cornerops-persistence-'));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  test('writes atomically, reads across instances, and leaves no temp files', async () => {
    const first = new FileJsonStore({ filePath: 'records.json', initialData: records, root });
    first.transact((current) => ({
      data: { ...current, records: [{ id: 'record-1' }] },
      result: true,
    }));
    const second = new FileJsonStore({ filePath: 'records.json', initialData: records, root });
    expect(second.initialize().records).toEqual([{ id: 'record-1' }]);
    expect((await fs.readdir(root)).filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });

  test('sanitizes secrets and PII before writing', async () => {
    const store = new FileJsonStore({ filePath: 'sanitized.json', initialData: records, root });
    store.writeFile({
      version: 1,
      records: [{ apiToken: 'super-secret-value', email: 'founder@example.com', safe: 'ok' }],
    });
    const raw = await fs.readFile(path.join(root, 'sanitized.json'), 'utf8');
    expect(raw).not.toContain('super-secret-value');
    expect(raw).not.toContain('founder@example.com');
    expect(raw).toContain('[REDACTED]');
    expect(raw).toContain('fo***@example.com');
  });

  test('enforces max bytes before writing', () => {
    const store = new FileJsonStore({
      filePath: 'limited.json',
      initialData: records,
      maxBytes: 1024,
      root,
    });
    expect(() => store.writeFile({ version: 1, records: [{ value: 'x'.repeat(5000) }] }))
      .toThrow(expect.objectContaining({ code: 'FILE_STORE_MAX_BYTES' }));
  });

  test('recovers noncritical corrupted JSON without exposing its contents', async () => {
    await fs.writeFile(path.join(root, 'recover.json'), '{"token":"do-not-expose"', 'utf8');
    const store = new FileJsonStore({
      critical: false,
      filePath: 'recover.json',
      initialData: records,
      root,
    });
    expect(store.initialize()).toEqual(records);
    expect(await fs.readFile(path.join(root, 'recover.json'), 'utf8')).not.toContain('do-not-expose');
  });

  test('fails closed for a corrupted critical store', async () => {
    await fs.writeFile(path.join(root, 'critical.json'), '{broken', 'utf8');
    const store = new FileJsonStore({
      critical: true,
      failClosed: true,
      filePath: 'critical.json',
      initialData: records,
      root,
    });
    expect(() => store.initialize()).toThrow(expect.objectContaining({ code: 'FILE_STORE_CORRUPT' }));
    expect(store.health()).toEqual(expect.objectContaining({
      healthy: false,
      errorCode: 'FILE_STORE_CORRUPT',
    }));
  });

  test('persists approvals across restart simulation without enabling execution', () => {
    const filePath = 'approvals.json';
    const first = new HumanApprovalService({
      store: new FileJsonStore({ critical: true, filePath, initialData: records, root }),
    });
    const approval = first.createApproval({
      actionType: 'mark_payment_paid',
      createdBy: 'quotes-orders-agent',
      payload: { orderId: 'order-1', apiToken: 'must-not-persist' },
    });
    const second = new HumanApprovalService({
      store: new FileJsonStore({ critical: true, filePath, initialData: records, root }),
    });
    expect(second.getApproval(approval.id)).toMatchObject({
      status: 'pending',
      actionType: 'mark_payment_paid',
    });
    expect(second.getApproval(approval.id)).not.toHaveProperty('executedAt');
  });

  test('persists sanitized audit events and exposes their Control Tower summary', async () => {
    const filePath = 'domain-audit.json';
    const firstRepository = new AuditLogRepository({
      store: new FileJsonStore({ critical: true, filePath, initialData: records, root }),
    });
    await firstRepository.createAuditLog({
      eventType: 'operator_ask',
      channel: 'web',
      input: { email: 'founder@example.com', token: 'secret', message: 'private request' },
      policyDecision: 'allowed',
      status: 'success',
    });
    const secondRepository = new AuditLogRepository({
      store: new FileJsonStore({ critical: true, filePath, initialData: records, root }),
    });
    const auditLogService = new AuditLogService({ repository: secondRepository });
    const viewer = new AuditViewerService({
      agentAuditService: { list: () => [] },
      auditLogService,
      config: {
        corneropsAuditViewerEnabled: true,
        corneropsAuditViewerMaskPii: true,
        corneropsAuditViewerMaxEvents: 100,
      },
      openclawAuditService: { list: () => [] },
    });
    const report = await viewer.getEvents();
    expect(report.summary.eventsLast24h).toBe(1);
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain('founder@example.com');
    expect(serialized).not.toContain('private request');
    expect(serialized).not.toContain('secret');
  });
});
