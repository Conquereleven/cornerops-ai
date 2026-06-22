class FirstRealSourceSelector {
  constructor({ config = {} } = {}) {
    this.config = config;
  }

  select({ businessDb, github } = {}) {
    const mock = (warnings = []) => ({
      selectedSource: 'mock',
      mode: 'mock',
      ready: false,
      readOnlyVerified: false,
      credentialsPresent: false,
      warnings,
    });
    if (!this.config.enabled) return mock(['First real source onboarding is disabled.']);
    if (this.config.mode !== 'read_only') return mock(['Unsafe first real source mode was rejected.']);
    const candidates = this.config.source === 'auto'
      ? this.config.preferredOrder
      : [this.config.source];
    for (const candidate of candidates) {
      const readiness = candidate === 'business_db' ? businessDb : candidate === 'github' ? github : null;
      if (readiness?.ready && readiness.readOnlyVerified) {
        return {
          selectedSource: candidate,
          mode: 'read_only',
          ready: true,
          readOnlyVerified: true,
          credentialsPresent: readiness.credentialsPresent,
          warnings: readiness.warnings || [],
        };
      }
    }
    const requested = candidates.filter((candidate) => candidate !== 'mock').join(', ');
    return mock([`No safe real read-only source is ready (${requested || 'none'}); mock fallback is active.`]);
  }
}

module.exports = { FirstRealSourceSelector };
