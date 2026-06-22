const { ApprovalService } = require('../../../src/core/domain/approvals/ApprovalService');
const { HumanApprovalService } = require('../../../src/integrations/openclaw/HumanApprovalService');
const { ApprovalCenterService } = require('../../../src/core/control-tower/ApprovalCenterService');
const { AuditViewerService } = require('../../../src/core/control-tower/AuditViewerService');
const { ControlTowerV08ReportService } = require('../../../src/core/control-tower/ControlTowerV08ReportService');

const config = {
  nodeEnv: 'test',
  corneropsApprovalCenterEnabled: true,
  corneropsApprovalCenterDryRun: true,
  corneropsApprovalCenterAllowRealExecution: false,
  corneropsAuditViewerEnabled: true,
  corneropsAuditViewerMaxEvents: 100,
  corneropsAuditViewerMaskPii: true,
  corneropsWebConsoleEnabled: false,
  corneropsWebConsoleMode: 'local',
  corneropsWebConsoleLocalOnly: true,
  corneropsWebConsoleRequireAuth: true,
  corneropsWebConsoleAuthToken: '',
  corneropsWebConsoleReadOnly: true,
  corneropsWebConsoleDryRun: true,
  corneropsControlTowerWebRefreshSeconds: 30,
  corneropsBetaMode: true,
  corneropsInternalBetaEnabled: false,
  corneropsInteractiveBetaEnabled: false,
  whatsappContextEnabled: false,
  whatsappAccessToken: '',
  slackContextEnabled: false,
  telegramContextEnabled: false,
  clawhubEnabled: false,
  gogcliEnabled: false,
  wacliEnabled: false,
  goplacesEnabled: false,
  clawpdfEnabled: false,
  ffmpegWasmEnabled: false,
  rastermillEnabled: false,
  corneropsTelegramRealMode: false,
  corneropsTelegramDryRun: true,
  telegramOperatorDryRun: true,
  telegramOperatorReplyDryRun: true,
  corneropsRealOperatorChannelEnabled: false,
  corneropsOperatorChannelDryRun: true,
  corneropsOperatorReplyDryRun: true,
  slackOperatorEnabled: false,
  slackOperatorDryRun: true,
  githubAllowIssueCreation: false,
  githubAllowPrWrite: false,
  githubAllowWorkflowTrigger: false,
  corneropsSecurityDashboardEnabled: true,
  corneropsSecurityDashboardMaskPii: true,
};

const baseReport = {
  status: 'degraded', mode: 'dry_run', dryRun: true, demoMode: true,
  security: {
    failClosed: true, databaseReadOnly: true, databaseWritesBlocked: true,
    externalSendsBlocked: true, piiMasking: true, logSanitization: true, warnings: [],
  },
  telegram: {
    enabled: false, realMode: false, dryRun: true, replyEnabled: true,
    allowedUsersCount: 0, allowedChatsCount: 0,
    replayProtection: { storeHealthy: true }, rejectionTracking: { storeHealthy: true, rejectedLast24h: 2 },
    rateLimiting: { storeHealthy: true }, warnings: [],
  },
  firstRealSource: { selectedSource: 'mock', mode: 'mock', ready: false, readOnlyVerified: false, credentialsPresent: false, warnings: [] },
  agents: { total: 1, enabled: 1, disabled: 0 }, dataSources: [], contextSources: [],
  businessData: { mode: 'mock' }, ecosystemServices: [], github: { mode: 'mock' }, openclaw: { mode: 'dry_run' },
};

