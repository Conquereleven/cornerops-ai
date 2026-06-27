class ControlTowerV10ReportService {
  constructor({ backupService, baseService, setupValidator } = {}) {
    this.backupService = backupService;
    this.baseService = baseService;
    this.setupValidator = setupValidator;
  }

  async getReport() {
    const base = await this.baseService.getReport();
    const setup = this.setupValidator.run();
    const backup = this.backupService.getLatestBackupSummary();
    const warnings = [
      ...(base.safety?.warnings || []),
      ...setup.checks
        .filter((check) => check.status === 'blocked')
        .map((check) => `Founder setup blocked: ${check.label}.`),
      ...backup.warnings,
    ];
    const founderBetaReadiness = {
      version: 'v1.0',
      ready: setup.status !== 'blocked' && warnings.filter((warning) => warning.startsWith('CRITICAL:')).length === 0,
      setupStatus: setup.status,
      setupCounts: setup.counts,
      localEnvStatus: setup.checks.find((check) => check.id === 'env-file')?.status || 'warning',
      persistenceStatus: setup.checks.find((check) => check.id === 'persistence-root')?.status || 'warning',
      backupStatus: backup.exists ? 'ok' : 'warning',
      authLocalOnlyStatus: base.webConsole?.authConfigured && base.webConsole?.localOnly ? 'ok' : 'blocked',
      controlledActionsStatus: base.controlledActions?.dryRun ? 'dry_run' : 'blocked',
      githubIssueRealCreationStatus: base.controlledActions?.githubIssueCreationEnabled ? 'enabled' : 'disabled',
      telegramRealModeStatus: base.operatorChannel?.realMode ? 'enabled' : 'disabled',
      externalSendsStatus: base.safety?.externalSendsBlocked ? 'blocked' : 'enabled',
      writesStatus: base.safety?.writesBlocked ? 'blocked' : 'enabled',
      lastDailyRun: null,
      lastBackup: backup.latestAt,
      warnings,
    };
    return {
      ...base,
      version: 'v1.0',
      generatedAt: new Date().toISOString(),
      founderBetaReadiness,
      safety: {
        ...base.safety,
        warnings,
      },
    };
  }
}

module.exports = { ControlTowerV10ReportService };
