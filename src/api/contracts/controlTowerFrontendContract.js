const {
  CONTROL_TOWER_FRONTEND_SECTIONS,
  CONTROL_TOWER_FRONTEND_VERSION,
  createFrontendEnvelope,
  sanitizeContractValue,
} = require('./controlTowerFrontendSchemas');

const pickSourceMode = (...modes) => modes.find(Boolean) || 'local_internal';

const supabaseSummary = (report = {}) => {
  const connector = report.cornerMexLovableConnector || {};
  return {
    dataSource: connector.dataSource || (connector.sourceMode === 'real_read_only' || connector.sourceMode === 'real_read_only_partial'
      ? 'cornermex_supabase'
      : connector.sourceMode === 'repo_discovered' ? 'lovable_repo_discovery' : 'mock_fallback'),
    supabaseStatus: connector.supabaseStatus || 'not_configured',
    tableAvailability: connector.tableAvailability || {},
    maskingApplied: connector.maskingApplied !== false,
    lastReadAt: connector.lastReadAt || null,
    auditId: connector.auditId || null,
    sourceMode: connector.sourceMode || 'repo_discovered',
  };
};

class ControlTowerFrontendContract {
  constructor({
    approvalCenterService,
    auditViewerService,
    controlTowerReportService,
    controlledActionExecutor,
    flowEngine,
    liveControlTowerStatusService,
    actionEngineService,
    productActivationEngine,
    messageDraftService,
    workQueueService,
    approvalEngineService,
  } = {}) {
    this.approvalCenterService = approvalCenterService;
    this.auditViewerService = auditViewerService;
    this.controlTowerReportService = controlTowerReportService;
    this.controlledActionExecutor = controlledActionExecutor;
    this.flowEngine = flowEngine;
    this.liveControlTowerStatusService = liveControlTowerStatusService;
    this.actionEngineService = actionEngineService;
    this.productActivationEngine = productActivationEngine;
    this.messageDraftService = messageDraftService;
    this.workQueueService = workQueueService;
    this.approvalEngineService = approvalEngineService;
  }

  async getSection(section) {
    if (!CONTROL_TOWER_FRONTEND_SECTIONS.includes(section)) {
      return createFrontendEnvelope({
        section,
        status: 'error',
        sourceMode: 'disabled',
        warnings: [`Unknown frontend contract section: ${section}`],
        data: { supportedSections: CONTROL_TOWER_FRONTEND_SECTIONS },
      });
    }
    const report = await this.safeReport();
    const builders = {
      actions: () => this.actions(report),
      approvals: () => this.approvals(report),
      audit: () => this.audit(report),
      cornermex: () => this.cornerMex(report),
      drafts: () => this.drafts(report),
      flows: () => this.flows(report),
      'founder-daily': () => this.founderDaily(report),
      security: () => this.security(report),
      status: () => this.status(report),
      telegram: () => this.telegram(report),
      'work-queue': () => this.workQueue(report),
    };
    return builders[section]();
  }

  async getAllSections() {
    const entries = await Promise.all(
      CONTROL_TOWER_FRONTEND_SECTIONS.map(async (section) => [section, await this.getSection(section)]),
    );
    const sections = Object.fromEntries(entries);
    const sectionValues = Object.values(sections);
    const rootEnvelope = createFrontendEnvelope({
      section: 'all',
      sourceMode: pickSourceMode(
        sections.status?.sourceMode,
        sections.cornermex?.sourceMode,
        sections.flows?.sourceMode,
        'local_internal',
      ),
      approvalRequired: sectionValues.some((section) => section.approvalRequired === true),
      warnings: sectionValues.flatMap((section) => section.warnings || []),
      data: {
        sectionCount: CONTROL_TOWER_FRONTEND_SECTIONS.length,
        sections: CONTROL_TOWER_FRONTEND_SECTIONS,
        bridgeMode: 'read_only',
      },
    });
    return {
      ...rootEnvelope,
      version: CONTROL_TOWER_FRONTEND_VERSION,
      generatedAt: new Date().toISOString(),
      sections,
    };
  }

