const SAFE_CODES = Object.freeze({
  CORE_PERSISTENCE_REQUIRED: 'CORE_PERSISTENCE_REQUIRED',
  COMMERCIAL_PERSISTENCE_REQUIRED: 'COMMERCIAL_PERSISTENCE_REQUIRED',
});

class ApplicationReadinessService {
  constructor({ config = {}, commercialOperationsService, corePersistence } = {}) {
    this.config = config;
    this.commercialOperationsService = commercialOperationsService;
    this.corePersistence = corePersistence;
  }

  async corePersistenceStatus() {
    const required = this.config.corneropsInternalPersistenceEnabled === true;
    if (!required) return { required: false, state: 'not_required' };

    try {
      const health = await this.corePersistence?.health?.();
      if (health?.healthy === true) return { required: true, state: 'ready' };
    } catch (_error) {
      // Readiness responses intentionally suppress infrastructure details.
    }
    return {
      required: true,
      state: 'unavailable',
      code: SAFE_CODES.CORE_PERSISTENCE_REQUIRED,
    };
  }

  async commercialStatus() {
    const enabled = this.config.corneropsCommercialOperationsEnabled === true;
    if (!enabled) {
      return {
        enabled: false,
        requiredForReadiness: false,
        state: 'disabled',
      };
    }

    try {
      const availability = await this.commercialOperationsService?.availability?.();
      if (availability?.available === true) {
        return {
          enabled: true,
          requiredForReadiness: true,
          state: 'ready',
        };
      }
    } catch (_error) {
      // Fail closed without surfacing SQL, network or configuration details.
    }
    return {
      enabled: true,
      requiredForReadiness: true,
      state: 'unavailable',
      code: SAFE_CODES.COMMERCIAL_PERSISTENCE_REQUIRED,
    };
  }

  async check() {
    const [corePersistence, commercialOperations] = await Promise.all([
      this.corePersistenceStatus(),
      this.commercialStatus(),
    ]);

    if (corePersistence.state === 'unavailable') {
      return {
        httpStatus: 503,
        body: {
          status: 'not_ready',
          service: 'cornerops-ai',
          mode: 'core_dependency_unavailable',
          code: SAFE_CODES.CORE_PERSISTENCE_REQUIRED,
          corePersistence,
          commercialOperations,
        },
      };
    }
    if (commercialOperations.state === 'unavailable') {
      return {
        httpStatus: 503,
        body: {
          status: 'not_ready',
          service: 'cornerops-ai',
          mode: 'commercial_persistence_required',
          code: SAFE_CODES.COMMERCIAL_PERSISTENCE_REQUIRED,
          corePersistence,
          commercialOperations,
        },
      };
    }

    return {
      httpStatus: 200,
      body: {
        status: 'ready',
        service: 'cornerops-ai',
        mode: commercialOperations.enabled ? 'commercial_ready' : 'commercial_inactive',
        corePersistence,
        commercialOperations,
      },
    };
  }
}

module.exports = { ApplicationReadinessService, SAFE_CODES };
