const { InMemoryStore } = require('../../persistence/InMemoryStore');

class InternalNoteRepository {
  constructor({ store = new InMemoryStore({ initialData: { version: 1, records: [] } }) } = {}) {
    this.store = store;
  }

  create(note) {
    return this.store.transact((current) => ({
      data: { version: 1, records: [note, ...(current.records || [])].slice(0, 1000) },
      result: note,
    }));
  }

  list({ limit = 100 } = {}) {
    return this.store.initialize().records.slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
  }
}

module.exports = { InternalNoteRepository };
