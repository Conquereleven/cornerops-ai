const request = require('supertest');

const ORIGINAL_ENV = { ...process.env };
const loadApp = (overrides = {}) => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    NODE_ENV: 'test',
    CORNEROPS_WEB_CONSOLE_ENABLED: 'true',
    CORNEROPS_WEB_CONSOLE_REQUIRE_AUTH: 'true',
    CORNEROPS_WEB_CONSOLE_AUTH_TOKEN: 'test-console-token',
    CORNEROPS_WEB_CONSOLE_LOCAL_ONLY: 'true',
    CORNEROPS_WEB_CONSOLE_READ_ONLY: 'true',
    CORNEROPS_WEB_CONSOLE_DRY_RUN: 'true',
    CORNEROPS_OPERATOR_WEB_ASK_ENABLED: 'true',
    CORNEROPS_OPERATOR_WEB_ASK_DRY_RUN: 'true',
    ...overrides,
  };
  return require('../src/app');
};

describe('Control Tower v0.8 API', () => {
  jest.setTimeout(30000);

  afterEach(() => { process.env = { ...ORIGINAL_ENV }; jest.resetModules(); });

  test('is disabled unless explicitly enabled', async () => {
    const app = loadApp({ CORNEROPS_WEB_CONSOLE_ENABLED: 'false' });
    await request(app).get('/api/control-tower/v0.8/status').expect(404);
  });

  test('requires auth and returns a sanitized unified report', async () => {
    const app = loadApp();
    await request(app).get('/api/control-tower/v0.8/status').expect(401);
    const response = await request(app).get('/api/control-tower/v0.8/status')
      .set('x-cornerops-console-token', 'test-console-token').expect(200);
    expect(response.body).toMatchObject({
      safety: { failClosed: true, readOnly: true, writesBlocked: true, externalSendsBlocked: true },
      webConsole: { localOnly: true, authConfigured: true, dryRun: true },
    });
    expect(response.body).toHaveProperty('agents');
    expect(response.body).toHaveProperty('dataSources');
    expect(response.body).toHaveProperty('contextSources');
    expect(JSON.stringify(response.body)).not.toContain('test-console-token');
    for (const path of [
      'agents', 'data-sources', 'context-sources', 'telegram', 'first-real-source',
      'security', 'audit-summary', 'approvals', 'rejections', 'replay', 'rate-limits',
    ]) {
      const section = await request(app).get(`/api/control-tower/v0.8/${path}`)
        .set('x-cornerops-console-token', 'test-console-token').expect(200);
      expect(JSON.stringify(section.body)).not.toContain('test-console-token');
      expect(JSON.stringify(section.body)).not.toContain(process.cwd());
    }
  });

  test('routes safe web asks, audits denials and blocks approval commands', async () => {
    const app = loadApp();
    const safe = await request(app).post('/api/operator/v0.8/ask')
      .set('x-cornerops-console-token', 'test-console-token')
      .send({ text: 'Show Control Tower status.' }).expect(200);
    expect(safe.body).toMatchObject({ sourceMode: expect.any(String), auditId: expect.any(String) });
    const blocked = await request(app).post('/api/operator/v0.8/ask')
      .set('x-cornerops-console-token', 'test-console-token')
      .send({ text: 'Approve approval-demo-123' }).expect(403);
    expect(blocked.body).toMatchObject({ status: 'denied', auditId: expect.any(String), warnings: ['WEB_ASK_APPROVAL_ACTION_BLOCKED'] });
    const write = await request(app).post('/api/operator/v0.8/ask')
      .set('x-cornerops-console-token', 'test-console-token')
      .send({ text: 'Mark order 123 as paid' }).expect(403);
    expect(write.body).toMatchObject({ status: 'denied', auditId: expect.any(String) });
  });

  test('supports Approval Center decisions only as audited dry-run', async () => {
    const app = loadApp();
    const data = require('../src/core/data');
    const approval = await data.approvalService.requestApproval({ actionType: 'mark_payment_paid', createdBy: 'quotes-orders-agent' });
    const response = await request(app)
      .post(`/api/control-tower/v0.8/approvals/${approval.id}/reject-dry-run`)
      .set('x-cornerops-console-token', 'test-console-token').expect(200);
    expect(response.body).toMatchObject({ executed: false, approval: { status: 'rejected', realExecutionAllowed: false }, auditId: expect.any(String) });
  });
});
