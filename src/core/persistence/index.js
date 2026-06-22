const env = require('../../config/env');
const { FileJsonStore } = require('./FileJsonStore');
const { InMemoryStore } = require('./InMemoryStore');
const { PersistenceProviderRegistry } = require('./PersistenceProviderRegistry');
const { PERSISTENCE_PROVIDERS } = require('./persistenceTypes');

const persistenceProviderRegistry = new PersistenceProviderRegistry({
  atomicWrites: env.corneropsFileStoreAtomicWrites,
  defaultProvider: env.corneropsPersistenceProvider,
  failClosed: env.corneropsPersistenceFailClosed,
  maxBytes: env.corneropsFileStoreMaxBytes,
  root: env.corneropsPersistenceRoot,
  testMode: env.nodeEnv === 'test',
});

module.exports = {
  FileJsonStore,
  InMemoryStore,
  PERSISTENCE_PROVIDERS,
  PersistenceProviderRegistry,
  persistenceProviderRegistry,
};
