const {
  APPROVAL_EXECUTION_STATUS,
  createActionError,
  payloadChecksum,
} = require('./actionTypes');

class ControlledActionExecutor {
  constructor({
    approvalService,
    auditLogService,
    config = {},
    handlers = new Map(),
    idempotencyService,
    policy,
    registry,
  } = {}) {
    this.approvalService = approvalService;
    this.auditLogService = auditLogService;
    this.config = config;
    this.handlers = handlers;
    this.idempotencyService = idempotencyService;
    this.policy = policy;
    this.registry = registry;
  }

  getHandler(actionId) {
    const handler = this.handlers.get(actionId);
    if (!handler) throw createActionError('Controlled action handler is unavailable.', 'CONTROLLED_ACTION_HANDLER_MISSING', 503);
    return handler;
  }

  async createDraft(actionId, payload, context = {}) {
    const action = this.registry.require(actionId);
    const policy = this.policy.evaluate({
      action,
      agentId: context.agentId,
      auditAvailable: this.auditAvailable(),
      channel: context.channel,
      dryRun: true,
      operatorId: context.operatorId,
    });
    this.assertAllowed(policy);
    const draft = await this.getHandler(actionId).createDraft(payload);
    const audit = this.audit('controlled_action_draft_created', action, context, policy, {
      status: 'draft',
      payloadFields: Object.keys(draft.payload || {}),
    });
    this.assertAudit(audit);
    return { action, ...draft, auditId: audit.id };
  }

  async requestApproval(actionId, payload, context = {}) {
    const action = this.registry.require(actionId);
    const policy = this.policy.evaluate({
      action,
      agentId: context.agentId,
      auditAvailable: this.auditAvailable(),
      channel: context.channel,
      dryRun: true,
      operatorId: context.operatorId,
    });
    this.assertAllowed(policy);
    const draft = await this.getHandler(actionId).createDraft(payload);
    const checksum = payloadChecksum(draft.payload);
    const audit = this.audit('controlled_action_approval_requested', action, context, policy, {
      status: 'pending',
      payloadChecksum: checksum,
    });
    this.assertAudit(audit);
    const approval = await this.approvalService.requestApproval({
      actionType: action.id,
      actionPayload: draft.payload,
      channel: context.channel || 'internal',
      conversationId: context.conversationId,
      createdBy: context.agentId,
      impact: action.externalSideEffect
        ? 'External GitHub issue creation; rollback requires deleting the created issue.'
        : 'Local internal CornerOps persistence only; no business database impact.',
      payload: {
        actionId: action.id,
        payloadChecksum: checksum,
        fields: Object.keys(draft.payload || {}),
        sourceMode: 'local_internal',
      },
      payloadChecksum: checksum,
      reason: 'Controlled action requires explicit operator approval.',
      requestId: context.requestId,
      requestedDryRun: context.requestedDryRun !== false,
      riskLevel: action.riskLevel,
      toolName: action.id,
    });
    return {
      actionId,
      approvalId: approval.id,
      status: 'pending',
      executionStatus: approval.executionStatus,
      dryRun: approval.requestedDryRun,
      auditId: audit.id,
      payloadChecksum: checksum,
    };
  }

