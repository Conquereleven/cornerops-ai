class DataHealthService {
  constructor({
    databaseClient,
    dataSourceRegistry,
    ecosystemRegistry,
    githubClient,
    mode = 'mock',
  } = {}) {
    this.databaseClient = databaseClient;
    this.dataSourceRegistry = dataSourceRegistry;
    this.ecosystemRegistry = ecosystemRegistry;
    this.githubClient = githubClient;
    this.mode = mode;
  }

  async getReport() {
    const now = new Date().toISOString();
    const dbHealth = await this.databaseClient.health();
    const sources = this.dataSourceRegistry.list().map((source) => ({
      id: source.id,
      enabled: source.enabled,
      connected: source.adapter === 'mock' ? true : dbHealth.connected,
      lastCheckedAt: now,
      error: source.enabled ? undefined : 'disabled_by_feature_flag',
    }));
    const ecosystemServices = this.ecosystemRegistry.list().map((service) => ({
      id: service.id,
      enabled: service.enabled,
      mode: service.mode,
      status: service.enabled ? 'available' : 'disabled',
      riskLevel: service.riskLevel,
      lastCheckedAt: now,
    }));
    const warnings = [];
    if (this.mode === 'mock') warnings.push('CORNEROPS_DATA_MODE=mock; metrics come from fixtures.');
    if (!dbHealth.connected && dbHealth.provider !== 'mock') warnings.push(`${dbHealth.provider} is not connected.`);
    if (!this.githubClient?.config?.enabled) warnings.push('GitHub integration is disabled; fixture data is used.');
    return {
      status: warnings.length > 1 ? 'degraded' : 'healthy',
      mode: this.mode,
      sources,
      ecosystemServices,
      warnings,
    };
  }
}

module.exports = {
  DataHealthService,
};
