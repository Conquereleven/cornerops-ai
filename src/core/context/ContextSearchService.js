class ContextSearchService {
  constructor({
    auditLogService,
    contextAccessPolicy,
    repository,
    sourceRegistry,
    maxResults = 20,
  } = {}) {
    this.auditLogService = auditLogService;
    this.contextAccessPolicy = contextAccessPolicy;
    this.repository = repository;
    this.sourceRegistry = sourceRegistry;
    this.maxResults = maxResults;
  }

  async search(query = {}, context = {}) {
    const limit = Math.min(Number(query.limit) || this.maxResults, this.maxResults);
    const sourceIds = query.sourceIds?.length
      ? query.sourceIds
      : this.sourceRegistry.list({ enabledOnly: true }).map((source) => source.id);
    const decisions = sourceIds.map((sourceId) => {
      const source = this.sourceRegistry.get(sourceId);
      return {
        source,
        policy: this.contextAccessPolicy.evaluate({
          agentId: context.agentId,
          channel: context.channel,
          operation: 'search',
          source,
          userId: context.userId,
        }),
      };
    });
    const allowedSourceIds = decisions
      .filter(({ policy }) => policy.allowed)
      .map(({ source }) => source.id);
    const piiMaxLevel = query.filters?.piiMaxLevel || 'high';
    const rawResults = allowedSourceIds.length
      ? await this.repository.search({ ...query, sourceIds: allowedSourceIds, limit })
      : [];
    const filtered = this.contextAccessPolicy.filterByPii(rawResults, piiMaxLevel)
      .map((result) => this.contextAccessPolicy.sanitizeRecord(result));
    await this.auditLogService?.record({
      ...context,
      eventType: 'data_read',
      dataSource: 'context',
      operation: 'searchContext',
      policyDecision: decisions.every(({ policy }) => policy.allowed) ? 'allowed' : 'denied',
      status: 'success',
      input: { query: query.query, sourceIds, piiMaxLevel },
      output: { count: filtered.length },
    });
    return filtered.slice(0, limit);
  }

  async getRecordById(id, context = {}) {
    const record = await this.repository.getRecordById(id);
    const source = record ? this.sourceRegistry.get(record.sourceId) : null;
    const policy = this.contextAccessPolicy.evaluate({
      agentId: context.agentId,
      channel: context.channel,
      operation: 'read',
      source,
      userId: context.userId,
    });
    await this.auditLogService?.record({
      ...context,
      eventType: 'data_read',
      dataSource: 'context',
      operation: 'getRecordById',
      policyDecision: policy.decision,
      status: policy.allowed && record ? 'success' : 'denied',
      input: { id },
      output: { found: Boolean(record && policy.allowed) },
    });
    if (!record || !policy.allowed) return null;
    return policy.maskPii ? this.contextAccessPolicy.sanitizeRecord(record) : record;
  }
}

module.exports = {
  ContextSearchService,
};
