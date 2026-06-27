const { combineSourceModes, SOURCE_MODES } = require('../real-source/sourceMode');

class ControlTowerV11ReportService {
  constructor({
    baseService,
    businessDataReadinessService,
    githubReadinessService,
    config = {},
  } = {}) {
    this.baseService = baseService;
    this.businessDataReadinessService = businessDataReadinessService;
    this.githubReadinessService = githubReadinessService;
    this.config = config;
  }

  async getReport() {
    const [base, github, businessData] = await Promise.all([
      this.baseService.getReport(),
      this.githubReadinessService.check({ testReads: false }),
      this.businessDataReadinessService.check({ testReads: false }),
    ]);
    const sourceMode = combineSourceModes([
      github.mode,
      businessData.mode,
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
          'b2b-sales-agent': businessData.mode,
          'quotes-orders-agent': businessData.mode,
        },
        blockedWriteFlags,
        warnings: [...new Set(warnings)],
      },
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
