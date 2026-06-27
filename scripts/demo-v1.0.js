#!/usr/bin/env node
const { createDemoHarness, CONTROLLED_ACTION_IDS, context } = require('./controlled-actions-demo-harness');
const { FounderSetupValidator } = require('../src/core/setup/FounderSetupValidator');
const { FounderFirstRunService } = require('../src/core/setup/FounderFirstRunService');
const { LocalStateBackupService } = require('../src/core/persistence/LocalStateBackupService');

const demoConfig = {
  bindHost: '127.0.0.1',
  corneropsWebConsoleEnabled: true,
  corneropsWebConsoleRequireAuth: true,
  corneropsWebConsoleAuthToken: 'demo-token-redacted',
  corneropsWebConsoleLocalOnly: true,
  corneropsWebConsoleReadOnly: true,
  corneropsWebConsoleDryRun: true,
  corneropsOperatorReadOnly: true,
  corneropsOperatorDryRun: true,
  corneropsRequireApprovalForWrites: true,
  corneropsTelegramRealMode: false,
  corneropsTelegramDryRun: true,
  telegramOperatorDryRun: true,
  openclawEnabled: false,
  openclawDryRun: true,
  githubEnabled: false,
  githubReadOnly: true,
  githubDryRun: true,
  githubAllowIssueCreation: false,
  corneropsActionGithubIssueCreateEnabled: false,
  corneropsActionGithubIssueCreateDryRun: true,
  corneropsPersistenceRoot: './.cornerops/state',
};

const mockReportService = (setup, harness, backupService) => ({
  async getReport() {
    return {
      status: setup.status === 'blocked' ? 'unhealthy' : 'degraded',
      mode: 'mock',
      businessData: { mode: 'mock' },
      firstRealSource: { mode: 'mock' },
      openclaw: { mode: 'disabled' },
      approvals: { pending: 0, dryRun: true, realExecutionAllowed: false },
      audit: { eventsLast24h: harness.auditLogService.list().length, deniedLast24h: 0 },
      safety: { warnings: [], externalSendsBlocked: true, writesBlocked: true },
      controlledActions: harness.executor.status(),
      founderBetaReadiness: {
        ready: setup.status !== 'blocked',
        setupStatus: setup.status,
        lastBackup: backupService.getLatestBackupSummary().latestAt,
      },
    };
  },
});

const mockOperator = (label) => ({
  async handle(input) {
    return {
      requestId: input.requestId,
      status: 'dry_run',
      sourceMode: 'mock',
      responseText: `${label}: mock read-only dry-run summary`,
      warnings: [],
    };
  },
});

const main = async () => {
  const harness = createDemoHarness();
  const setupValidator = new FounderSetupValidator({ config: demoConfig });
  const setup = setupValidator.run();
  const backupService = new LocalStateBackupService({ now: () => new Date('2026-06-27T00:00:00.000Z') });
  const dailyService = new FounderFirstRunService({
    actions: { controlledActionExecutor: harness.executor },
    backupService,
    controlTowerReportService: mockReportService(setup, harness, backupService),
    operatorCommandRouter: mockOperator('founder daily'),
    setupValidator,
  });
  const draft = await harness.executor.createDraft(
    CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE,
    { title: 'Founder beta issue draft', body: 'Draft only; no real GitHub issue is created.' },
    context('dev-codex-github-agent', 'demo-v1-issue'),
  );
  const approval = await harness.executor.requestApproval(
    CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE,
    draft.payload,
    context('dev-codex-github-agent', 'demo-v1-issue'),
  );
  await harness.approvalService.approveApproval(approval.approvalId, 'founder-demo');
  const execution = await harness.executor.executeApproval(approval.approvalId, { dryRun: true, operatorId: 'founder-demo' });
  const note = await harness.executor.requestApproval(
    CONTROLLED_ACTION_IDS.INTERNAL_NOTE_CREATE,
    { title: 'Founder beta note', body: 'Local internal note stays dry-run in this demo.' },
    context('b2b-sales-agent', 'demo-v1-note'),
  );
  const daily = await dailyService.runDaily();
  const backup = backupService.createBackup();
  const exportSummary = backupService.exportSummary();
  process.stdout.write(`${JSON.stringify({
    version: 'v1.0',
    setup: daily.setup,
    controlTower: daily.controlTower,
    dailyLabels: daily.labels,
    controlledActionDraft: draft.status,
    approvalDryRunExecution: execution.status,
    internalNoteApproval: note.status,
    auditEvents: harness.auditLogService.list().length,
    backup,
    exportSummary: {
      counts: exportSummary.counts,
      productionDbIncluded: exportSummary.productionDbIncluded,
      rawTokensIncluded: exportSummary.rawTokensIncluded,
    },
    safety: daily.safetySummary,
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Demo v1.0 failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
