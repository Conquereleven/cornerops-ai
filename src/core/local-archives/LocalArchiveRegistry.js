class LocalArchiveRegistry {
  constructor({ adapters = {} } = {}) {
    this.adapters = new Map(Object.entries(adapters));
  }

  register(id, adapter) {
    this.adapters.set(id, adapter);
    return this.get(id);
  }

  get(id) {
    return this.adapters.get(id) || null;
  }

  list() {
    return Array.from(this.adapters.entries()).map(([id, adapter]) => ({
      id,
      adapter: adapter.constructor.name,
    }));
  }
}

module.exports = {
  LocalArchiveRegistry,
};
