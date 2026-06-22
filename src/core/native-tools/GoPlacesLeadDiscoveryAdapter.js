class GoPlacesLeadDiscoveryAdapter {
  constructor({ policy, registry, repository } = {}) {
    this.policy = policy;
    this.registry = registry;
    this.repository = repository;
  }

  async discoverLeads(query = {}) {
    const decision = this.policy.evaluate({ tool: this.registry.get('goplaces'), operation: 'discoverLeads' });
    const results = decision.allowed
      ? await this.repository.search({ query: query.query || 'restaurant', sourceIds: ['google_places'], limit: query.limit || 20 })
      : [];
    return {
      toolId: 'goplaces',
      status: decision.allowed ? decision.decision : 'denied',
      dryRun: true,
      results,
      message: decision.allowed ? 'Google Places lead discovery simulated with mock public records.' : decision.reason,
    };
  }
}

module.exports = {
  GoPlacesLeadDiscoveryAdapter,
};
