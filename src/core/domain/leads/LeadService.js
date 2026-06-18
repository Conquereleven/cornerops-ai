class LeadService {
  constructor({ auditLogService, repository } = {}) {
    this.auditLogService = auditLogService;
    this.repository = repository;
  }

  async audit(context, operation, output) {
    await this.auditLogService?.record({
      ...context,
      eventType: 'data_read',
      dataSource: 'leads',
      operation,
      output: { count: Array.isArray(output) ? output.length : output ? 1 : 0 },
      status: 'success',
    });
  }

  async listLeads(filters = {}, context = {}) {
    const leads = await this.repository.listLeads(filters);
    await this.audit(context, 'listLeads', leads);
    return leads;
  }

  async getLeadById(id, context = {}) {
    const lead = await this.repository.getLeadById(id);
    await this.audit(context, 'getLeadById', lead);
    return lead;
  }

  async findLeadsNeedingFollowUp(context = {}) {
    const leads = await this.repository.findLeadsNeedingFollowUp();
    await this.audit(context, 'findLeadsNeedingFollowUp', leads);
    return leads;
  }
}

module.exports = {
  LeadService,
};
