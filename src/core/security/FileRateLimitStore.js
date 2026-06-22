const { JsonFileStore } = require('./JsonFileStore');

class FileRateLimitStore {
  constructor({ filePath, root } = {}) {
    this.store = new JsonFileStore({ filePath, root, initialData: { version: 1, states: {} } });
  }

  update(key, updater) {
    return this.store.transact((current) => {
      const states = current.states && typeof current.states === 'object' ? current.states : {};
      const next = updater(states[key]);
      states[key] = next.state;
      return { data: { version: 1, states }, result: next.result };
    });
  }

  health() {
    return this.store.health();
  }
}

module.exports = { FileRateLimitStore };
