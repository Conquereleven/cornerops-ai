class QuoteService {
  constructor({ auditLogService, repository } = {}) {
    this.auditLogService = auditLogService;
    this.repository = repository;
  }

  async audit(context, operation, output) {
    await this.auditLogService?.record({
      ...context,
      eventType: 'data_read',
      dataSource: 'quotes',
      operation,
      output: { count: Array.isArray(output) ? output.length : output ? 1 : 0 },
      status: 'success',
    });
  }

  async listQuotes(filters = {}, context = {}) {
    const quotes = await this.repository.listQuotes(filters);
    await this.audit(context, 'listQuotes', quotes);
    return quotes;
  }

  async getQuoteById(id, context = {}) {
    const quote = await this.repository.getQuoteById(id);
    await this.audit(context, 'getQuoteById', quote);
    return quote;
  }

  async findQuotesNeedingFollowUp(context = {}) {
    const quotes = await this.repository.findQuotesNeedingFollowUp();
    await this.audit(context, 'findQuotesNeedingFollowUp', quotes);
    return quotes;
  }
}

module.exports = {
  QuoteService,
};