  async getConnectionTest({ auditId, authMode = 'operator_token', origin = '' } = {}) {
    const report = await this.safeReport();
    return createFrontendEnvelope({
      section: 'connection-test',
      sourceMode: pickSourceMode(
        report.cornerMexLovableConnector?.sourceMode,
        report.realSourceExpansion?.sourceModeSummary,
        'local_internal',
      ),
      auditId,
      warnings: [
        ...(report.safety?.warnings || []),
        'Read-only bridge verified. Writes and external sends remain blocked.',
      ],
      data: {
        status: 'ok',
        backendTime: new Date().toISOString(),
        apiVersion: CONTROL_TOWER_FRONTEND_VERSION,
        authMode,
        readOnly: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        sourceMode: pickSourceMode(
          report.cornerMexLovableConnector?.sourceMode,
          report.realSourceExpansion?.sourceModeSummary,
          'local_internal',
        ),
        lovableOriginAllowed: Boolean(origin),
        bridgeMode: 'read_only',
      },
    });
  }

  async safeReport() {
    const fallback = {
      status: 'ready',
      version: 'v1.3',
      generatedAt: new Date().toISOString(),
      safety: {
        externalSendsBlocked: true,
        whatsappDisabled: true,
        warnings: ['Control Tower backend report unavailable; using frontend-safe fallback.'],
      },
      cornerMexLovableConnector: { sourceMode: 'repo_discovered', writesBlocked: true, warnings: [] },
      cornerMexFlowEngine: { enabled: true, sourceMode: 'repo_discovered', availableFlows: [], warnings: [] },
      telegramOperator: { operatorMode: 'polling', founderPollingStatus: 'missing_config', warnings: [] },
    };
    if (!this.controlTowerReportService?.getReport) return fallback;
    try {
      return sanitizeContractValue(await this.controlTowerReportService.getReport());
    } catch (error) {
      return {
        ...fallback,
        warnings: [`Control Tower report failed safely: ${error.message}`],
      };
    }
  }

  envelope(section, report, data, options = {}) {
    const warnings = [
      ...(report.safety?.warnings || []),
      ...(options.warnings || []),
    ];
    return createFrontendEnvelope({
      section,
      sourceMode: options.sourceMode || pickSourceMode(
        data?.sourceMode,
        report.cornerMexLovableConnector?.sourceMode,
        report.realSourceExpansion?.sourceModeSummary,
        'local_internal',
      ),
      approvalRequired: options.approvalRequired || false,
      auditId: options.auditId,
      warnings,
      data: {
        version: CONTROL_TOWER_FRONTEND_VERSION,
        ...data,
      },
    });
  }

  async liveStatus() {
    if (!this.liveControlTowerStatusService?.build) return null;
    try {
      return await this.liveControlTowerStatusService.build({
        requestId: 'control-tower-frontend-contract-v1.8',
        userId: 'lovable-control-tower',
        channel: 'api',
      });
    } catch (error) {
      return { error: `Live Control Tower status failed safely: ${error.message}` };
    }
  }

  async status(report) {
    const live = await this.liveStatus();
    const workQueue = await this.workQueueService?.status?.().catch(() => null);
    if (live && !live.error) {
      return this.envelope('status', report, {
        service: 'cornerops-ai',
        appName: 'CornerOps Control Tower',
        backendRole: 'brain',
        lovableFrontendRole: 'cockpit',
        cornerMexLovableRole: 'marketplace',
        generatedAt: live.generatedAt,
        mode: live.mode,
        sourceMode: live.mode,
        dataSource: live.source,
        fallbackActive: live.fallbackActive,
        connectors: live.connectors,
        catalog: live.catalog,
        founderReview: live.founderReview,
        capabilityMatrix: live.capabilityMatrix,
        operatingStage: live.operatingStage,
        workflowCoverage: live.workflowCoverage,
        environmentDoctor: live.environmentDoctor,
        safety: live.safety,
        workQueue,
      }, {
        sourceMode: live.mode,
        warnings: live.warnings || [],
      });
    }
    const supabase = supabaseSummary(report);
    return this.envelope('status', report, {
      service: 'cornerops-ai',
      appName: 'CornerOps Control Tower',
      backendRole: 'brain',
      lovableFrontendRole: 'cockpit',
      cornerMexLovableRole: 'marketplace',
      generatedAt: report.generatedAt,
      sourceMode: pickSourceMode(report.realSourceExpansion?.sourceModeSummary, 'local_internal'),
      fallbackActive: true,
      dataSource: supabase.dataSource,
      supabaseStatus: supabase.supabaseStatus,
      tableAvailability: supabase.tableAvailability,
      maskingApplied: supabase.maskingApplied,
      lastReadAt: supabase.lastReadAt,
      telegram: {
        mode: report.telegramOperator?.operatorMode || 'polling',
        founderPollingStatus: report.telegramOperator?.founderPollingStatus || 'missing_config',
      },
      safety: this.safetySummary(report),
    });
  }

