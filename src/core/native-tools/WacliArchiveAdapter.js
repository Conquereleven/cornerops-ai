class WacliArchiveAdapter {
  constructor({ policy, registry, repository } = {}) {
    this.policy = policy;
    this.registry = registry;
    this.repository = repository;
  }

  async searchArchive(query = {}) {
    const decision = this.policy.evaluate({ tool: this.registry.get('wacli'), operation: 'searchArchive' });
    const results = decision.allowed
      ? await this.repository.search({ query: query.query || '', sourceIds: ['whatsapp_archive'], limit: query.limit || 20 })
      : [];
    return {
      toolId: 'wacli',
      status: decision.allowed ? 'success' : 'denied',
      mode: 'read_only',
      results,
      message: decision.allowed ? 'WhatsApp archive search only; no messages sent.' : decision.reason,
    };
  }
}

module.exports = {
  WacliArchiveAdapter,
};
