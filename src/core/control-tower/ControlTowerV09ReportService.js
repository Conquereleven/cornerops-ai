class ControlTowerV09ReportService {
  constructor({ approvalCenterService, baseService, controlledActionExecutor, config } = {}) {
    this.approvalCenterService = approvalCenterService;
    this.baseService = baseService;
    this.controlledActionExecutor = controlledActionExecutor;
    this.config = config;
  }

  async getReport() {
    const [base, approvals] = await Promise.all([
      this.baseService.getReport(),
      this.approvalCenterService.list({ limit: 100 }),
    ]);
    const controlledActions = this.controlledActionExecutor.status();
    const pending = approvals.items.filter((item) =>
      item.status === 'pending' && item.requestedAction.includes('.'));
    const warnings = [...(base.safety?.warnings || [])];
    if (controlledActions.enabled && !this.config.corneropsControlledActionsFailClosed) {
      warnings.push('CRITICAL: controlled actions require fail-closed mode.');
    }
    if (controlledActions.enabled && !this.config.corneropsControlledActionsRequireApproval) {
      warnings.push('CRITICAL: controlled actions require human approval.');
    }
    if (!controlledActions.idempotency.healthy) {
      warnings.push('CRITICAL: controlled-action idempotency storage is unavailable.');
    }
    return {
      ...base,
      version: 'v0.9',
      generatedAt: new Date().toISOString(),
      controlledActions: {
        ...controlledActions,
        pendingApprovals: pending.length,
        githubIssueCreationEnabled: Boolean(
          this.config.corneropsActionGithubIssueCreateEnabled
          && this.config.githubAllowIssueCreation,
        ),
        internalNoteCreationEnabled: Boolean(this.config.corneropsActionInternalNoteCreateEnabled),
        internalTaskCreationEnabled: Boolean(this.config.corneropsActionInternalTaskCreateEnabled),
        localInternalWritesEnabled: Boolean(this.config.corneropsAllowLocalInternalWrites),
      },
      approvals: {
        ...base.approvals,
        ...approvals.summary,
      },
      safety: {
        ...base.safety,
        controlledActionsFailClosed: this.config.corneropsControlledActionsFailClosed !== false,
        controlledActionsRealExecutionBlocked: !controlledActions.realExecutionAllowed,
        paymentOrderLeadQuoteMutationsBlocked: true,
        warnings,
      },
    };
  }
}

module.exports = { ControlTowerV09ReportService };
