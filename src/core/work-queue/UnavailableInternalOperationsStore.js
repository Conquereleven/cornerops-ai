const { createWorkQueueError } = require('./workQueueTypes');

class UnavailableInternalOperationsStore {
  constructor({ reason = 'INTERNAL_PERSISTENCE_CONFIGURATION_REQUIRED' } = {}) {
    this.reason = reason;
  }

  async health() {
    return {
      healthy: false,
      provider: 'postgres',
      durable: true,
      status: 'configuration_required',
      errorCode: this.reason,
    };
  }

  async listWorkItems() { return []; }
  async getWorkItem() { return null; }
  async listApprovals() { return []; }
  async getApproval() { return null; }
  async listAuditEvents() { return []; }
  async recordAuditEvent() { return null; }
  async metrics() {
    return {
      openWorkItems: 0,
      highPriorityWorkItems: 0,
      pendingApprovals: 0,
      draftsAwaitingReview: 0,
      completedThisWeek: 0,
      oldestUnresolvedAt: null,
    };
  }

  unavailable() {
    throw createWorkQueueError(
      'Durable CornerOps internal persistence is not configured.',
      this.reason,
      503,
    );
  }

  async syncRecommendations() { return this.unavailable(); }
  async updateWorkItem() { return this.unavailable(); }
  async decideApproval() { return this.unavailable(); }
}

module.exports = { UnavailableInternalOperationsStore };
