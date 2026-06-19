const request = require('supertest');
const app = require('../../../src/app');
const { ControlTowerService } = require('../../../src/core/control-tower/ControlTowerService');

const makeService = (overrides = {}) => new ControlTowerService({
  agentAuditService: { list: () => [] },
  agentRegistry: { list: () => [{ id: 'daily-briefing-agent', enabled: true }] },
  auditLogService: { list: async () => [] },
  config: {
    corneropsBetaMode: false,
    corneropsControlTowerEnabled: true,
    corneropsDryRun: true,
    corneropsFailClosed: true,
    corneropsFirstRealSource: 'github',
    corneropsFirstRealSourceMode: 'read_only',
    corneropsLogSanitization: true,
    corneropsPiiMasking: true,
    corneropsQaMode: true,
    corneropsRealSourceOnboardingEnabled: false,
    corneropsRequireApprovalForExternalActions: true,
    corneropsRequireApprovalForWrites: true,
    corneropsRequireAuditForTools: true,
    corneropsStrictSecurityMode: true,
  },
  contextHealthService: { getReport: async () => ({ status: 'healthy', sources: [], warnings: [] }) },
  dataHealthService: { getReport: async () => ({ status: 'healthy', sources: [], warnings: [] }) },
  ecosystemRegistry: { list: () => [] },
  githubClient: { getStatus: () => ({ enabled: false, readOnly: true, connected: false, mode: 'mock', warnings: [] }) },
  humanApprovalService: { list: () => [] },
  openclawAuditService: { list: () => [] },
  openclawConfig: { enabled: false, dryRun: true, sandboxMode: 'non-main' },
  operatorChannelStatusProvider: () => ({
    enabled: true,
    provider: 'mock',
    mode: 'mock',
    dryRun: true,
    replyEnabled: true,
    allowlistEnabled: true,
    allowedUsersCount: 1,
    allowedChannelsCount: 1,
    rejectedLast24h: 2,
    warnings: [],
  }),
  ...overrides,
});

describe('CornerOps Control Tower', () => {
  test('returns system, agents, sources, integrations and security summaries', async () => {
    const report = await makeService().getReport();
    expect(['healthy', 'degraded', 'unhealthy']).toContain(report.status);
    expect(report.agents).toMatchObject({ total: 1, enabled: 1, disabled: 0 });
    expect(report.dataSources).toEqual([]);
    expect(report.contextSources).toEqual([]);
    expect(report.github).toMatchObject({ readOnly: true, connected: false });
    expect(report.openclaw).toMatchObject({ enabled: false, mode: 'dry_run' });
    expect(report.approvals).toEqual({ pending: 0, approvedLast24h: 0, rejectedLast24h: 0 });
    expect(report.audit).toEqual({ eventsLast24h: 0, deniedActionsLast24h: 0, errorsLast24h: 0 });
    expect(report.security).toMatchObject({ strictMode: true, piiMasking: true, failClosed: true });
    expect(report.operatorChannel).toMatchObject({
      provider: 'mock',
      mode: 'mock',
      dryRun: true,
      rejectedLast24h: 2,
    });
  });

  test('reports unhealthy when fail-closed security is disabled', async () => {
    const service = makeService();
    service.config.corneropsFailClosed = false;
    const report = await service.getReport();
    expect(report.status).toBe('unhealthy');
    expect(report.security.warnings).toContain('CRITICAL: fail-closed mode is disabled.');
  });

  test('exposes protected internal Control Tower endpoints in test mode', async () => {
    await request(app).get('/api/control-tower/status').expect(200)
      .expect((res) => expect(res.body.agents.total).toBe(6));
    await request(app).get('/api/control-tower/security').expect(200)
      .expect((res) => expect(res.body.failClosed).toBe(true));
    await request(app).get('/api/control-tower/approvals').expect(200)
      .expect((res) => expect(res.body).toHaveProperty('pending'));
    await request(app).get('/api/control-tower/audit-summary').expect(200)
      .expect((res) => expect(res.body).toHaveProperty('eventsLast24h'));
  });
});
