const { DemandIntakeService } = require('./DemandIntakeService');
const { IntermexCatalogSynchronizer } = require('./IntermexCatalogSynchronizer');
const { SupplyGraphDataQualityService } = require('./SupplyGraphDataQualityService');
const { createSupplyGraphError } = require('./supplyGraphTypes');

class SupplyGraphService {
  constructor({ store, internalStore, config = {}, synchronizer } = {}) {
    this.store = store;
    this.internalStore = internalStore;
    this.config = config;
    this.synchronizer = synchronizer || new IntermexCatalogSynchronizer({
      sourcePath: config.supplyGraphIntermexSourcePath,
      expectedChecksum: config.supplyGraphIntermexSourceChecksum,
    });
    this.demandIntake = new DemandIntakeService({ store, internalStore });
    this.dataQuality = new SupplyGraphDataQualityService({ store, config });
  }

  assertEnabled(capability) {
    if (!this.config.supplyGraphEnabled) {
      throw createSupplyGraphError('SupplyGraph is disabled.', 'SUPPLYGRAPH_DISABLED', 503);
    }
    if (capability === 'sync' && !this.config.supplyGraphIntermexSyncEnabled) {
      throw createSupplyGraphError('Intermex synchronization is disabled.', 'SUPPLYGRAPH_INTERMEX_SYNC_DISABLED', 503);
    }
    if (capability === 'demand' && !this.config.supplyGraphDemandIntakeEnabled) {
      throw createSupplyGraphError('Demand intake is disabled.', 'SUPPLYGRAPH_DEMAND_INTAKE_DISABLED', 503);
    }
  }

  async status() {
    if (!this.config.supplyGraphEnabled) {
      return {
        status: 'configuration_required',
        persistence: { healthy: false, provider: 'postgres', durable: true, schema: 'cornerops_internal' },
        metrics: null,
        warnings: ['SUPPLYGRAPH_DISABLED'],
        ...this.dataQuality.safety(),
      };
    }
    return this.dataQuality.build();
  }

  async syncIntermex(context = {}) {
    this.assertEnabled('sync');
    const source = this.synchronizer.load();
    const result = await this.store.syncCatalog(source, context);
    const unknownFacts = source.items.reduce((count, item) => count
      + ['stockStatus', 'minimumOrderQuantity', 'leadTimeDays', 'shelfLifeDays']
        .filter((field) => item.offer[field] === null || item.offer[field] === 'unknown').length, 0);
    const recommendations = [];
    if (unknownFacts > 0) recommendations.push({
      idempotencyKey: `supplygraph-source-verification:${source.sourceChecksum}`,
      sourceType: 'supplygraph',
      sourceId: `intermex:${source.sourceChecksum}`,
      sourceFlow: 'supplygraph_source_verification_flow',
      actionType: 'internal_supplier_fact_review',
      title: 'Review unknown Intermex commercial facts',
      description: 'Commercial observations remain unknown until a verified source is available.',
      priority: 'medium', status: 'recommended', approvalRequired: false,
      evidence: {
        conditionActive: true, source: source.sourcePath, observedAt: source.observedAt,
        catalogItemCount: source.items.length, unknownFactCount: unknownFacts,
      },
      safePayload: { internalReviewOnly: true, supplierContactAllowed: false, externalActionAllowed: false },
    });
    if (source.skipped.length) recommendations.push({
      idempotencyKey: `supplygraph-catalog-quality:${source.sourceChecksum}`,
      sourceType: 'supplygraph', sourceId: `intermex:${source.sourceChecksum}`,
      sourceFlow: 'supplygraph_catalog_quality_flow', actionType: 'internal_catalog_quality_review',
      title: 'Review skipped Intermex catalog records',
      description: 'Some snapshot rows failed deterministic validation.',
      priority: 'high', status: 'recommended', approvalRequired: false,
      evidence: { conditionActive: true, source: source.sourcePath, observedAt: source.observedAt, skippedCount: source.skipped.length },
      safePayload: { internalReviewOnly: true, externalActionAllowed: false },
    });
    const workQueue = await this.internalStore.syncRecommendations(recommendations, {
      actorType: context.actorType || 'founder', actorId: context.actorId || 'founder',
      correlationId: context.correlationId, sourceType: 'supplygraph',
      sourceId: `intermex:${source.sourceChecksum}`,
    });
    return { ...result, workQueue, productActivationBlocked: true, matchingEngineStatus: 'not_implemented' };
  }

  async createDemand(input, context) { this.assertEnabled('demand'); return this.demandIntake.create(input, context); }
  async updateDemand(id, command, context) { this.assertEnabled('demand'); return this.demandIntake.update(id, command, context); }
  async listSuppliers(filters) { this.assertEnabled(); return this.store.listSuppliers(filters); }
  async getSupplier(id) { this.assertEnabled(); return this.store.getSupplier(id); }
  async listCatalog(filters) { this.assertEnabled(); return this.store.listCatalog(filters); }
  async listDemands(filters) { this.assertEnabled(); return this.store.listDemands(filters); }
  async getDemand(id) { this.assertEnabled(); return this.store.getDemand(id); }
}

module.exports = { SupplyGraphService };
