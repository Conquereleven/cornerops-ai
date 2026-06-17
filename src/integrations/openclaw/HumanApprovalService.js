const { randomUUID } = require('crypto');
const { APPROVAL_STATUS } = require('./types');

const approvals = [];

class HumanApprovalService {
  createApproval({
    actionType,
    channel,
    conversationId,
    createdBy,
    impact,
    payload,
    reason,
    requestId,
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
      payloadSummary: payload,
      status: APPROVAL_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    approvals.unshift(approval);
    approvals.splice(500);
    return { ...approval };
  }

  getApproval(id) {
    const approval = approvals.find((item) => item.id === id);
    return approval ? { ...approval } : null;
  }

  list({ status, limit = 100 } = {}) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    return approvals
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

  updateStatus(id, status, actor) {
    const approval = approvals.find((item) => item.id === id);
    if (!approval) return null;
    if (approval.status !== APPROVAL_STATUS.PENDING) {
      const error = new Error('Approval is already resolved.');
      error.statusCode = 409;
      throw error;
    }
    Object.assign(approval, {
      status,
      resolvedBy: actor,
      updatedAt: new Date().toISOString(),
    });
    return { ...approval };
  }

  clearForTests() {
    approvals.splice(0);
  }
}

module.exports = {
  HumanApprovalService,
};
