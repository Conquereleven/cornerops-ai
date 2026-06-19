const withinLast24Hours = (value) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) && timestamp >= Date.now() - (24 * 60 * 60 * 1000);
};

class ControlTowerService {
  constructor({
    agentAuditService,
    agentRegistry,
    config,
    contextHealthService,
    dataHealthService,
    ecosystemRegistry,
    githubClient,
    humanApprovalService,
    openclawAuditService,
    openclawConfig,
    auditLogService,
    businessDataService,
    dataContractRegistry,
    schemaDiscoveryService,
  } = {}) {
    this.agentAuditService = agentAuditService;
    this.agentRegistry = agentRegistry;
    this.config = config;
    this.contextHealthService = contextHealthService;
    this.dataHealthService = dataHealthService;
    this.ecosystemRegistry = ecosystemRegistry;
    this.githubClient = githubClient;
    this.humanApprovalService = humanApprovalService;
    this.openclawAuditService = openclawAuditService;
    this.openclawConfig = openclawConfig;
    this.auditLogService = auditLogService;
    this.businessDataService = businessDataService;
    this.dataContractRegistry = dataContractRegistry;
    this.schemaDiscoveryService = schemaDiscoveryService;
  }

  async getReport() {
    if (!this.config.corneropsControlTowerEnabled) {
      return {
        status: 'unhealthy',
        mode: 'disabled',
        warnings: ['CORNEROPS_CONTROL_TOWER_ENABLED=false'],
      };
    }
    const [dataHealth, contextHealth, approvals, audit, businessData] = await Promise.all([
      this.dataHealthService.getReport(),
      this.contextHealthService.getReport(),
      this.getApprovalsSummary(),
      this.getAuditSummary(),
      this.businessDataService?.getHealth
        ? this.businessDataService.getHealth({ agentId: 'control-tower' })
        : Promise.resolve({
          status: 'degraded',
          mode: 'mock',
          provider: 'mock',
          readOnlyVerified: true,
          mappedEntities: [],
          warnings: ['Business data service is unavailable.'],
        }),
    ]);
    const agents = this.agentRegistry.list();
    const security = this.getSecurityReport();
    const github = this.githubClient.getStatus();
    const openclawWarnings = [];
    if (!this.openclawConfig.enabled) openclawWarnings.push('OpenClaw is disabled.');
    if (this.openclawConfig.enabled && this.openclawConfig.dryRun) {
      openclawWarnings.push('OpenClaw is enabled in dry-run mode.');
    }
    if (this.openclawConfig.sandboxMode === 'main') {
      openclawWarnings.push('OpenClaw sandbox mode must not target main.');
    }
    const warnings = [
      ...security.warnings,
      ...dataHealth.warnings,
      ...contextHealth.warnings,
      ...github.warnings,
    ];
    const status = security.warnings.some((warning) => warning.startsWith('CRITICAL:'))
      ? 'unhealthy'
      : warnings.length ? 'degraded' : 'healthy';
    return {
      status,
      mode: this.getMode(),
      agents: {
        total: agents.length,
        enabled: agents.filter((agent) => agent.enabled).length,
        disabled: agents.filter((agent) => !agent.enabled).length,
        warnings: agents.some((agent) => agent.enabled) ? [] : ['No agents are enabled.'],
      },
      dataSources: dataHealth.sources,
      businessData,
      schemaDiscovery: this.businessDataService?.getSchemaReport?.() || null,
      dataContracts: this.dataContractRegistry?.listMappings?.() || [],
      contextSources: contextHealth.sources,
      openclaw: {
        enabled: this.openclawConfig.enabled,
        connected: false,
        mode: this.openclawConfig.dryRun ? 'dry_run' : 'controlled',
        warnings: openclawWarnings,
      },
      ecosystemServices: this.ecosystemRegistry.list().map((service) => ({
        id: service.id,
        enabled: service.enabled,
        mode: service.mode,
        riskLevel: service.riskLevel,
        status: service.enabled ? 'available' : 'disabled',
      })),
      github,
      approvals,
      audit,
      security,
      demoMode: this.config.corneropsQaMode,
      dryRun: this.config.corneropsDryRun,
      realSourceOnboarding: {
        enabled: this.config.corneropsRealSourceOnboardingEnabled,
        source: this.config.corneropsFirstRealSource,
        mode: this.config.corneropsFirstRealSourceMode,
        ready: github.connected && github.readOnly,
      },
      operatorInterface: {
        enabled: this.config.corneropsOperatorInterfaceEnabled,
        interactiveBetaEnabled: this.config.corneropsInteractiveBetaEnabled,
        mode: this.config.corneropsOperatorInterfaceMode,
        dryRun: this.config.corneropsOperatorDryRun,
        readOnly: this.config.corneropsOperatorReadOnly,
        requireApproval: this.config.corneropsOperatorRequireApproval,
        cliEnabled: this.config.corneropsCliEnabled,
        apiEnabled: this.config.corneropsApiEnabled,
        webUiEnabled: this.config.corneropsWebUiEnabled,
      },
      disabledExternalSources: this.getExternalSources().filter((source) => !source.enabled),
      realSourcesEnabled: this.getExternalSources().filter((source) => source.enabled),
      lastDemoRun: {
        available: false,
        warning: 'Demo summaries are not persisted in v0.4.',
      },
      warnings,
      generatedAt: new Date().toISOString(),
    };
  }

