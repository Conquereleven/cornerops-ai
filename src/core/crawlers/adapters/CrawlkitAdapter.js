class CrawlkitAdapter {
  constructor({ auditLogService, crawlerId = 'crawlkit', policy, registry, repository, sourceId = 'manual_uploads' } = {}) {
    this.auditLogService = auditLogService;
    this.crawlerId = crawlerId;
    this.policy = policy;
    this.registry = registry;
    this.repository = repository;
    this.sourceId = sourceId;
  }

  crawler() {
    return this.registry.get(this.crawlerId);
  }

  async audit(context, operation, decision, output) {
    await this.auditLogService?.record({
      ...context,
      eventType: 'tool_invocation',
      dataSource: 'context_crawler',
      operation: `${this.crawlerId}.${operation}`,
      policyDecision: decision.decision,
      status: decision.allowed ? 'success' : 'denied',
      output,
    });
  }

  async healthCheck(context = {}) {
    const crawler = this.crawler();
    const output = {
      id: this.crawlerId,
      status: crawler?.enabled ? 'available' : 'disabled',
      mode: crawler?.mode || 'mock',
      dryRun: true,
      lastCheckedAt: new Date().toISOString(),
    };
    await this.audit(context, 'healthCheck', { allowed: true, decision: 'dry_run' }, output);
    return output;
  }

  async dryRunSync(input = {}, context = {}) {
    const decision = this.policy.evaluate({ crawler: this.crawler(), operation: 'dryRunSync' });
    const records = await this.repository.listRecords({ sourceId: this.sourceId });
    const output = {
      crawlerId: this.crawlerId,
      status: decision.allowed ? decision.decision : 'denied',
      dryRun: true,
      wouldIndex: records.length,
      sourceId: this.sourceId,
      message: decision.allowed ? 'Crawler sync simulated; no real account or archive was read.' : decision.reason,
    };
    await this.audit(context, 'dryRunSync', decision, output);
    return output;
  }

  async search(query = {}, context = {}) {
    const decision = this.policy.evaluate({ crawler: this.crawler(), operation: 'search' });
    const records = decision.allowed
      ? await this.repository.search({ query: query.query || '', sourceIds: [this.sourceId], limit: query.limit || 20 })
      : [];
    const output = {
      crawlerId: this.crawlerId,
      status: decision.allowed ? 'success' : 'denied',
      results: records,
      reason: decision.allowed ? undefined : decision.reason,
    };
    await this.audit(context, 'search', decision, { count: records.length });
    return output;
  }

  async getRecordById(id, context = {}) {
    const decision = this.policy.evaluate({ crawler: this.crawler(), operation: 'getRecordById' });
    const record = decision.allowed ? await this.repository.getRecordById(id) : null;
    await this.audit(context, 'getRecordById', decision, { found: Boolean(record) });
    return record;
  }
}

module.exports = {
  CrawlkitAdapter,
};
