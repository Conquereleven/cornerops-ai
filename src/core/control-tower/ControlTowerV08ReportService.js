class ControlTowerV08ReportService {
  constructor({ approvalCenterService, auditViewerService, baseService, config } = {}) {
    this.approvalCenterService = approvalCenterService;
    this.auditViewerService = auditViewerService;
    this.baseService = baseService;
    this.config = config;
  }

  async getReport() {
    const [base, approvalCenter, auditViewer] = await Promise.all([
      this.baseService.getReport(),
      this.approvalCenterService.list({ limit: 100 }),
      this.auditViewerService.getEvents({ limit: this.config.corneropsAuditViewerMaxEvents }),
    ]);
    const agents = this.baseService.agentRegistry.list().map((agent) => ({
      id: agent.id,
      name: agent.name,
      enabled: agent.enabled,
      status: agent.enabled ? 'ready' : 'disabled',
      permissionLevel: agent.permissionLevel,
      allowedTools: agent.allowedTools,
      warnings: agent.enabled ? [] : ['Agent is disabled by configuration.'],
    }));
    const nativeToolsEnabled = [
      this.config.gogcliEnabled,
      this.config.wacliEnabled,
      this.config.goplacesEnabled,
      this.config.clawpdfEnabled,
      this.config.ffmpegWasmEnabled,
      this.config.rastermillEnabled,
    ].some(Boolean);
    const customerChannelsEnabled = [
      Boolean(this.config.whatsappAccessToken),
      this.config.whatsappContextEnabled,
      this.config.slackContextEnabled,
      this.config.telegramContextEnabled,
    ].some(Boolean);
    const externalSendsBlocked = Boolean(
      base.security.externalSendsBlocked
      && (
        !this.config.corneropsTelegramRealMode
        || this.config.corneropsTelegramDryRun
        || this.config.telegramOperatorDryRun
        || this.config.telegramOperatorReplyDryRun
      )
      && (
        !this.config.corneropsRealOperatorChannelEnabled
        || this.config.corneropsOperatorChannelDryRun
        || this.config.corneropsOperatorReplyDryRun
      )
      && (!this.config.slackOperatorEnabled || this.config.slackOperatorDryRun)
    );
    const writesBlocked = Boolean(
      base.security.databaseWritesBlocked
      && !this.config.corneropsApprovalCenterAllowRealExecution
      && !this.config.githubAllowIssueCreation
      && !this.config.githubAllowPrWrite
      && !this.config.githubAllowWorkflowTrigger
    );
    const safetyWarnings = [...base.security.warnings];
    if (this.config.corneropsWebConsoleEnabled && !this.config.corneropsWebConsoleAuthToken) {
      safetyWarnings.push('CRITICAL: web console auth token is missing.');
    }
    if (!this.config.corneropsWebConsoleLocalOnly) safetyWarnings.push('CRITICAL: web console is not local-only.');
    if (!this.config.corneropsWebConsoleReadOnly) safetyWarnings.push('CRITICAL: web console is not read-only.');
    if (!this.config.corneropsWebConsoleDryRun) safetyWarnings.push('CRITICAL: web console dry-run is disabled.');
    if (this.config.corneropsApprovalCenterAllowRealExecution) {
      safetyWarnings.push('CRITICAL: Approval Center real execution is enabled.');
    }
    if (!externalSendsBlocked) safetyWarnings.push('CRITICAL: one or more external-send paths are enabled.');
    if (!writesBlocked) safetyWarnings.push('CRITICAL: one or more write paths are enabled.');
    const safety = {
      failClosed: base.security.failClosed,
      dryRun: this.config.corneropsWebConsoleDryRun && base.dryRun,
      readOnly: this.config.corneropsWebConsoleReadOnly && base.security.databaseReadOnly,
      writesBlocked,
      externalSendsBlocked,
      piiMasking: base.security.piiMasking && this.config.corneropsAuditViewerMaskPii,
      logSanitization: base.security.logSanitization,
      whatsappDisabled: !this.config.whatsappContextEnabled && !this.config.whatsappAccessToken,
      customerChannelsDisabled: !customerChannelsEnabled,
      nativeToolsDisabled: !nativeToolsEnabled,
      clawhubExecutionDisabled: !this.config.clawhubEnabled,
      approvalRealExecutionBlocked: !this.config.corneropsApprovalCenterAllowRealExecution,
      warnings: safetyWarnings,
    };
    const telegram = base.telegram;
    const operatorChannel = {
      provider: 'telegram',
      enabled: telegram.enabled,
      realMode: telegram.realMode,
      dryRun: telegram.dryRun,
      replyEnabled: telegram.replyEnabled,
      allowedUsersCount: telegram.allowedUsersCount,
      allowedChatsCount: telegram.allowedChatsCount,
      replayProtectionHealthy: Boolean(telegram.replayProtection?.storeHealthy),
      rejectionTrackingHealthy: Boolean(telegram.rejectionTracking?.storeHealthy),
      rateLimitingHealthy: Boolean(telegram.rateLimiting?.storeHealthy),
      rejectedLast24h: telegram.rejectionTracking?.rejectedLast24h || 0,
      lastInboundAt: base.operatorChannel?.lastInboundAt,
      lastOutboundAt: base.operatorChannel?.lastOutboundAt,
      warnings: telegram.warnings || [],
    };
    const status = safetyWarnings.some((warning) => warning.startsWith('CRITICAL:'))
      ? 'unhealthy'
      : base.status === 'healthy' ? 'healthy' : 'degraded';
    const sourceMode = ['read_only', 'real_read_only'].includes(base.firstRealSource.mode)
      ? 'real_read_only'
      : base.firstRealSource.mode === 'mock' ? 'mock' : base.mode;
    return {
      status,
      mode: sourceMode,
      generatedAt: new Date().toISOString(),
      environment: this.config.nodeEnv,
      safety,
      webConsole: {
        enabled: this.config.corneropsWebConsoleEnabled,
        mode: this.config.corneropsWebConsoleMode,
        localOnly: this.config.corneropsWebConsoleLocalOnly,
        authRequired: this.config.corneropsWebConsoleRequireAuth,
        authConfigured: Boolean(this.config.corneropsWebConsoleAuthToken),
        readOnly: this.config.corneropsWebConsoleReadOnly,
        dryRun: this.config.corneropsWebConsoleDryRun,
        refreshSeconds: this.config.corneropsControlTowerWebRefreshSeconds,
      },
      operatorChannel,
      firstRealSource: base.firstRealSource,
      agents,
      agentSummary: base.agents,
      approvals: {
        ...approvalCenter.summary,
        dryRun: approvalCenter.dryRun,
        realExecutionAllowed: false,
      },
      audit: {
        ...auditViewer.summary,
        latest: auditViewer.events,
      },
      dataSources: base.dataSources,
      businessData: base.businessData,
      contextSources: base.contextSources,
      ecosystemServices: base.ecosystemServices,
      github: base.github,
      openclaw: base.openclaw,
      security: {
        ...base.security,
        ...safety,
        dashboardEnabled: this.config.corneropsSecurityDashboardEnabled,
        dashboardMaskPii: this.config.corneropsSecurityDashboardMaskPii,
      },
      demoMode: base.demoMode,
      betaMode: Boolean(
        this.config.corneropsBetaMode
        || this.config.corneropsInternalBetaEnabled
        || this.config.corneropsInteractiveBetaEnabled,
      ),
    };
  }
}

module.exports = { ControlTowerV08ReportService };