  getMode() {
    if (this.config.corneropsInteractiveBetaEnabled) return 'interactive_beta';
    if (this.config.corneropsInternalBetaEnabled) return 'internal_beta';
    if (this.config.corneropsBetaMode) return 'beta';
    if (this.config.corneropsRealSourceOnboardingEnabled) return 'read_only';
    if (this.config.corneropsDryRun) return 'dry_run';
    return 'mock';
  }

  getSecurityReport() {
    const warnings = [];
    if (!this.config.corneropsStrictSecurityMode) warnings.push('CRITICAL: strict security mode is disabled.');
    if (!this.config.corneropsFailClosed) warnings.push('CRITICAL: fail-closed mode is disabled.');
    if (!this.config.corneropsPiiMasking) warnings.push('CRITICAL: PII masking is disabled.');
    if (!this.config.corneropsLogSanitization) warnings.push('CRITICAL: log sanitization is disabled.');
    if (!this.config.corneropsRequireApprovalForWrites) warnings.push('CRITICAL: write approvals are disabled.');
    if (!this.config.corneropsRequireApprovalForExternalActions) warnings.push('CRITICAL: external action approvals are disabled.');
    if (!this.config.corneropsRequireAuditForTools) warnings.push('Tool audit requirement is disabled.');
    if (this.config.corneropsDbReadOnly === false) warnings.push('CRITICAL: database read-only mode is disabled.');
    if (this.config.corneropsDbAllowWrites) warnings.push('CRITICAL: database writes are enabled.');
    if (this.config.corneropsDbAuditReads === false) warnings.push('CRITICAL: database read auditing is disabled.');
    if (this.config.corneropsDbPiiMasking === false) warnings.push('CRITICAL: database PII masking is disabled.');
    if (
      this.config.githubAllowIssueCreation
      || this.config.githubAllowPrWrite
      || this.config.githubAllowWorkflowTrigger
    ) {
      warnings.push('CRITICAL: one or more GitHub write flags are enabled.');
    }
    if (this.config.openclawEnabled && this.config.openclawSandboxMode === 'main') {
      warnings.push('CRITICAL: OpenClaw sandbox targets main.');
    }
    if (this.openclawConfig.enabled && !this.openclawConfig.dryRun) {
      warnings.push('CRITICAL: OpenClaw real execution is enabled during read-only beta.');
    }
    const nativeToolsEnabled = [
      this.config.gogcliEnabled,
      this.config.wacliEnabled,
      this.config.goplacesEnabled,
      this.config.clawpdfEnabled,
      this.config.ffmpegWasmEnabled,
      this.config.rastermillEnabled,
    ].some(Boolean);
    if (nativeToolsEnabled) warnings.push('CRITICAL: native host tools are enabled.');
    if (this.config.clawhubEnabled) warnings.push('CRITICAL: ClawHub execution is enabled.');
    if (this.config.corneropsOperatorDryRun === false) warnings.push('CRITICAL: operator dry-run mode is disabled.');
    if (this.config.corneropsOperatorReadOnly === false) warnings.push('CRITICAL: operator read-only mode is disabled.');
    if (this.config.corneropsOperatorRequireApproval === false) warnings.push('CRITICAL: operator approvals are disabled.');
    if (this.config.corneropsRequireAuditForOperatorRequests === false) warnings.push('CRITICAL: operator request auditing is disabled.');
    if (this.config.openclawOperatorChannelEnabled) warnings.push('CRITICAL: OpenClaw operator channel is enabled.');
    const forbiddenRealSources = [
      ['Slack context', this.config.slackContextEnabled],
      ['WhatsApp context', this.config.whatsappContextEnabled],
      ['Telegram context', this.config.telegramContextEnabled],
      ['Notion context', this.config.notionContextEnabled],
      ['Google Workspace context', this.config.googleWorkspaceContextEnabled],
      ['local archives', this.config.corneropsLocalArchivesEnabled],
      ['crawlers', this.config.crawlersEnabled],
    ].filter(([, enabled]) => enabled).map(([name]) => name);
    if (forbiddenRealSources.length) {
      warnings.push(`CRITICAL: non-GitHub real sources are enabled: ${forbiddenRealSources.join(', ')}.`);
    }
    return {
      strictMode: this.config.corneropsStrictSecurityMode,
      piiMasking: this.config.corneropsPiiMasking,
      logSanitization: this.config.corneropsLogSanitization,
      failClosed: this.config.corneropsFailClosed,
      requireAuditForTools: this.config.corneropsRequireAuditForTools,
      requireApprovalForWrites: this.config.corneropsRequireApprovalForWrites,
      requireApprovalForExternalActions: this.config.corneropsRequireApprovalForExternalActions,
      databaseReadOnly: this.config.corneropsDbReadOnly !== false,
      databaseWritesBlocked: !this.config.corneropsDbAllowWrites,
      databaseReadsAudited: this.config.corneropsDbAuditReads !== false,
      databasePiiMasking: this.config.corneropsDbPiiMasking !== false,
      externalSendsBlocked: !this.openclawConfig.enabled || this.openclawConfig.dryRun,
      warnings,
    };
  }