  founderDaily(report) {
    const supabase = supabaseSummary(report);
    return this.envelope('founder-daily', report, {
      headline: 'CornerOps Founder Daily is available through backend and Telegram.',
      sourceMode: pickSourceMode(report.cornerMexLovableConnector?.sourceMode, 'repo_discovered'),
      dataSource: supabase.dataSource,
      supabaseStatus: supabase.supabaseStatus,
      tableAvailability: supabase.tableAvailability,
      maskingApplied: supabase.maskingApplied,
      lastReadAt: supabase.lastReadAt,
      urgentActions: [
        'Keep Telegram founder polling allowlisted.',
        'Add Supabase URL and anon/read-only key to unlock real_read_only CornerMex summaries.',
        'Review approvals before any controlled action leaves draft mode.',
      ],
      flowSummary: report.cornerMexFlowEngine?.availableFlows || [],
      blocked: this.blockedCapabilities(),
    });
  }

  async cornerMex(report) {
    const live = await this.liveStatus();
    if (live && !live.error) {
      return this.envelope('cornermex', report, {
        sourceMode: live.mode,
        currentMode: live.mode,
        dataSource: live.source,
        catalog: live.catalog,
        productActivation: live.productActivation,
        stageWorkflows: live.stageWorkflows,
        fallbackActive: live.fallbackActive,
        writesBlocked: true,
      }, {
        sourceMode: live.mode,
        warnings: live.catalog?.warnings || live.warnings || [],
      });
    }
    const connector = report.cornerMexLovableConnector || {};
    const supabase = supabaseSummary(report);
    return this.envelope('cornermex', report, {
      sourceMode: connector.sourceMode || 'repo_discovered',
      currentMode: connector.sourceMode || 'repo_discovered',
      dataSource: supabase.dataSource,
      supabaseStatus: supabase.supabaseStatus,
      tableAvailability: supabase.tableAvailability,
      maskingApplied: supabase.maskingApplied,
      lastReadAt: supabase.lastReadAt,
      auditId: supabase.auditId,
      lovableProjectUrlConfigured: Boolean(connector.projectUrlConfigured || connector.configIntake?.configCompleteness?.lovableProjectUrl),
      githubRepoConfigured: Boolean(connector.githubRepoConfigured || connector.configIntake?.configCompleteness?.lovableGithubRepo),
      supabaseReadOnlyStatus: connector.supabaseRealReadOnlyReadiness || 'pending_credentials',
      rowCounts: connector.rowCounts || {},
      mappedContracts: connector.mappedContracts || [],
      contractConfidence: connector.mappedContractConfidence || connector.contractConfidence || {},
      missingFounderConfig: connector.missingFounderConfig || ['CORNERMEX_SUPABASE_URL', 'CORNERMEX_SUPABASE_ANON_KEY'],
      writesBlocked: connector.writesBlocked !== false,
      warnings: connector.warnings || [],
    }, { sourceMode: connector.sourceMode || 'repo_discovered', warnings: connector.warnings || [] });
  }

  async flows(report) {
    const supabase = supabaseSummary(report);
    const actionEngine = this.actionEngineService?.build
      ? await this.actionEngineService.build({
        requestId: 'control-tower-frontend-flows-v1.8',
        userId: 'lovable-control-tower',
        channel: 'api',
      }).catch((error) => ({ warnings: [`Action Engine failed safely: ${error.message}`] }))
      : null;
    let analysis = null;
    if (this.flowEngine?.analyzeFlows) {
      try {
        analysis = await this.flowEngine.analyzeFlows({
          requestId: 'control-tower-frontend-v1.3',
          operatorId: 'lovable-control-tower',
        });
      } catch (error) {
        analysis = { warnings: [`Flow analysis failed safely: ${error.message}`] };
      }
    }
    const flowStatus = report.cornerMexFlowEngine || {};
    return this.envelope('flows', report, {
      sourceMode: analysis?.sourceMode || flowStatus.sourceMode || 'repo_discovered',
      dataSource: analysis?.dataSource || flowStatus.dataSource || supabase.dataSource,
      supabaseStatus: analysis?.supabaseStatus || flowStatus.supabaseStatus || supabase.supabaseStatus,
      tableAvailability: analysis?.tableAvailability || flowStatus.tableAvailability || supabase.tableAvailability,
      maskingApplied: analysis?.maskingApplied ?? flowStatus.maskingApplied ?? supabase.maskingApplied,
      lastReadAt: analysis?.lastReadAt || flowStatus.lastReadAt || supabase.lastReadAt,
      availableFlows: analysis?.availableFlows || flowStatus.availableFlows || [],
      summary: analysis?.summary || {
        flowsWithData: flowStatus.flowsWithEnoughData || [],
        flowsMissingData: flowStatus.flowsMissingData || [],
      },
      flows: actionEngine?.flows || analysis?.flows || [],
      actionEngine: actionEngine ? {
        recommendedActionCount: actionEngine.recommendedActions?.length || 0,
        approvalQueueCount: actionEngine.approvalQueue?.length || 0,
      } : null,
      draftSendingDisabled: false,
      draftStatus: 'internal_draft_enabled_or_approval_required',
      whatsappDisabled: true,
      emailSendingDisabled: true,
      writesBlocked: true,
      auditId: actionEngine?.auditId || analysis?.auditId,
    }, {
      sourceMode: actionEngine?.sourceMode || analysis?.sourceMode || flowStatus.sourceMode || 'repo_discovered',
      auditId: actionEngine?.auditId || analysis?.auditId,
      warnings: actionEngine?.warnings || analysis?.warnings || flowStatus.warnings || [],
    });
  }

