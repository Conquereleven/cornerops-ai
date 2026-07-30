const { commercialError } = require('./commercialTypes');

class UnavailableCommercialOperationsStore {
  async health() { return { healthy: false, state: 'missing', provider: 'unavailable', durable: false, reason: 'COMMERCIAL_MIGRATION_NOT_APPLIED' }; }
  async get() { return null; }
  async list() { return []; }
  async listTransitions() { return []; }
  async listEvidence() { return []; }
  async claimEvidence() { throw commercialError('Commercial persistence is unavailable.', 'COMMERCIAL_PERSISTENCE_REQUIRED', 503); }
  async create() { throw commercialError('Commercial persistence is unavailable.', 'COMMERCIAL_PERSISTENCE_REQUIRED', 503); }
  async update() { throw commercialError('Commercial persistence is unavailable.', 'COMMERCIAL_PERSISTENCE_REQUIRED', 503); }
}

module.exports = { UnavailableCommercialOperationsStore };
