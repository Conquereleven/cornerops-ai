const { randomUUID } = require('crypto');
const { APPROVAL_STATUS } = require('./types');
const { sanitizeAuditPayload } = require('../../core/security/SecuritySanitizer');
const { InMemoryStore } = require('../../core/persistence/InMemoryStore');

const initialData = { version: 1, records: [] };

class HumanApprovalService {
  constructor({ store = new InMemoryStore({ initialData }) } = {}) {
    this.store = store;
  }

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
      payloadSummary: sanitizeAuditPayload(payload || {}),
      status: APPROVAL_STATUS.PENDING,
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

  updateStatus(id, status, actor) {
    if (![APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED].includes(status)) {
      return null;
    }
    return this.store.transact((current) => {
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
        resolvedBy: actor,
        updatedAt: new Date().toISOString(),
      };
      return { data: { version: 1, records }, result: records[index] };
    });
  }

  isApproved(id) {
    const approval = this.getApproval(id);
    return Boolean(approval && approval.status === APPROVAL_STATUS.APPROVED);
  }

  clearForTests() {
    this.store.clear();
  }
}

module.exports = {
  HumanApprovalService,
};
