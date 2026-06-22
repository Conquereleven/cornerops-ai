class BusinessDataService {
  constructor({
    auditLogService,
    contractRegistry,
    leadRepository,
    orderRepository,
    quoteRepository,
    schemaDiscoveryService,
  } = {}) {
    this.auditLogService = auditLogService;
    this.contractRegistry = contractRegistry;
    this.leadRepository = leadRepository;
    this.orderRepository = orderRepository;
    this.quoteRepository = quoteRepository;
    this.schemaDiscoveryService = schemaDiscoveryService;
    this.schemaReport = null;
  }

  async ensureReady(context = {}) {
    if (!this.schemaReport) {
      this.schemaReport = await this.schemaDiscoveryService.discover(context);
      this.contractRegistry.mapSchema(this.schemaReport);
    }
    return this.schemaReport;
  }

  async run(operation, context, loader) {
    await this.ensureReady(context);
    const result = await loader();
    await this.auditLogService?.record({
      ...context,
      eventType: 'business_data_read',
      dataSource: 'business_data',
      operation,
      policyDecision: 'allowed',
      status: 'success',
      output: {
        source: result.meta.source,
        rowCount: result.meta.rowCount,
        readOnly: true,
        truncated: result.meta.truncated,
      },
    });
    return result;
  }

  listLeads(filters = {}, context = {}) {
    return this.run('list_leads', context, () => this.leadRepository.list(filters, context));
  }

  getLeadById(id, context = {}) {
    return this.run('get_lead_by_id', context, () => this.leadRepository.getById(id, context));
  }

  findLeadsNeedingFollowUp(context = {}) {
    return this.run('find_leads_needing_follow_up', context, () => this.leadRepository.findNeedingFollowUp(context));
  }

  listQuotes(filters = {}, context = {}) {
    return this.run('list_quotes', context, () => this.quoteRepository.list(filters, context));
  }

  getQuoteById(id, context = {}) {
    return this.run('get_quote_by_id', context, () => this.quoteRepository.getById(id, context));
  }

  findQuotesNeedingFollowUp(context = {}) {
    return this.run('find_quotes_needing_follow_up', context, () => this.quoteRepository.findNeedingFollowUp(context));
  }

  findQuotesByLeadId(leadId, context = {}) {
    return this.run('find_quotes_by_lead_id', context, () => this.quoteRepository.findByLeadId(leadId, context));
  }

  listOrders(filters = {}, context = {}) {
    return this.run('list_orders', context, () => this.orderRepository.list(filters, context));
  }

  getOrderById(id, context = {}) {
    return this.run('get_order_by_id', context, () => this.orderRepository.getById(id, context));
  }

  findOrdersRequiringAction(context = {}) {
    return this.run('find_orders_requiring_action', context, () => this.orderRepository.findRequiringAction(context));
  }

  findManualPaymentOrders(context = {}) {
    return this.run('find_manual_payment_orders', context, () => this.orderRepository.findManualPayments(context));
  }

  async getHealth(context = {}) {
    const report = await this.ensureReady(context);
    const adapterHealth = await this.leadRepository.adapter.health();
    const mappings = this.contractRegistry.listMappings();
    const warnings = [
      ...adapterHealth.warnings,
      ...report.warnings,
      ...mappings.flatMap((mapping) => mapping.warnings),
    ];
    return {
      status: adapterHealth.mode === 'mock' || warnings.length ? 'degraded' : 'healthy',
      mode: adapterHealth.mode,
      provider: adapterHealth.provider,
      readOnlyVerified: adapterHealth.readOnlyVerified,
      mappedEntities: mappings.filter((mapping) => mapping.confidence !== 'low').map((mapping) => mapping.entity),
      warnings: [...new Set(warnings)],
    };
  }

  getDataContracts() {
    return this.contractRegistry.listMappings();
  }

  getSchemaReport() {
    return this.schemaReport;
  }

  resetForTests() {
    this.schemaReport = null;
    this.contractRegistry.mappings = [];
  }
}

module.exports = { BusinessDataService };
