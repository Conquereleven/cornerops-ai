const { JsonFileStore } = require('./JsonFileStore');

class FileRejectionStore {
  constructor({ filePath, root } = {}) {
    this.store = new JsonFileStore({ filePath, root, initialData: { version: 1, records: [] } });
  }

  add(record, cutoff) {
    return this.store.transact((current) => {
      const records = (Array.isArray(current.records) ? current.records : [])
        .filter((item) => new Date(item.createdAt).getTime() >= cutoff);
      records.unshift(record);
      return { data: { version: 1, records: records.slice(0, 5000) }, result: record };
    });
  }

  list({ limit = 500, cutoff = 0 } = {}) {
    return this.store.transact((current) => {
      const records = (Array.isArray(current.records) ? current.records : [])
        .filter((item) => new Date(item.createdAt).getTime() >= cutoff);
      return { data: { version: 1, records }, result: records.slice(0, limit) };
    });
  }

  health() {
    return this.store.health();
  }
}

module.exports = { FileRejectionStore };
