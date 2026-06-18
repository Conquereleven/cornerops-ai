class ContextHealthService {
  constructor({
    archiveRepository,
    contextMode = 'mock',
    crawlerRegistry,
    nativeToolRegistry,
    sdkBridgeRegistry,
    sourceRegistry,
  } = {}) {
    this.archiveRepository = archiveRepository;
    this.contextMode = contextMode;
    this.crawlerRegistry = crawlerRegistry;
    this.nativeToolRegistry = nativeToolRegistry;
    this.sdkBridgeRegistry = sdkBridgeRegistry;
    this.sourceRegistry = sourceRegistry;
  }

  async getReport() {
    const archive = await this.archiveRepository.healthCheck();
    const records = await this.archiveRepository.listRecords();
    const sources = this.sourceRegistry.list().map((source) => {
      const recordCount = records.filter((record) => record.sourceId === source.id).length;
      return {
        id: source.id,
        enabled: source.enabled,
        mode: source.mode,
        recordCount,
        lastSyncAt: recordCount ? records.find((record) => record.sourceId === source.id)?.provenance?.importedAt : undefined,
        piiLevel: source.piiLevel,
        status: source.enabled ? 'available' : 'disabled',
      };
    });
    const warnings = [];
    if (this.contextMode === 'mock') warnings.push('CORNEROPS_CONTEXT_MODE=mock; context comes from fixtures.');
    if (!archive.connected) warnings.push('Local archive DB is not connected; using mock archive adapter.');
    const highPiiSources = sources.filter((source) => source.enabled && source.piiLevel === 'high').length;
    if (highPiiSources) warnings.push(`${highPiiSources} enabled context sources are high PII.`);
    return {
      status: warnings.length > 1 ? 'degraded' : 'healthy',
      mode: this.contextMode,
      archive: {
        path: archive.dbPath,
        connected: archive.connected,
        recordCount: archive.recordCount || records.length,
        lastIndexedAt: archive.lastIndexedAt,
      },
      sources,
      crawlers: this.crawlerRegistry?.list?.() || [],
      nativeTools: this.nativeToolRegistry?.list?.() || [],
      sdkBridges: this.sdkBridgeRegistry?.list?.() || [],
      warnings,
    };
  }
}

module.exports = {
  ContextHealthService,
};
