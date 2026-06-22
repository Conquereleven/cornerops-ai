const { applyDataContract, makeMeta } = require('../business/businessTypes');

class QuoteReadOnlyRepository {
  constructor({ adapter, contractRegistry, maxRows = 100, normalizer } = {}) {
    this.adapter = adapter;
    this.contractRegistry = contractRegistry;
    this.maxRows = maxRows;
    this.normalizer = normalizer;
  }

  async list(filters = {}, context = {}) {
    const result = await this.adapter.select({ table: 'quotes', limit: this.maxRows }, context);
    const mapping = this.contractRegistry.getMapping('quote');
    const data = result.rows
      .map((row) => this.normalizer.normalizeQuote(applyDataContract(row, mapping)))
      .filter((quote) => !filters.status || quote.status === filters.status);
    return { data, meta: makeMeta({ ...result, rowCount: data.length, warnings: mapping?.warnings || [] }) };
  }

  async getById(id, context = {}) {
    const result = await this.list({}, context);
    const quote = result.data.find((item) => item.id === String(id) || item.quoteNumber === id) || null;
    return { data: quote, meta: makeMeta({ ...result.meta, rowCount: quote ? 1 : 0 }) };
  }

  async findNeedingFollowUp(context = {}) {
    const result = await this.list({}, context);
    const data = result.data.filter((quote) =>
      ['sent', 'viewed', 'follow_up_needed', 'expired'].includes(quote.status));
    return { data, meta: makeMeta({ ...result.meta, rowCount: data.length }) };
  }

  async findByLeadId(leadId, context = {}) {
    const result = await this.list({}, context);
    const data = result.data.filter((quote) => quote.leadId === leadId);
    return { data, meta: makeMeta({ ...result.meta, rowCount: data.length }) };
  }
}

module.exports = { QuoteReadOnlyRepository };
