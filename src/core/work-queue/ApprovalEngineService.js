class ApprovalEngineService {
  constructor({ store } = {}) { this.store = store; }

  async list(filters) { return this.store.listApprovals(filters); }
  async get(id) { return this.store.getApproval(id); }

  async decide(id, decision, { actorId = 'founder', correlationId, reason } = {}) {
    const approval = await this.store.decideApproval(id, decision, {
      actorType: 'founder', actorId, correlationId, reason,
    });
    if (!approval) return null;
    return {
      approval,
      approved: decision === 'approved',
      executed: false,
      executionStatus: 'not_available_in_current_version',
      productionMutationsBlocked: true,
      externalSendsBlocked: true,
    };
  }
}

module.exports = { ApprovalEngineService };
