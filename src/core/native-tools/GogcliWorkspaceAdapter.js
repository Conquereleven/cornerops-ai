class GogcliWorkspaceAdapter {
  constructor({ policy, registry, repository } = {}) {
    this.policy = policy;
    this.registry = registry;
    this.repository = repository;
  }

  async searchWorkspace(query = {}) {
    const decision = this.policy.evaluate({ tool: this.registry.get('gogcli'), operation: 'searchWorkspace' });
    const results = decision.allowed
      ? await this.repository.search({ query: query.query || '', sourceIds: ['google_workspace'], limit: query.limit || 20 })
      : [];
    return {
      toolId: 'gogcli',
      status: decision.allowed ? decision.decision : 'denied',
      dryRun: true,
      results,
      message: decision.allowed ? 'Google Workspace search simulated; no real account was accessed.' : decision.reason,
    };
  }
}

module.exports = {
  GogcliWorkspaceAdapter,
};
