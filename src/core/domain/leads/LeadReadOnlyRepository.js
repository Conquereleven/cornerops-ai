const { applyDataContract, makeMeta } = require('../business/businessTypes');

class LeadReadOnlyRepository {
  constructor({ adapter, contractRegistry, maxRows = 100, normalizer } = {}) {
    this.adapter = adapter;
    this.contractRegistry = contractRegistry;
    this.maxRows = maxRows;
    this.normalizer = normalizer;
  }

  async list(filters = {}, context = {}) {
    const result = await this.adapter.select({ table: 'leads', limit: this.maxRows }, context);
    const mapping = this.contractRegistry.getMapping('lead');
    const data = result.rows
      .map((row) => this.normalizer.normalizeLead(applyDataContract(row, mapping)))
      .filter((lead) => !filters.status || lead.status === filters.status);
    return {
      data,
      meta: makeMeta({ ...result, rowCount: data.length, warnings: mapping?.warnings || [] }),
    };
  }

  async getById(id, context = {}) {
    const result = await this.list({}, context);
    const lead = result.data.find((item) => item.id === String(id)) || null;
    return { data: lead, meta: makeMeta({ ...result.meta, rowCount: lead ? 1 : 0 }) };
  }

  async findNeedingFollowUp(context = {}) {
    const result = await this.list({}, context);
    const data = result.data.filter((lead) =>
      ['new', 'contacted', 'qualified', 'quoted', 'stale'].includes(lead.status));
    return { data, meta: makeMeta({ ...result.meta, rowCount: data.length }) };
  }
}

module.exports = { LeadReadOnlyRepository };
