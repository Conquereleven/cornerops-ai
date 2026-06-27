class ApprovalService {
  constructor({ humanApprovalService } = {}) {
    this.humanApprovalService = humanApprovalService;
  }

  async requestApproval(input = {}) {
    return this.humanApprovalService.createApproval({
      actionType: input.actionType,
      channel: input.channel || 'internal',
      conversationId: input.conversationId,
      createdBy: input.createdBy || input.userId || 'operator',
      impact: input.impact || 'Real action is blocked until approved.',
      payload: input.payload,
      actionPayload: input.actionPayload,
      payloadChecksum: input.payloadChecksum,
      reason: input.reason || 'Approval required by CornerOps policy.',
      requestId: input.requestId,
      requestedDryRun: input.requestedDryRun,
      riskLevel: input.riskLevel,
      toolName: input.toolName,
    });
  }

  async approveApproval(id, approverUserId = 'operator') {
    return this.humanApprovalService.approve(id, approverUserId);
  }

  async rejectApproval(id, approverUserId = 'operator') {
    return this.humanApprovalService.reject(id, approverUserId);
  }

  async expireApproval(id, actor = 'system') {
    return this.humanApprovalService.expire(id, actor);
  }

  async transitionExecution(id, status, actor = 'operator', details = {}) {
    return this.humanApprovalService.transitionExecution(id, status, actor, details);
  }

  async getApproval(id) {
    return this.humanApprovalService.getApproval(id);
  }

  async listPendingApprovals(filters = {}) {
    return this.humanApprovalService.list({
      ...filters,
      status: filters.status || 'pending',
    });
  }

  async listApprovals(filters = {}) {
    return this.humanApprovalService.list(filters);
  }
}

module.exports = {
  ApprovalService,
};
