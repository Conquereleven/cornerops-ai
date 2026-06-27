const { sanitizeAuditPayload } = require('../security/SecuritySanitizer');

const HIGH_RISK_TERMS = ['delete', 'deploy', 'merge', 'paid', 'payment', 'send', 'status', 'write'];

const riskLevelFor = (approval = {}) => {
  const value = `${approval.actionType || ''} ${approval.toolName || ''} ${approval.impact || ''}`.toLowerCase();
  if (HIGH_RISK_TERMS.some((term) => value.includes(term))) return 'high';
  return approval.actionType ? 'medium' : 'low';
};

const dataTouchedFor = (approval = {}) => {
  const payload = approval.payloadSummary;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];
  return Object.keys(payload).filter((key) => !['message', 'text', 'content'].includes(key)).slice(0, 12);
};

class ApprovalCenterService {
  constructor({ approvalService, auditLogService, config } = {}) {
    this.approvalService = approvalService;
    this.auditLogService = auditLogService;
    this.config = config;
  }

  normalize(approval) {
    return sanitizeAuditPayload({
      id: approval.id,
      status: approval.status,
      requestedAction: approval.actionType || approval.toolName || 'unknown',
      requestedByAgent: approval.createdBy || 'unknown',
      riskLevel: approval.riskLevel || riskLevelFor(approval),
      dataTouched: dataTouchedFor(approval),
      sourceMode: approval.requestedDryRun === false ? 'approval_required' : (approval.payloadSummary?.sourceMode || 'dry_run'),
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      approvalRequiredReason: approval.reason || 'Required by CornerOps policy.',
      executionStatus: approval.executionStatus || approval.status,
      executable: approval.status === 'approved'
        && (approval.executionStatus || approval.status) === 'approved'
        && String(approval.actionType || '').includes('.')
        && Boolean(approval.actionPayload && approval.payloadChecksum),
      dryRun: approval.requestedDryRun !== false,
      realExecutionAllowed: Boolean(
        approval.requestedDryRun === false
        && this.config.corneropsControlledActionsEnabled
        && !this.config.corneropsControlledActionsDryRun
      ),
    });
  }

  async list({ limit = 100, status } = {}) {
    if (!this.config.corneropsApprovalCenterEnabled) {
      return { enabled: false, dryRun: true, realExecutionAllowed: false, summary: {}, items: [] };
    }
    const approvals = await this.approvalService.listApprovals({ limit, status });
    const items = approvals.map((approval) => this.normalize(approval));
    return {
      enabled: true,
      dryRun: this.config.corneropsApprovalCenterDryRun,
      realExecutionAllowed: Boolean(
        this.config.corneropsControlledActionsEnabled
        && !this.config.corneropsControlledActionsDryRun
      ),
      summary: {
        total: items.length,
        pending: items.filter((item) => item.status === 'pending').length,
        approved: items.filter((item) => item.status === 'approved').length,
        rejected: items.filter((item) => item.status === 'rejected').length,
        controlledPending: items.filter((item) => item.status === 'pending' && item.requestedAction.includes('.')).length,
        dryRunExecuted: items.filter((item) => item.executionStatus === 'dry_run_executed').length,
        realExecuted: items.filter((item) => item.executionStatus === 'executed').length,
        executionFailed: items.filter((item) => item.executionStatus === 'execution_failed').length,
        highRiskPending: items.filter((item) => item.status === 'pending' && item.riskLevel === 'high').length,
      },
      items,
    };
  }

  async decideDryRun(id, decision, actor = 'web-console-operator') {
    if (!this.config.corneropsApprovalCenterEnabled) {
      const error = new Error('Approval Center is disabled.');
      error.statusCode = 404;
      throw error;
    }
    if (
      !this.config.corneropsApprovalCenterDryRun
      || this.config.corneropsApprovalCenterAllowRealExecution
      || !this.config.corneropsWebConsoleDryRun
      || !this.config.corneropsWebConsoleReadOnly
    ) {
      const error = new Error('Approval Center safety configuration is invalid.');
      error.statusCode = 503;
      throw error;
    }
    const existing = await this.approvalService.getApproval(id);
    if (!existing) {
      const error = new Error('Approval not found.');
      error.statusCode = 404;
      throw error;
    }
    const approval = decision === 'approve'
      ? await this.approvalService.approveApproval(id, actor)
      : await this.approvalService.rejectApproval(id, actor);
    const audit = await this.auditLogService.record({
      eventType: `approval_${decision}_dry_run`,
      operation: decision,
      entityType: 'approval',
      entityId: id,
      userId: actor,
      channel: 'web',
      policyDecision: 'dry_run',
      status: 'success',
      input: { approvalId: id },
      output: { status: approval.status, realExecution: false },
    });
    return {
      approval: this.normalize(approval),
      auditId: audit?.id,
      executed: false,
      message: 'Approval status updated in dry-run. No underlying action was executed.',
    };
  }
}

module.exports = { ApprovalCenterService, dataTouchedFor, riskLevelFor };
