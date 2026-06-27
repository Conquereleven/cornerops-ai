const { InMemoryStore } = require('../../persistence/InMemoryStore');

class InternalTaskRepository {
  constructor({ store = new InMemoryStore({ initialData: { version: 1, records: [] } }) } = {}) {
    this.store = store;
  }

  create(task) {
    return this.store.transact((current) => ({
      data: { version: 1, records: [task, ...(current.records || [])].slice(0, 1000) },
      result: task,
    }));
  }

  list({ limit = 100 } = {}) {
    return this.store.initialize().records.slice(0, Math.max(1, Math.min(Number(limit) || 100, 500)));
  }
}

module.exports = { InternalTaskRepository };
