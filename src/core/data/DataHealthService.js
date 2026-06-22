class DataHealthService {
  constructor({
    businessDataService,
    databaseClient,
    dataSourceRegistry,
    ecosystemRegistry,
    githubClient,
    mode = 'mock',
  } = {}) {
    this.businessDataService = businessDataService;
    this.databaseClient = databaseClient;
    this.dataSourceRegistry = dataSourceRegistry;
    this.ecosystemRegistry = ecosystemRegistry;
    this.githubClient = githubClient;
    this.mode = mode;
  }

  async getReport() {
    const now = new Date().toISOString();
    const dbHealth = await this.databaseClient.health();
    const businessData = this.businessDataService
      ? await this.businessDataService.getHealth({ agentId: 'data-health-service' })
      : null;
    const githubStatus = this.githubClient?.getStatus?.();
    const sources = this.dataSourceRegistry.list().map((source) => {
      const connected = source.id === 'github'
        ? Boolean(githubStatus?.connected || source.mode === 'mock')
        : source.adapter === 'mock' || dbHealth.connected;
      const mode = source.id === 'github'
        ? (githubStatus?.mode || 'mock')
        : ['leads', 'quotes', 'orders'].includes(source.id) && businessData
          ? (businessData.mode === 'real_read_only' ? 'real_read_only' : 'mock')
          : source.mode;
      return {
        id: source.id,
        enabled: source.enabled,
        mode,
        connected,
        lastCheckedAt: now,
        error: source.enabled ? undefined : 'disabled_by_feature_flag',
      };
    });
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
    if (!githubStatus?.connected) warnings.push('GitHub real read-only source is unavailable; fixture data is used.');
    if (businessData?.warnings?.length) warnings.push(...businessData.warnings);
    return {
      status: warnings.length > 1 ? 'degraded' : 'healthy',
      mode: this.mode,
      sources,
      ecosystemServices,
      businessData,
      warnings,
    };
  }
}

module.exports = {
  DataHealthService,
};
