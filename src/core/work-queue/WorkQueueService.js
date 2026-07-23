const { materializeProgramStateRecommendations, materializeRecommendations } = require('./RecommendationMaterializer');

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

  async syncProgramState(state, { actorId = 'cornerops-program-adapter', correlationId } = {}) {
    const recommendations = materializeProgramStateRecommendations(state);
    return this.store.syncRecommendations(recommendations, {
      sourceType: 'cornermex_program_state',
      sourceId: state.sourceRepository || null,
      actorType: 'system',
      actorId,
      correlationId: correlationId || state.evidenceChecksum || undefined,
      metadata: { classification: state.status, sanitized: true },
    });
  }

  async syncCommercial(recommendations, context = {}) {
    const aggregate = { scannedRecommendations: 0, createdWorkItems: 0, reusedWorkItems: 0, reopenedWorkItems: 0, skippedRecommendations: 0, errors: [], items: [] };
    for (const recommendation of recommendations) {
      const result = await this.store.syncRecommendations([recommendation], {
        sourceType: 'commercial_operations',
        sourceId: recommendation.sourceId,
        actorType: 'founder',
        actorId: context.actorId || 'founder',
        correlationId: context.correlationId,
      });
      Object.keys(aggregate).forEach((key) => {
        if (Array.isArray(aggregate[key])) aggregate[key].push(...(result[key] || []));
        else aggregate[key] += result[key] || 0;
      });
    }
    return aggregate;
  }

  async resolveCommercial(idempotencyKey, context = {}) {
    const items = await this.store.listWorkItems({ limit: 100 });
    const item = items.find((candidate) => candidate.idempotencyKey === idempotencyKey);
    if (!item) return null;
    return this.store.updateWorkItem(item.id, {
      command: 'mark_manually_completed', version: item.version, reason: context.reason || 'commercial_condition_resolved',
    }, { actorType: 'founder', actorId: context.actorId || 'founder', correlationId: context.correlationId });
  }

  async list(filters) { return this.store.listWorkItems(filters); }
  async get(id) { return this.store.getWorkItem(id); }
  async update(id, command, context) { return this.store.updateWorkItem(id, command, context); }
  async listAudit(filters) { return this.store.listAuditEvents(filters); }
  async metrics() { return this.store.metrics(); }

  async listDrafts(filters = {}) {
    const items = await this.store.listWorkItems({ ...filters, limit: filters.limit || 100 });
    return items.filter((item) => ['not_sent', 'DRAFT_NOT_SENT'].includes(item.safePayload?.sendStatus)).map((item) => ({
      id: item.id,
      workItemId: item.id,
      type: item.safePayload.draftType || item.actionType,
      title: item.title,
      content: item.safePayload.content,
      status: item.status,
      sendStatus: 'DRAFT_NOT_SENT',
      externalSendAllowed: false,
      approvalRequired: item.approvalRequired,
      approvalStatus: item.approvalStatus,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }
}

module.exports = { WorkQueueService };
