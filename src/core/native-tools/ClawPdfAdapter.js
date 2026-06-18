class ClawPdfAdapter {
  constructor({ policy, registry, repository } = {}) {
    this.policy = policy;
    this.registry = registry;
    this.repository = repository;
  }

  async parseMockPdf(query = {}) {
    const decision = this.policy.evaluate({ tool: this.registry.get('clawpdf'), operation: 'parseMockPdf' });
    const results = decision.allowed
      ? await this.repository.search({ query: query.query || 'catalog', sourceIds: ['pdf_documents'], limit: query.limit || 20 })
      : [];
    return {
      toolId: 'clawpdf',
      status: decision.allowed ? 'success' : 'denied',
      results,
      message: decision.allowed ? 'Mock PDF context parsed locally; no external upload occurred.' : decision.reason,
    };
  }
}

module.exports = {
  ClawPdfAdapter,
};
