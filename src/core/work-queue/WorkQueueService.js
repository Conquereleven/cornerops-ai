const { materializeRecommendations } = require('./RecommendationMaterializer');

class WorkQueueService {
  constructor({ actionEngineService, config = {}, store } = {}) {
    this.actionEngineService = actionEngineService;
    this.config = config;
    this.store = store;
  }

  async status() {
    const [persistence, metrics] = await Promise.all([this.store.health(), this.store.metrics()]);
    return {
      status: persistence.healthy ? 'ready' : 'configuration_required',
      persistence,
      metrics,
      internalSchema: this.config.corneropsInternalSchema || 'cornerops_internal',
      productionMutationsBlocked: true,
      externalSendsBlocked: true,
    };
  }

  async sync({ actorId = 'founder', correlationId, requestId } = {}) {
    const actionState = await this.actionEngineService.build({
      requestId: requestId || correlationId || 'work-queue-sync-v1.9',
      userId: actorId,
      channel: 'api',
    });
    const recommendations = materializeRecommendations(actionState, {
      operatingStage: this.config.cornermexOperatingStage,
    });
    return this.store.syncRecommendations(recommendations, {
      actorType: 'founder', actorId, correlationId: correlationId || requestId,
    });
  }

  async list(filters) { return this.store.listWorkItems(filters); }
  async get(id) { return this.store.getWorkItem(id); }
  async update(id, command, context) { return this.store.updateWorkItem(id, command, context); }
  async listAudit(filters) { return this.store.listAuditEvents(filters); }
  async metrics() { return this.store.metrics(); }

  async listDrafts(filters = {}) {
    const items = await this.store.listWorkItems({ ...filters, limit: filters.limit || 100 });
    return items.filter((item) => item.safePayload?.sendStatus === 'not_sent').map((item) => ({
      id: item.id,
      workItemId: item.id,
      type: item.safePayload.draftType || item.actionType,
      title: item.title,
      content: item.safePayload.content,
      status: item.status,
      sendStatus: 'not_sent',
      externalSendAllowed: false,
      approvalRequired: item.approvalRequired,
      approvalStatus: item.approvalStatus,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }
}

module.exports = { WorkQueueService };