  async approvals(report) {
    const persistent = this.approvalEngineService?.list
      ? await this.approvalEngineService.list({ limit: 100 })
      : null;
    const legacy = !persistent && this.approvalCenterService?.list
      ? await this.approvalCenterService.list({ limit: 25 })
      : { approvals: [], pendingCount: 0 };
    const approvals = persistent || legacy.approvals || legacy.items || [];
    return this.envelope('approvals', report, {
      sourceMode: 'local_internal',
      items: approvals,
      pending: approvals.filter((item) => item.status === 'pending'),
      approved: approvals.filter((item) => item.status === 'approved'),
      rejected: approvals.filter((item) => item.status === 'rejected'),
      pendingCount: approvals.filter((item) => item.status === 'pending').length,
      approvalRequiredForRiskyActions: true,
      externalSendsBlocked: true,
      approvalSemantics: 'internal_decision_only',
      executionStatus: 'not_available_in_current_version',
    }, { sourceMode: 'local_internal', approvalRequired: true });
  }

  async audit(report) {
    const persistent = this.workQueueService?.listAudit
      ? await this.workQueueService.listAudit({ limit: 100 })
      : null;
    const legacy = !persistent && this.auditViewerService?.getEvents
      ? await this.auditViewerService.getEvents({ limit: 20 })
      : { events: [] };
    return this.envelope('audit', report, {
      sourceMode: 'local_internal',
      sanitized: true,
      appendOnly: true,
      events: persistent || legacy.events || legacy.items || [],
      filters: ['source', 'action', 'status', 'date'],
    }, { sourceMode: 'local_internal' });
  }

  security(report) {
    return this.envelope('security', report, {
      sourceMode: 'local_internal',
      noSecretsExposed: true,
      highRiskCapabilitiesDisabled: true,
      telegramAllowlistRequired: true,
      supabaseReadOnlyStatus: report.cornerMexLovableConnector?.supabaseRealReadOnlyReadiness || 'pending_credentials',
      openclawStatus: report.openclaw?.enabled ? 'enabled' : 'disabled_or_pending',
      safety: this.safetySummary(report),
    }, { sourceMode: 'local_internal' });
  }

  telegram(report) {
    const telegram = report.telegramOperator || {};
    return this.envelope('telegram', report, {
      sourceMode: 'local_internal',
      pollingStatus: telegram.founderPollingStatus || 'missing_config',
      mode: telegram.operatorMode || 'polling',
      founderOnly: true,
      realReplyAllowed: telegram.realReplyAllowed === true,
      replyDryRun: telegram.replyDryRun !== false,
      allowedUsersCount: telegram.allowedUsersCount || 0,
      allowedChatsCount: telegram.allowedChatsCount || 0,
      groupsRejected: telegram.groupsRejected !== false,
      replayProtection: telegram.replayProtection || { enabled: true },
      rejectionTracking: telegram.rejectionTracking || { enabled: true },
      rateLimiting: telegram.rateLimiting || { enabled: true },
      lastInbound: telegram.lastApprovedInbound || telegram.lastInbound || null,
      lastReply: telegram.lastReply || null,
      missingConfig: telegram.pollingMissingConfig || telegram.missingConfig || [],
    }, { sourceMode: 'local_internal', warnings: telegram.warnings || [] });
  }

