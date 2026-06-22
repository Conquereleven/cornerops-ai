class RejectionStore {
  constructor() {
    this.records = [];
  }

  async add(record, cutoff) {
    this.records = this.records.filter((item) => new Date(item.createdAt).getTime() >= cutoff);
    this.records.unshift({ ...record });
    return { ...record };
  }

  async list({ limit = 500, cutoff = 0 } = {}) {
    this.records = this.records.filter((item) => new Date(item.createdAt).getTime() >= cutoff);
    return this.records.slice(0, limit).map((record) => ({ ...record }));
  }

  async health() {
    return { healthy: true, provider: 'memory' };
  }
}

module.exports = { RejectionStore };
