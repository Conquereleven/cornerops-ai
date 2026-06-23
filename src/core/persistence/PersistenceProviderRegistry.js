const { FileJsonStore } = require('./FileJsonStore');
const { InMemoryStore } = require('./InMemoryStore');
const { PERSISTENCE_PROVIDERS, createStoreError } = require('./persistenceTypes');

class PersistenceProviderRegistry {
  constructor({
    atomicWrites = true,
    defaultProvider = PERSISTENCE_PROVIDERS.FILE_JSON,
    failClosed = true,
    maxBytes = 5 * 1024 * 1024,
    root = './.cornerops/state',
    testMode = false,
  } = {}) {
    this.atomicWrites = atomicWrites;
    this.testMode = testMode;
    this.defaultProvider = testMode ? PERSISTENCE_PROVIDERS.MEMORY : defaultProvider;
    this.failClosed = failClosed;
    this.maxBytes = maxBytes;
    this.root = root;
    this.stores = new Map();
  }

  createStore(name, { critical = false, initialData, provider, sanitizer } = {}) {
    const selected = this.testMode ? PERSISTENCE_PROVIDERS.MEMORY : provider || this.defaultProvider;
    if (!Object.values(PERSISTENCE_PROVIDERS).includes(selected)) {
      throw createStoreError(`Unsupported persistence provider: ${selected}`, 'PERSISTENCE_PROVIDER_UNSUPPORTED');
    }
    const key = `${selected}:${name}`;
    if (this.stores.has(key)) return this.stores.get(key);
    const store = selected === PERSISTENCE_PROVIDERS.MEMORY
      ? new InMemoryStore({ initialData, sanitizer })
      : new FileJsonStore({
        atomicWrites: this.atomicWrites,
        critical,
        failClosed: this.failClosed,
        filePath: `${String(name).replace(/[^a-z0-9_-]/gi, '-')}.json`,
        initialData,
        maxBytes: this.maxBytes,
        root: this.root,
        sanitizer,
      });
    this.stores.set(key, store);
    return store;
  }

  listProviders() {
    return Object.values(PERSISTENCE_PROVIDERS);
  }
}

module.exports = { PersistenceProviderRegistry };