describe('Control Tower v0.8 services', () => {
  test('returns the unified report with safe defaults and all required sections', async () => {
    const approvalCenterService = { list: async () => ({ dryRun: true, summary: { pending: 1, highRiskPending: 1 } }) };
    const auditViewerService = { getEvents: async () => ({ summary: { eventsLast24h: 3, deniedLast24h: 1, errorsLast24h: 0 }, events: [] }) };
    const baseService = {
      getReport: async () => baseReport,
      agentRegistry: { list: () => [{ id: 'daily-briefing-agent', name: 'Daily Briefing', enabled: true, permissionLevel: 'read_only', allowedTools: ['read_leads'] }] },
    };
    const report = await new ControlTowerV08ReportService({ approvalCenterService, auditViewerService, baseService, config }).getReport();
    expect(report).toMatchObject({
      status: 'degraded', mode: 'mock',
      safety: { failClosed: true, readOnly: true, writesBlocked: true, externalSendsBlocked: true, piiMasking: true },
      operatorChannel: { replayProtectionHealthy: true, rejectionTrackingHealthy: true, rateLimitingHealthy: true },
      firstRealSource: { selectedSource: 'mock' },
      approvals: { pending: 1, highRiskPending: 1, realExecutionAllowed: false },
      audit: { eventsLast24h: 3, deniedLast24h: 1 },
    });
    expect(report.agents).toHaveLength(1);
    expect(report.dataSources).toEqual([]);
    expect(report.contextSources).toEqual([]);
  });

  test('Approval Center resolves only in dry-run and creates audit evidence', async () => {
    const human = new HumanApprovalService();
    const approvalService = new ApprovalService({ humanApprovalService: human });
    const auditLogService = { record: jest.fn(async () => ({ id: 'audit-dry-run' })) };
    const service = new ApprovalCenterService({ approvalService, auditLogService, config });
    const pending = await approvalService.requestApproval({ actionType: 'mark_payment_paid', createdBy: 'quotes-orders-agent', payload: { orderId: 'masked' } });
    expect((await service.list()).summary.highRiskPending).toBe(1);
    const result = await service.decideDryRun(pending.id, 'approve');
    expect(result).toMatchObject({ executed: false, auditId: 'audit-dry-run', approval: { status: 'approved', realExecutionAllowed: false } });
    expect(auditLogService.record).toHaveBeenCalledWith(expect.objectContaining({ policyDecision: 'dry_run' }));
  });

  test('Approval Center fails closed when real execution is enabled', async () => {
    const human = new HumanApprovalService();
    const approvalService = new ApprovalService({ humanApprovalService: human });
    const pending = await approvalService.requestApproval({ actionType: 'write_order' });
    const service = new ApprovalCenterService({ approvalService, auditLogService: { record: jest.fn() }, config: { ...config, corneropsApprovalCenterAllowRealExecution: true } });
    await expect(service.decideDryRun(pending.id, 'reject')).rejects.toMatchObject({ statusCode: 503 });
  });

  test('Audit Viewer shows denied/errors and masks PII, secrets and private content', async () => {
    const service = new AuditViewerService({
      config,
      auditLogService: { list: async () => [{ id: 'audit-1', eventType: 'security_denied', channel: 'web', policyDecision: 'denied', status: 'denied', createdAt: new Date().toISOString(), sanitizedInput: { email: 'founder@example.com', token: 'super-secret', message: 'private text', reason: ['bot 123456789:', 'abcdefghijklmnopqrstuvwxyzABCDE'].join('') } }] },
      agentAuditService: { list: () => [] },
      openclawAuditService: { list: () => [] },
      rejectionProvider: async () => [{ id: 'rejection-1', provider: 'telegram', reason: 'unknown_sender', sanitizedTextPreview: 'private rejected message', createdAt: new Date().toISOString() }],
    });
    const report = await service.getEvents({ filter: 'denied' });
    const serialized = JSON.stringify(report);
    expect(report.events).toHaveLength(2);
    expect(report.summary.deniedLast24h).toBe(2);
    expect(serialized).not.toContain('founder@example.com');
    expect(serialized).not.toContain('super-secret');
    expect(serialized).not.toContain('private text');
    expect(serialized).not.toContain('abcdefghijklmnopqrstuvwxyzABCDE');
    expect(serialized).not.toContain('private rejected message');
  });
});