  getExternalSources() {
    return [
      { id: 'github', enabled: Boolean(this.config.githubEnabled), mode: this.config.githubReadOnly ? 'read_only' : 'unsafe' },
      { id: 'slack', enabled: Boolean(this.config.slackContextEnabled), mode: 'disabled_required' },
      { id: 'whatsapp', enabled: Boolean(this.config.whatsappContextEnabled), mode: 'disabled_required' },
      { id: 'telegram', enabled: Boolean(this.config.telegramContextEnabled), mode: 'disabled_required' },
      { id: 'notion', enabled: Boolean(this.config.notionContextEnabled), mode: 'disabled_required' },
      { id: 'crawlers', enabled: Boolean(this.config.crawlersEnabled), mode: 'disabled_required' },
      { id: 'native_tools', enabled: [
        this.config.gogcliEnabled,
        this.config.wacliEnabled,
        this.config.goplacesEnabled,
        this.config.clawpdfEnabled,
        this.config.ffmpegWasmEnabled,
        this.config.rastermillEnabled,
      ].some(Boolean), mode: 'disabled_required' },
      { id: 'clawhub_execution', enabled: Boolean(this.config.clawhubEnabled), mode: 'disabled_required' },
    ];
  }

  async getBetaReport() {
    const report = await this.getReport();
    const security = report.security;
    const critical = security.warnings.some((warning) => warning.startsWith('CRITICAL:'));
    const realRequestedButUnavailable = this.config.corneropsBusinessDataEnabled
      && report.businessData.mode !== 'real_read_only';
    const betaStatus = critical
      ? 'unhealthy'
      : realRequestedButUnavailable ? 'degraded' : 'healthy';
    const businessAgents = new Set([
      'daily-briefing-agent',
      'b2b-sales-agent',
      'quotes-orders-agent',
      'security-audit-agent',
    ]);
    return {
      status: betaStatus,
      betaMode: Boolean(
        this.config.corneropsInteractiveBetaEnabled
        || this.config.corneropsInternalBetaEnabled
        || this.config.corneropsBetaMode,
      ),
      businessData: {
        enabled: this.config.corneropsBusinessDataEnabled,
        mode: report.businessData.mode === 'real_read_only' ? 'read_only' : 'mock',
        readOnlyVerified: report.businessData.readOnlyVerified,
        provider: report.businessData.provider,
        mappedEntities: report.businessData.mappedEntities,
        warnings: report.businessData.warnings,
      },
      dataContracts: report.dataContracts.map((mapping) => ({
        entity: mapping.entity,
        confidence: mapping.confidence,
        sourceTable: mapping.sourceTable,
        missingRequiredFields: mapping.missingRequiredFields,
        warnings: mapping.warnings,
      })),
      schemaDiscovery: report.schemaDiscovery,
      github: report.github,
      openclaw: report.openclaw,
      context: { sources: report.contextSources },
      agents: this.agentRegistry.list().map((agent) => ({
        id: agent.id,
        enabled: agent.enabled,
        canUseBusinessData: businessAgents.has(agent.id),
        warnings: businessAgents.has(agent.id) ? [] : ['Business data is outside this agent scope.'],
      })),
      security: {
        failClosed: security.failClosed,
        piiMasking: security.piiMasking && security.databasePiiMasking,
        writesBlocked: security.databaseWritesBlocked,
        externalSendsBlocked: security.externalSendsBlocked,
        warnings: security.warnings,
      },
      audit: report.audit,
      approvals: report.approvals,
      disabledExternalSources: report.disabledExternalSources,
      realSourcesEnabled: report.realSourcesEnabled,
      lastDemoRun: report.lastDemoRun,
      operatorInterface: report.operatorInterface,
      generatedAt: new Date().toISOString(),
    };
  }

  async getApprovalsSummary() {
    const approvals = this.humanApprovalService.list({ limit: 500 });
    return {
      pending: approvals.filter((item) => item.status === 'pending').length,
      approvedLast24h: approvals.filter((item) => item.status === 'approved' && withinLast24Hours(item.updatedAt)).length,
      rejectedLast24h: approvals.filter((item) => item.status === 'rejected' && withinLast24Hours(item.updatedAt)).length,
    };
  }

  async getAuditSummary() {
    const [domainLogs, agentLogs, openclawLogs] = await Promise.all([
      this.auditLogService.list({ limit: 500 }),
      Promise.resolve(this.agentAuditService.list({ limit: 500 })),
      Promise.resolve(this.openclawAuditService.list({ limit: 500 })),
    ]);
    const events = [...domainLogs, ...agentLogs, ...openclawLogs]
      .filter((event) => withinLast24Hours(event.createdAt));
    return {
      eventsLast24h: events.length,
      deniedActionsLast24h: events.filter((event) =>
        event.status === 'denied' || event.policyDecision === 'denied').length,
      errorsLast24h: events.filter((event) => event.status === 'error' || event.errorCode).length,
    };
  }
}

module.exports = {
  ControlTowerService,
  withinLast24Hours,
};
