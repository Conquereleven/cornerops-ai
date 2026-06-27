const { randomUUID } = require('crypto');
const { APPROVAL_EXECUTION_STATUS, APPROVAL_STATUS } = require('./types');
const { sanitizeAuditPayload, sanitizePersistencePayload } = require('../../core/security/SecuritySanitizer');
const { InMemoryStore } = require('../../core/persistence/InMemoryStore');

const initialData = { version: 1, records: [] };

class HumanApprovalService {
  constructor({ auditLogService, store = new InMemoryStore({ initialData }) } = {}) {
    this.auditLogService = auditLogService;
    this.store = store;
  }

  createApproval({
    actionType,
    channel,
    conversationId,
    createdBy,
    impact,
    payload,
    actionPayload,
    payloadChecksum,
    reason,
    requestId,
    requestedDryRun = true,
    riskLevel,
    toolName,
  }) {
    const approval = {
      id: `approval-${randomUUID().slice(0, 12)}`,
      requestId: requestId || `request-${randomUUID().slice(0, 12)}`,
      actionType,
      toolName,
      channel,
      conversationId,
      createdBy,
      reason,
      impact,
      payloadSummary: sanitizeAuditPayload(payload || {}),
      actionPayload: actionPayload ? sanitizePersistencePayload(actionPayload) : undefined,
      payloadChecksum,
      riskLevel,
      requestedDryRun: Boolean(requestedDryRun),
      status: APPROVAL_STATUS.PENDING,
      executionStatus: APPROVAL_EXECUTION_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.transact((current) => ({
      data: {
        version: 1,
        records: [approval, ...(Array.isArray(current.records) ? current.records : [])].slice(0, 500),
      },
      result: approval,
    }));
    this.auditTransition(approval, 'approval_requested', createdBy);
    return { ...approval };
  }

  getApproval(id) {
    const approval = this.store.initialize().records.find((item) => item.id === id);
    return approval ? { ...approval } : null;
  }

  list({ status, limit = 100 } = {}) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    return this.store.initialize().records
      .filter((approval) => !status || approval.status === status)
      .slice(0, safeLimit)
      .map((approval) => ({ ...approval }));
  }

  approve(id, approver = 'operator') {
    return this.updateStatus(id, APPROVAL_STATUS.APPROVED, approver);
  }

  reject(id, approver = 'operator') {
    return this.updateStatus(id, APPROVAL_STATUS.REJECTED, approver);
  }

  expire(id, actor = 'system') {
    return this.updateStatus(id, APPROVAL_STATUS.EXPIRED, actor);
  }

  updateStatus(id, status, actor) {
    if (![APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED, APPROVAL_STATUS.EXPIRED].includes(status)) {
      return null;
    }
    const updated = this.store.transact((current) => {
      const records = Array.isArray(current.records) ? current.records : [];
      const index = records.findIndex((item) => item.id === id);
      if (index === -1) return { data: current, result: null };
      if (records[index].status !== APPROVAL_STATUS.PENDING) {
        const error = new Error('Approval is already resolved.');
        error.statusCode = 409;
        throw error;
      }
      records[index] = {
        ...records[index],
        status,
        executionStatus: status,
        resolvedBy: actor,
        updatedAt: new Date().toISOString(),
      };
      return { data: { version: 1, records }, result: records[index] };
    });
    this.auditTransition(updated, `approval_${status}`, actor);
    return updated;
  }

  transitionExecution(id, nextStatus, actor = 'operator', details = {}) {
    const allowed = {
      [APPROVAL_EXECUTION_STATUS.APPROVED]: [APPROVAL_EXECUTION_STATUS.EXECUTING],
      [APPROVAL_EXECUTION_STATUS.EXECUTING]: [
        APPROVAL_EXECUTION_STATUS.EXECUTED,
        APPROVAL_EXECUTION_STATUS.DRY_RUN_EXECUTED,
        APPROVAL_EXECUTION_STATUS.EXECUTION_FAILED,
      ],
    };
    const updated = this.store.transact((current) => {
      const records = Array.isArray(current.records) ? current.records : [];
      const index = records.findIndex((item) => item.id === id);
      if (index === -1) return { data: current, result: null };
      const currentStatus = records[index].executionStatus || records[index].status;
      if (!allowed[currentStatus]?.includes(nextStatus)) {
        const error = new Error(`Approval execution transition ${currentStatus} -> ${nextStatus} is not allowed.`);
        error.code = 'APPROVAL_EXECUTION_TRANSITION_DENIED';
        error.statusCode = 409;
        throw error;
      }
      records[index] = {
        ...records[index],
        executionStatus: nextStatus,
        executionActor: actor,
        executionResult: sanitizeAuditPayload(details),
        updatedAt: new Date().toISOString(),
      };
      return { data: { version: 1, records }, result: records[index] };
    });
    if (updated) this.auditTransition(updated, `approval_${nextStatus}`, actor);
    return updated;
  }

  isApproved(id) {
    const approval = this.getApproval(id);
    return Boolean(approval && approval.status === APPROVAL_STATUS.APPROVED);
  }

  auditTransition(approval, actionType, actor) {
    return this.auditLogService?.record({
      requestId: approval.requestId,
      userId: actor || approval.createdBy,
      channel: approval.channel,
      conversationId: approval.conversationId,
      actionType,
      toolName: approval.toolName,
      policyDecision: approval.status === 'rejected' ? 'denied' : 'approval_required',
      status: approval.executionStatus || approval.status,
      approvalId: approval.id,
      input: { actionType: approval.actionType, riskLevel: approval.riskLevel },
      output: { status: approval.status, executionStatus: approval.executionStatus },
    });
  }

  clearForTests() {
    this.store.clear();
  }
}

module.exports = {
  HumanApprovalService,
};
