const {
  CONTROL_TOWER_FRONTEND_SECTIONS,
  CONTROL_TOWER_FRONTEND_VERSION,
  createFrontendEnvelope,
  sanitizeContractValue,
} = require('./controlTowerFrontendSchemas');

const pickSourceMode = (...modes) => modes.find(Boolean) || 'local_internal';

class ControlTowerFrontendContract {
  constructor({
    approvalCenterService,
    auditViewerService,
    controlTowerReportService,
    controlledActionExecutor,
    flowEngine,
    messageDraftService,
  } = {}) {
    this.approvalCenterService = approvalCenterService;
    this.auditViewerService = auditViewerService;
    this.controlTowerReportService = controlTowerReportService;
    this.controlledActionExecutor = controlledActionExecutor;
    this.flowEngine = flowEngine;
    this.messageDraftService = messageDraftService;
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
    };
    return builders[section]();
  }

  async getAllSections() {
    const entries = await Promise.all(
      CONTROL_TOWER_FRONTEND_SECTIONS.map(async (section) => [section, await this.getSection(section)]),
    );
    return {
      version: CONTROL_TOWER_FRONTEND_VERSION,
      generatedAt: new Date().toISOString(),
      sections: Object.fromEntries(entries),
    };
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

  status(report) {
    return this.envelope('status', report, {
      service: 'cornerops-ai',
      appName: 'CornerOps Control Tower',
      backendRole: 'brain',
      lovableFrontendRole: 'cockpit',
      cornerMexLovableRole: 'marketplace',
      generatedAt: report.generatedAt,
      sourceMode: pickSourceMode(report.realSourceExpansion?.sourceModeSummary, 'local_internal'),
      telegram: {
        mode: report.telegramOperator?.operatorMode || 'polling',
        founderPollingStatus: report.telegramOperator?.founderPollingStatus || 'missing_config',
      },
      safety: this.safetySummary(report),
    });
  }

  founderDaily(report) {
    return this.envelope('founder-daily', report, {
      headline: 'CornerOps Founder Daily is available through backend and Telegram.',
      sourceMode: pickSourceMode(report.cornerMexLovableConnector?.sourceMode, 'repo_discovered'),
      urgentActions: [
        'Keep Telegram founder polling allowlisted.',
        'Add Supabase URL and anon/read-only key to unlock real_read_only CornerMex summaries.',
        'Review approvals before any controlled action leaves draft mode.',
      ],
      flowSummary: report.cornerMexFlowEngine?.availableFlows || [],
      blocked: this.blockedCapabilities(),
    });
  }

  cornerMex(report) {
    const connector = report.cornerMexLovableConnector || {};
    return this.envelope('cornermex', report, {
      sourceMode: connector.sourceMode || 'repo_discovered',
      currentMode: connector.sourceMode || 'repo_discovered',
      lovableProjectUrlConfigured: Boolean(connector.projectUrlConfigured || connector.configIntake?.configCompleteness?.lovableProjectUrl),
      githubRepoConfigured: Boolean(connector.githubRepoConfigured || connector.configIntake?.configCompleteness?.lovableGithubRepo),
      supabaseReadOnlyStatus: connector.supabaseRealReadOnlyReadiness || 'pending_credentials',
      mappedContracts: connector.mappedContracts || [],
      contractConfidence: connector.mappedContractConfidence || connector.contractConfidence || {},
      missingFounderConfig: connector.missingFounderConfig || ['CORNERMEX_SUPABASE_URL', 'CORNERMEX_SUPABASE_ANON_KEY'],
      writesBlocked: connector.writesBlocked !== false,
      warnings: connector.warnings || [],
    }, { sourceMode: connector.sourceMode || 'repo_discovered', warnings: connector.warnings || [] });
  }

  async flows(report) {
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
      availableFlows: analysis?.availableFlows || flowStatus.availableFlows || [],
      summary: analysis?.summary || {
        flowsWithData: flowStatus.flowsWithEnoughData || [],
        flowsMissingData: flowStatus.flowsMissingData || [],
      },
      flows: analysis?.flows || [],
      draftSendingDisabled: true,
      whatsappDisabled: true,
      emailSendingDisabled: true,
      writesBlocked: true,
      auditId: analysis?.auditId,
    }, {
      sourceMode: analysis?.sourceMode || flowStatus.sourceMode || 'repo_discovered',
      auditId: analysis?.auditId,
      warnings: analysis?.warnings || flowStatus.warnings || [],
    });
  }

  async approvals(report) {
    const list = this.approvalCenterService?.list
      ? await this.approvalCenterService.list({ limit: 25 })
      : { approvals: [], pendingCount: 0 };
    return this.envelope('approvals', report, {
      sourceMode: 'local_internal',
      pending: list.approvals || list.items || [],
      pendingCount: list.pendingCount || (list.approvals || list.items || []).filter((item) => item.status === 'pending').length,
      approvalRequiredForRiskyActions: true,
      externalSendsBlocked: true,
      dryRunActionsOnly: true,
    }, { sourceMode: 'local_internal', approvalRequired: true });
  }

  async audit(report) {
    const events = this.auditViewerService?.getEvents
      ? await this.auditViewerService.getEvents({ limit: 20 })
      : { events: [] };
    return this.envelope('audit', report, {
      sourceMode: 'local_internal',
      sanitized: true,
      events: events.events || events.items || [],
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
    const draft = this.messageDraftService?.createDraft
      ? await this.messageDraftService.createDraft({
        channel: 'whatsapp',
        text: 'sample quote follow-up for Lovable UI preview',
        sourceMode: 'local_internal',
        requestId: 'control-tower-frontend-draft-preview',
        operatorId: 'lovable-control-tower',
      })
      : null;
    return this.envelope('drafts', report, {
      sourceMode: 'local_internal',
      draftTypes: [
        'whatsapp_follow_up_draft',
        'email_follow_up_draft',
        'quote_follow_up_draft',
        'payment_review_draft',
        'b2b_lead_intro_draft',
      ],
      sendStatus: 'not_sendable_in_current_version',
      localOnly: true,
      sampleDraft: draft?.draft || null,
      whatsappSendsDisabled: true,
      emailSendsDisabled: true,
    }, {
      sourceMode: 'local_internal',
      auditId: draft?.auditId,
      warnings: draft?.warnings || [],
      approvalRequired: true,
    });
  }

  actions(report) {
    const status = this.controlledActionExecutor?.status
      ? this.controlledActionExecutor.status()
      : { enabled: false, dryRun: true, realExecutionAllowed: false, actions: [] };
    return this.envelope('actions', report, {
      sourceMode: 'local_internal',
      controlledActions: status,
      riskyActionsRequireApproval: true,
      realExecutionBlocked: status.realExecutionAllowed !== true,
      dryRunOnly: status.dryRun !== false,
      externalSendsBlocked: true,
    }, { sourceMode: 'local_internal', approvalRequired: true });
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
