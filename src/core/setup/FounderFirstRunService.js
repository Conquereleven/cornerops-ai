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
      ['cornermexFlows', 'flows status'],
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
      version: 'v1.1',
      generatedAt: new Date().toISOString(),
      labels: ['mock', 'read-only', 'real_read_only', 'mixed', 'disabled', 'local_internal', 'dry-run', 'dry_run'],
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
        githubMode: report.github?.mode || 'mock',
        firstRealSourceMode: report.firstRealSource?.mode || 'mock',
        realSourceExpansionMode: report.realSourceExpansion?.sourceModeSummary || 'not_available',
        cornerMexLovableMode: report.cornerMexLovableConnector?.sourceMode || 'mock',
        cornerMexLovableProjectConfigured: report.cornerMexLovableConnector?.projectConfigured === true,
        cornerMexLovableRepoConfigured: report.cornerMexLovableConnector?.githubRepoConfigured === true,
        cornerMexSupabaseConfigured: report.cornerMexLovableConnector?.supabaseConfigured === true,
        cornerMexSchemaDiscoveryStatus: report.cornerMexLovableConnector?.schemaDiscovery?.status || 'not_available',
        cornerMexSchemaTables: report.cornerMexLovableConnector?.schemaDiscovery?.tables || [],
        cornerMexContractConfidence: report.cornerMexLovableConnector?.contractConfidence || {},
        cornerMexConfigIntakeStatus: report.cornerMexLovableConnector?.configIntakeStatus || 'unknown',
        cornerMexConfigCompleteness: report.cornerMexLovableConnector?.configCompleteness || {},
        cornerMexRepoDiscoveryStatus: report.cornerMexLovableConnector?.githubRepoConfigured ? 'repo_discovered_ready' : 'missing_config',
        cornerMexSupabaseReadOnlyStatus: report.cornerMexLovableConnector?.supabaseConfigured ? 'real_read_only_ready' : 'missing_config',
        cornerMexNextAction: report.cornerMexLovableConnector?.exactNextRecommendedAction || 'Provide Lovable config.',
        telegramOperatorMode: report.telegramOperator?.realMode ? 'real_dry_run' : 'dry_run',
        telegramOperatorEnabled: report.telegramOperator?.enabled === true,
        telegramOperatorMissingConfig: report.telegramOperator?.missingConfig || [],
        telegramFounderWebhookReadiness: report.telegramOperator?.founderWebhookReadiness || 'missing_config',
        telegramFounderWebhookMissingConfig: report.telegramOperator?.missingConfig || [],
        telegramRealReplyAllowed: report.telegramOperator?.realReplyAllowed === true,
        telegramWebhookSetupAllowed: report.telegramOperator?.webhookSetupAllowed === true,
        telegramWebhookNextAction: report.telegramOperator?.exactNextFounderAction || 'Configure founder Telegram env vars locally.',
        telegramFounderPollingStatus: report.telegramOperator?.founderPollingStatus || 'missing_config',
        telegramFounderPollingMissingConfig: report.telegramOperator?.pollingMissingConfig || [],
        telegramFounderPollingEnabled: report.telegramOperator?.pollingEnabled === true,
        telegramFounderRealReplyAllowed: report.telegramOperator?.realReplyAllowed === true,
        telegramFounderPollingNextAction: report.telegramOperator?.exactNextPollingAction || 'Configure Telegram polling env vars locally.',
        telegramFounderCommands: report.telegramOperator?.exactFounderPollingCommands || [
          'npm run telegram:founder-id-discovery',
          'npm run telegram:founder-polling',
        ],
        cornerMexFlowEngineMode: report.cornerMexFlowEngine?.sourceMode || 'mock',
        cornerMexFlowEngineAvailableFlows: report.cornerMexFlowEngine?.availableFlows || [],
        cornerMexFlowEngineFlowsWithData: report.cornerMexFlowEngine?.flowsWithEnoughData || [],
        messageDraftStatus: 'local_internal_not_sendable_in_v1.2',
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
        cornerMexLovableWrites: report.cornerMexLovableConnector?.writesBlocked === false ? 'unsafe' : 'blocked',
        lovableProjectMutation: 'blocked',
        githubIssueRealCreation: 'disabled',
        telegramReplies: report.telegramOperator?.replyDryRun === false ? 'unsafe' : 'dry_run',
        whatsappDrafts: 'local_internal_not_sendable_in_v1.2',
        emailDrafts: 'local_internal_not_sendable_in_v1.2',
        localNotesTasks: 'local_internal only when explicitly enabled',
      },
    };
  }
}

module.exports = { FounderFirstRunService };
