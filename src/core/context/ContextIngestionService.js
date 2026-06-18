class ContextIngestionService {
  constructor({ auditLogService, repository } = {}) {
    this.auditLogService = auditLogService;
    this.repository = repository;
  }

  async dryRunIngest({ sourceId, records = [] } = {}, context = {}) {
    await this.auditLogService?.record({
      ...context,
      eventType: 'sync_started',
      dataSource: 'context',
      operation: 'dryRunIngest',
      policyDecision: 'dry_run',
      status: 'success',
      input: { sourceId, count: records.length },
    });
    return {
      status: 'dry_run',
      sourceId,
      wouldIndex: records.length,
      message: 'No real archive was modified.',
    };
  }
}

module.exports = {
  ContextIngestionService,
};
