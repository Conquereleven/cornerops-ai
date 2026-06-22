const { JsonFileStore } = require('./JsonFileStore');

class FileReplayStore {
  constructor({ filePath, root } = {}) {
    this.store = new JsonFileStore({ filePath, root, initialData: { version: 1, records: [] } });
  }

  checkAndSet(record, now = new Date()) {
    const timestamp = now.getTime();
    return this.store.transact((current) => {
      const records = Array.isArray(current.records)
        ? current.records.filter((item) => new Date(item.expiresAt).getTime() > timestamp)
        : [];
      const existing = records.find((item) =>
        item.id === record.id
        || (
          item.provider === record.provider
          && item.chatId === record.chatId
          && (
            (record.externalUpdateId && item.externalUpdateId === record.externalUpdateId)
            || (record.externalMessageId && item.externalMessageId === record.externalMessageId)
          )
        ));
      if (existing) {
        return { data: { version: 1, records }, result: { inserted: false, record: existing } };
      }
      records.push(record);
      return { data: { version: 1, records }, result: { inserted: true, record } };
    });
  }

  async list() {
    const data = await this.store.initialize();
    return Array.isArray(data.records) ? data.records.map((record) => ({ ...record })) : [];
  }

  health() {
    return this.store.health();
  }
}

module.exports = { FileReplayStore };
