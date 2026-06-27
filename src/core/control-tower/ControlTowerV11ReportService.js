const { combineSourceModes, SOURCE_MODES } = require('../real-source/sourceMode');

class ControlTowerV11ReportService {
  constructor({
    baseService,
    businessDataReadinessService,
    cornerMexConfigIntakeService,
    cornerMexConnector,
    githubReadinessService,
    config = {},
  } = {}) {
    this.baseService = baseService;
    this.businessDataReadinessService = businessDataReadinessService;
    this.cornerMexConfigIntakeService = cornerMexConfigIntakeService;
    this.cornerMexConnector = cornerMexConnector;
    this.githubReadinessService = githubReadinessService;
    this.config = config;
  }

  async getReport() {
    const [base, github, businessData, cornerMexLovableConnector, cornerMexConfigIntake] = await Promise.all([
      this.baseService.getReport(),
      this.githubReadinessService.check({ testReads: false }),
      this.businessDataReadinessService.check({ testReads: false }),
      this.cornerMexConnector?.getConnectorStatus
        ? this.cornerMexConnector.getConnectorStatus({ agentId: 'control-tower-v1.1.1' })
        : Promise.resolve(null),
      this.cornerMexConfigIntakeService?.check
        ? this.cornerMexConfigIntakeService.check({ agentId: 'control-tower-v1.1.2' })
        : Promise.resolve(null),
    ]);
    const sourceMode = combineSourceModes([
      github.mode,
      businessData.mode,
      cornerMexLovableConnector?.sourceMode,
      base.openclaw?.enabled ? base.openclaw?.mode : SOURCE_MODES.DISABLED,
      SOURCE_MODES.LOCAL_INTERNAL,
      this.config.corneropsDryRun ? SOURCE_MODES.DRY_RUN : null,
    ]);
    const blockedWriteFlags = {
      githubIssueCreation: !this.config.githubAllowIssueCreation,
      githubPrWrite: !this.config.githubAllowPrWrite,
      githubWorkflowTrigger: !this.config.githubAllowWorkflowTrigger,
      businessDbWrites: !this.config.corneropsDbAllowWrites,
      controlledActionsRealExecution: this.config.corneropsControlledActionsDryRun !== false,
      externalSends: base.safety?.externalSendsBlocked === true,
      whatsapp: base.safety?.whatsappDisabled === true,
      nativeTools: base.safety?.nativeToolsDisabled === true,
      clawhubExecution: base.safety?.clawhubExecutionDisabled === true,
    };
    const warnings = [
      ...(base.safety?.warnings || []),
      ...github.warnings,
      ...businessData.warnings,
      ...(cornerMexLovableConnector?.warnings || []),
      ...(cornerMexConfigIntake?.warnings || []),
    ];
    return {
      ...base,
      version: 'v1.1',
      generatedAt: new Date().toISOString(),
      realSourceExpansion: {
        version: 'v1.1',
        selectedSource: github.connected ? 'github' : businessData.mode === SOURCE_MODES.REAL_READ_ONLY ? 'business_db' : 'mock',
        selectedSourceMode: github.connected ? SOURCE_MODES.REAL_READ_ONLY : businessData.mode,
        sourceModeSummary: sourceMode,
        github,
        businessData,
        agentUsage: {
          'dev-codex-github-agent': github.connected ? SOURCE_MODES.REAL_READ_ONLY : SOURCE_MODES.MOCK,
          'daily-briefing-agent': combineSourceModes([github.mode, businessData.mode]),
          'security-audit-agent': combineSourceModes([github.mode, businessData.mode, SOURCE_MODES.LOCAL_INTERNAL]),
          'b2b-sales-agent': combineSourceModes([businessData.mode, cornerMexLovableConnector?.sourceMode]),
          'quotes-orders-agent': combineSourceModes([businessData.mode, cornerMexLovableConnector?.sourceMode]),
          'daily-briefing-agent-cornermex': cornerMexLovableConnector?.sourceMode || SOURCE_MODES.MOCK,
        },
        blockedWriteFlags,
        warnings: [...new Set(warnings)],
      },
      cornerMexLovableConnector: cornerMexLovableConnector ? {
        ...cornerMexLovableConnector,
        version: 'v1.1.2',
        configIntake: cornerMexConfigIntake,
        configIntakeStatus: cornerMexConfigIntake?.status || 'unknown',
        configCompleteness: cornerMexConfigIntake?.configCompleteness || {},
        discoveredWriteRiskPaths: cornerMexConfigIntake?.repoDiscovery?.writeRiskPaths || [],
        missingFounderConfig: cornerMexConfigIntake?.missing || [],
        exactNextRecommendedAction: cornerMexConfigIntake?.founderNextSteps?.[0] || cornerMexLovableConnector.founderNextSteps?.[0],
      } : null,
      github: {
        ...base.github,
        ...github,
      },
      businessData: {
        ...base.businessData,
        readiness: businessData,
        mode: businessData.mode,
      },
      safety: {
        ...base.safety,
        warnings: [...new Set(warnings)],
      },
    };
  }
}

module.exports = { ControlTowerV11ReportService };
