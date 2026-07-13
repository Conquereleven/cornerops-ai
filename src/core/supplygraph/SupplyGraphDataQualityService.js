class SupplyGraphDataQualityService {
  constructor({ store, config = {} } = {}) {
    this.store = store;
    this.config = config;
  }

  async build() {
    const persistence = await this.store.health();
    if (!persistence.healthy) {
      return {
        status: this.config.supplyGraphEnabled ? 'unavailable' : 'configuration_required',
        persistence,
        metrics: null,
        warnings: [persistence.errorCode || 'SUPPLYGRAPH_PERSISTENCE_UNAVAILABLE'],
        ...this.safety(),
      };
    }
    try {
      const metrics = await this.store.metrics(this.config.supplyGraphObservationStaleAfterHours || 168);
      return {
        status: 'ready',
        persistence,
        metrics,
        observationStaleAfterHours: this.config.supplyGraphObservationStaleAfterHours || 168,
        warnings: metrics.staleObservationCount > 0
          ? ['Supplier observations are stale and must not be treated as current stock truth.'] : [],
        ...this.safety(),
      };
    } catch (error) {
      return {
        status: 'partial', persistence, metrics: null,
        warnings: [error.code || 'SUPPLYGRAPH_METRICS_UNAVAILABLE'],
        ...this.safety(),
      };
    }
  }

  safety() {
    return {
      cornerMexWritesBlocked: true,
      externalActionsBlocked: true,
      productActivationBlocked: true,
      matchingEngineStatus: this.config.supplyGraphMatchingEnabled === undefined
        ? 'not_implemented' : this.config.supplyGraphMatchingEnabled ? 'ready' : 'disabled',
      supplierOutreachStatus: 'blocked',
      autonomousPurchasingStatus: 'blocked',
      quoteGenerationStatus: 'not_implemented',
    };
  }
}

module.exports = { SupplyGraphDataQualityService };
