const { MemoryInternalOperationsStore } = require('./MemoryInternalOperationsStore');
const { PostgresInternalOperationsStore } = require('./PostgresInternalOperationsStore');
const { UnavailableInternalOperationsStore } = require('./UnavailableInternalOperationsStore');

const createInternalOperationsStore = (config = {}, options = {}) => {
  if (options.testMode) return new MemoryInternalOperationsStore({ state: options.state });
  if (!config.corneropsInternalPersistenceEnabled || !config.corneropsInternalDatabaseUrl) {
    return new UnavailableInternalOperationsStore();
  }
  if (config.corneropsInternalPersistenceProvider !== 'postgres') {
    return new UnavailableInternalOperationsStore({ reason: 'INTERNAL_PERSISTENCE_PROVIDER_DENIED' });
  }
  return new PostgresInternalOperationsStore({
    connectionString: config.corneropsInternalDatabaseUrl,
    schema: config.corneropsInternalSchema,
    statementTimeoutMs: config.corneropsInternalStatementTimeoutMs,
    caPath: config.corneropsInternalDatabaseCaPath,
  });
};

module.exports = { createInternalOperationsStore };