  async executeApproval(approvalId, { dryRun = true, operatorId, requestId } = {}) {
    const approval = await this.approvalService.getApproval(approvalId);
    if (!approval) throw createActionError('Approval not found.', 'CONTROLLED_ACTION_APPROVAL_NOT_FOUND', 404);
    if (!approval.actionPayload || !approval.payloadChecksum) {
      throw createActionError('Approval does not contain an immutable action payload.', 'CONTROLLED_ACTION_APPROVAL_PAYLOAD_MISSING', 409);
    }
    const checksum = payloadChecksum(approval.actionPayload);
    if (checksum !== approval.payloadChecksum) {
      this.audit('controlled_action_checksum_mismatch', { id: approval.actionType }, {
        operatorId,
        requestId: requestId || approval.requestId,
        approvalId,
        channel: approval.channel,
      }, { decision: 'denied' }, { status: 'denied' });
      throw createActionError('Approval payload checksum mismatch.', 'CONTROLLED_ACTION_CHECKSUM_MISMATCH', 409);
    }

    const action = this.registry.require(approval.actionType);
    const context = {
      agentId: approval.createdBy,
      approvalId,
      channel: approval.channel || 'internal',
      operatorId,
      requestId: requestId || approval.requestId,
    };
    const idempotencyInput = {
      actionId: action.id,
      payload: approval.actionPayload,
      sourceRequestId: approval.requestId,
      approvalId,
      operatorId,
    };
    const executionStatus = approval.executionStatus || approval.status;
    if (approval.status === 'approved' && [
      APPROVAL_EXECUTION_STATUS.EXECUTED,
      APPROVAL_EXECUTION_STATUS.DRY_RUN_EXECUTED,
    ].includes(executionStatus)) {
      const existing = this.idempotencyService.find(idempotencyInput);
      if (existing) {
        const duplicateAudit = this.audit('controlled_action_duplicate_prevented', action, context, {
          decision: 'denied',
        }, { status: 'duplicate', idempotencyKey: existing.key });
        this.assertAudit(duplicateAudit);
        return {
          approvalId,
          actionId: action.id,
          status: existing.status,
          dryRun,
          auditId: duplicateAudit.id,
          duplicate: true,
          warnings: ['Already executed approval was not executed twice.'],
        };
      }
    }
    if (approval.status !== 'approved' || executionStatus !== APPROVAL_EXECUTION_STATUS.APPROVED) {
      throw createActionError('Approval is not executable.', 'CONTROLLED_ACTION_APPROVAL_NOT_EXECUTABLE', 409);
    }
    const policy = this.policy.evaluate({
      action,
      agentId: context.agentId,
      approval,
      auditAvailable: this.auditAvailable(),
      channel: context.channel,
      dryRun,
      operatorId,
    });
    this.assertAllowed(policy);

    const startedAudit = this.audit('controlled_action_execution_started', action, context, policy, {
      status: 'executing', dryRun,
    });
    this.assertAudit(startedAudit);
    const reservation = this.idempotencyService.begin(idempotencyInput, {
      failClosed: action.externalSideEffect || this.config.corneropsControlledActionsFailClosed,
    });
    if (reservation.duplicate) {
      const duplicateAudit = this.audit('controlled_action_duplicate_prevented', action, context, {
        decision: 'denied',
      }, { status: 'duplicate', idempotencyKey: reservation.record.key });
      this.assertAudit(duplicateAudit);
      return {
        approvalId,
        actionId: action.id,
        status: reservation.record.status,
        dryRun,
        auditId: duplicateAudit.id,
        duplicate: true,
        warnings: ['Duplicate execution was prevented by idempotency policy.'],
      };
    }

    await this.approvalService.transitionExecution(
      approvalId,
      APPROVAL_EXECUTION_STATUS.EXECUTING,
      operatorId,
      { dryRun, auditId: startedAudit.id },
    );
    try {
      const result = await this.getHandler(action.id).execute(approval.actionPayload, {
        actor: operatorId,
        auditId: startedAudit.id,
        dryRun,
      });
      const status = dryRun
        ? APPROVAL_EXECUTION_STATUS.DRY_RUN_EXECUTED
        : APPROVAL_EXECUTION_STATUS.EXECUTED;
      await this.approvalService.transitionExecution(approvalId, status, operatorId, {
        dryRun,
        externalResourceId: result.externalResourceId,
        resourceId: result.resource?.id,
      });
      this.idempotencyService.complete(reservation.record.key, status, result);
      const audit = this.audit('controlled_action_execution_completed', action, context, policy, {
        status,
        dryRun,
        externalResourceId: result.externalResourceId,
        resourceId: result.resource?.id,
      });
      this.assertAudit(audit);
      return {
        approvalId,
        actionId: action.id,
        status,
        dryRun,
        externalResourceId: result.externalResourceId,
        externalUrl: result.externalUrl,
        resource: result.resource,
        auditId: audit.id,
        warnings: dryRun ? ['No real side effect was executed.'] : [],
      };
    } catch (error) {
      const latest = await this.approvalService.getApproval(approvalId);
      if ((latest?.executionStatus || latest?.status) === APPROVAL_EXECUTION_STATUS.EXECUTING) {
        await this.approvalService.transitionExecution(
          approvalId,
          APPROVAL_EXECUTION_STATUS.EXECUTION_FAILED,
          operatorId,
          { errorCode: error.code || 'CONTROLLED_ACTION_EXECUTION_FAILED' },
        );
        this.idempotencyService.complete(reservation.record.key, APPROVAL_EXECUTION_STATUS.EXECUTION_FAILED, {
          status: 'execution_failed',
        });
      }
      this.audit('controlled_action_execution_failed', action, context, { decision: 'denied' }, {
        status: 'execution_failed', errorCode: error.code,
      });
      throw error;
    }
  }

  status() {
    const actions = this.registry.list();
    const idempotency = this.idempotencyService.health();
    const records = this.idempotencyService.list({ limit: 500 });
    return {
      enabled: Boolean(this.config.corneropsControlledActionsEnabled),
      dryRun: this.config.corneropsControlledActionsDryRun !== false,
      requireApproval: this.config.corneropsControlledActionsRequireApproval !== false,
      realExecutionAllowed: Boolean(
        this.config.corneropsControlledActionsEnabled
        && !this.config.corneropsControlledActionsDryRun,
      ),
      actions,
      idempotency,
      executions: {
        dryRun: records.filter((item) => item.status === 'dry_run_executed').length,
        real: records.filter((item) => item.status === 'executed').length,
        blocked: records.filter((item) => item.status === 'execution_failed').length,
        last: records[0] || null,
      },
    };
  }

  audit(eventType, action, context = {}, policy = {}, output = {}) {
    return this.auditLogService?.record({
      requestId: context.requestId,
      userId: context.operatorId || context.agentId,
      channel: context.channel,
      actionType: eventType,
      toolName: action.id,
      policyDecision: policy.decision || 'denied',
      status: output.status,
      approvalId: context.approvalId,
      input: { controlledActionId: action.id },
      output,
    });
  }

  auditAvailable() {
    return Boolean(this.auditLogService?.record && this.auditLogService.enabled !== false);
  }

  assertAudit(audit) {
    if (!audit) throw createActionError('Audit record is required before controlled action execution.', 'CONTROLLED_ACTION_AUDIT_REQUIRED', 503);
  }

  assertAllowed(policy) {
    if (!policy?.allowed) throw createActionError(policy?.reason || 'Controlled action denied.', policy?.code || 'CONTROLLED_ACTION_DENIED', 403);
  }
}

module.exports = { ControlledActionExecutor };
