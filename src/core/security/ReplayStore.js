class ReplayStore {
  constructor() {
    this.records = [];
  }

  async checkAndSet(record, now = new Date()) {
    const timestamp = now.getTime();
    this.records = this.records.filter((item) => new Date(item.expiresAt).getTime() > timestamp);
    const existing = this.records.find((item) =>
      item.id === record.id
      || (
        item.provider === record.provider
        && item.chatId === record.chatId
        && (
          (record.externalUpdateId && item.externalUpdateId === record.externalUpdateId)
          || (record.externalMessageId && item.externalMessageId === record.externalMessageId)
        )
      ));
    if (existing) return { inserted: false, record: { ...existing } };
    this.records.push({ ...record });
    return { inserted: true, record: { ...record } };
  }

  async list() {
    return this.records.map((record) => ({ ...record }));
  }

  async health() {
    return { healthy: true, provider: 'memory' };
  }
}

module.exports = { ReplayStore };
