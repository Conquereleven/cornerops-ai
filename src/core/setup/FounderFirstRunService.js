class FounderFirstRunService {
  constructor({
    actions,
    backupService,
    controlTowerReportService,
    operatorCommandRouter,
    setupValidator,
  } = {}) {
    this.actions = actions;
    this.backupService = backupService;
    this.controlTowerReportService = controlTowerReportService;
    this.operatorCommandRouter = operatorCommandRouter;
    this.setupValidator = setupValidator;
  }

  async runDaily({ operatorId = 'local-founder', channel = 'cli' } = {}) {
    const setup = this.setupValidator.run();
    const report = await this.controlTowerReportService.getReport();
    const prompts = [
      ['dailyBriefing', 'Dame mi briefing de hoy'],
      ['b2bFollowup', 'Qué leads B2B tengo pendientes para seguimiento'],
      ['quotesOrders', 'Revisa quotes y órdenes sin seguimiento'],
      ['githubEngineering', 'Dame resumen GitHub y Codex de tareas técnicas'],
      ['securityReview', 'Revisa eventos de seguridad recientes'],
    ];
    const operatorResults = {};
    for (const [key, text] of prompts) {
      operatorResults[key] = await this.operatorCommandRouter.handle({
        channel,
        operatorId,
        requestId: `founder-daily-${key}`,
        text,
        metadata: { founderDaily: true },
      });
    }
    const controlledActions = this.actions.controlledActionExecutor.status();
    const backup = this.backupService.getLatestBackupSummary();
    return {
      version: 'v1.0',
      generatedAt: new Date().toISOString(),
      labels: ['mock', 'read-only', 'dry-run', 'disabled', 'local_internal'],
      setup: {
        status: setup.status,
        counts: setup.counts,
      },
      controlTower: {
        status: report.status,
        mode: report.mode,
        founderReady: report.founderBetaReadiness?.ready === true,
      },
      security: {
        warnings: report.safety?.warnings || [],
        externalSendsBlocked: report.safety?.externalSendsBlocked === true,
        writesBlocked: report.safety?.writesBlocked === true,
        realExecutionAllowed: controlledActions.realExecutionAllowed === true,
      },
      sources: {
        businessDataMode: report.businessData?.mode || 'mock',
        firstRealSourceMode: report.firstRealSource?.mode || 'mock',
        openclawMode: report.openclaw?.mode || 'disabled',
      },
      approvals: report.approvals,
      audit: {
        eventsLast24h: report.audit?.eventsLast24h || 0,
        deniedLast24h: report.audit?.deniedLast24h || 0,
      },
      operatorResults,
      controlledActions: {
        enabled: controlledActions.enabled,
        dryRun: controlledActions.dryRun,
        actions: controlledActions.actions.map((action) => action.id),
        idempotency: controlledActions.idempotency,
      },
      backup,
      safetySummary: {
        writes: 'blocked',
        externalSends: 'blocked',
        githubIssueRealCreation: 'disabled',
        localNotesTasks: 'local_internal only when explicitly enabled',
      },
    };
  }
}

module.exports = { FounderFirstRunService };
