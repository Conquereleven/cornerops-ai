class LeadRepository {
  constructor({ adapter, normalizer }) {
    this.adapter = adapter;
    this.normalizer = normalizer;
  }

  async listLeads(filters = {}) {
    const leads = this.adapter.listLeads();
    return leads
      .filter((lead) => !filters.status || lead.status === filters.status)
      .map((lead) => this.normalizer.normalizeLead(lead));
  }

  async getLeadById(id) {
    const leads = await this.listLeads();
    return leads.find((lead) => lead.id === id) || null;
  }

  async findLeadsNeedingFollowUp() {
    const leads = await this.listLeads();
    return leads.filter((lead) =>
      ['new', 'contacted', 'qualified', 'quoted', 'stale'].includes(lead.status));
  }
}

module.exports = {
  LeadRepository,
};