  async drafts(report) {
    const persistentDrafts = this.workQueueService?.listDrafts
      ? await this.workQueueService.listDrafts({ limit: 100 })
      : [];
    const workQueueStatus = this.workQueueService?.status
      ? await this.workQueueService.status().catch(() => null)
      : null;
    const actionState = this.actionEngineService?.build
      ? await this.actionEngineService.build({
        requestId: 'control-tower-frontend-drafts-v1.8',
        userId: 'lovable-control-tower',
        channel: 'api',
      }).catch((error) => ({ warnings: [`Action Engine drafts preview failed safely: ${error.message}`], recommendedActions: [] }))
      : { recommendedActions: [] };
    return this.envelope('drafts', report, {
      sourceMode: actionState.sourceMode || 'local_internal',
      draftTypes: [
        'whatsapp_follow_up_draft',
        'email_follow_up_draft',
        'quote_follow_up_draft',
        'payment_review_draft',
        'b2b_lead_intro_draft',
      ],
      sendStatus: 'not_sendable_in_current_version',
      localOnly: true,
      items: persistentDrafts,
      recommendedDraftSources: (actionState.recommendedActions || []).slice(0, 10).map((action) => ({
        id: action.id,
        type: action.type,
        title: action.title,
        approvalRequired: action.approvalRequired !== false,
      })),
      persistence: workQueueStatus?.persistence?.provider || 'not_configured',
      persistenceStatus: workQueueStatus?.persistence || { status: 'configuration_required' },
      whatsappSendsDisabled: true,
      emailSendsDisabled: true,
    }, {
      sourceMode: actionState.sourceMode || 'local_internal',
      auditId: actionState.auditId,
      warnings: actionState.warnings || [],
      approvalRequired: true,
    });
  }

  async workQueue(report) {
    const [status, items, metrics] = await Promise.all([
      this.workQueueService?.status?.() || Promise.resolve({ status: 'configuration_required' }),
      this.workQueueService?.list?.({ limit: 100 }) || Promise.resolve([]),
      this.workQueueService?.metrics?.() || Promise.resolve({}),
    ]);
    return this.envelope('work-queue', report, {
      sourceMode: 'local_internal',
      status: status.status,
      persistence: status.persistence,
      internalSchema: status.internalSchema || 'cornerops_internal',
      items,
      metrics,
      filters: ['priority', 'status', 'sourceFlow', 'approvalRequired', 'operatingStage'],
      syncEndpoint: '/api/intelligence/work-queue/sync',
      syncRequiresFounderActionAuth: true,
      optimisticConcurrency: true,
      productionMutationsBlocked: true,
      externalSendsBlocked: true,
    }, {
      sourceMode: 'local_internal',
      approvalRequired: true,
      warnings: status.status === 'ready' ? [] : ['Durable internal persistence requires reviewed production configuration.'],
    });
  }

  async actions(report) {
    const status = this.controlledActionExecutor?.status
      ? this.controlledActionExecutor.status()
      : { enabled: false, dryRun: true, realExecutionAllowed: false, actions: [] };
    const actionEngine = this.actionEngineService?.build
      ? await this.actionEngineService.build({
        requestId: 'control-tower-frontend-actions-v1.8',
        userId: 'lovable-control-tower',
        channel: 'api',
      }).catch((error) => ({ warnings: [`Action Engine failed safely: ${error.message}`], recommendedActions: [] }))
      : null;
    return this.envelope('actions', report, {
      sourceMode: actionEngine?.sourceMode || 'local_internal',
      controlledActions: status,
      actionEngine: actionEngine ? {
        flows: actionEngine.flows,
        recommendedActions: actionEngine.recommendedActions,
        approvalQueue: actionEngine.approvalQueue,
      } : null,
      riskyActionsRequireApproval: true,
      realExecutionBlocked: status.realExecutionAllowed !== true,
      dryRunOnly: status.dryRun !== false,
      externalSendsBlocked: true,
    }, { sourceMode: actionEngine?.sourceMode || 'local_internal', approvalRequired: true, warnings: actionEngine?.warnings || [] });
  }

  safetySummary(report) {
    return {
      readOnly: true,
      dryRun: true,
      writesBlocked: true,
      externalSendsBlocked: report.safety?.externalSendsBlocked !== false,
      whatsappSendsBlocked: true,
      emailSendsBlocked: true,
      customerChannelsDisabled: true,
      productionWritesDisabled: true,
      openclawNotStartedInV13: true,
    };
  }

  blockedCapabilities() {
    return [
      'production_writes',
      'supabase_writes',
      'lovable_mutations',
      'github_writes',
      'whatsapp_sends',
      'external_emails',
      'customer_channels',
      'proactive_outbound',
      'openclaw_v1.3',
    ];
  }
}

module.exports = {
  ControlTowerFrontendContract,
};
