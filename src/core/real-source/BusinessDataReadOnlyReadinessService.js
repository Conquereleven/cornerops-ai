const { SOURCE_MODES } = require('./sourceMode');

class BusinessDataReadOnlyReadinessService {
  constructor({ adapter, contractRegistry, schemaDiscoveryService, config = {} } = {}) {
    this.adapter = adapter;
    this.contractRegistry = contractRegistry;
    this.schemaDiscoveryService = schemaDiscoveryService;
    this.config = config;
  }

  async check({ testReads = true, requestId = 'business-data-read-only-check' } = {}) {
    const health = await this.adapter.health();
    const credentialsPresent = Boolean(this.adapter.config?.credentialsAvailable);
    const writesBlocked = this.config.corneropsDbAllowWrites !== true && this.config.corneropsDbReadOnly !== false;
    const readOnlyVerified = writesBlocked && Boolean(health.readOnlyVerified);
    const realReady = health.mode === SOURCE_MODES.REAL_READ_ONLY && readOnlyVerified;
    const warnings = [...(health.warnings || [])];
    if (!credentialsPresent) warnings.push('Read-only Business DB/Supabase credentials are missing.');
    if (!writesBlocked) warnings.push('CRITICAL: Business DB write flags are enabled.');
    if (this.config.corneropsDbSchemaDiscoveryEnabled) warnings.push('Schema discovery is enabled; keep this explicit and temporary.');
    const result = {
      source: 'business_db',
      enabled: Boolean(this.config.corneropsBusinessDataEnabled),
      provider: health.configuredProvider || health.provider || this.config.corneropsDatabaseProvider || 'mock',
      credentialsPresent,
      secretsExposed: false,
      mode: realReady ? SOURCE_MODES.REAL_READ_ONLY : SOURCE_MODES.MOCK,
      status: realReady ? 'ready' : 'mock_ready',
      readOnlyVerified,
      writesBlocked,
      dryRun: this.config.corneropsBusinessDataDryRun !== false,
      schemaDiscoveryEnabled: Boolean(this.config.corneropsDbSchemaDiscoveryEnabled),
      rowLimit: this.config.corneropsDbMaxRows || this.adapter.config?.maxRows || 100,
      queryTimeoutMs: this.config.corneropsDbQueryTimeoutMs || this.adapter.config?.queryTimeoutMs || 10000,
      piiMasking: this.config.corneropsDbPiiMasking !== false,
      auditReads: this.config.corneropsDbAuditReads !== false,
      mappedEntities: this.contractRegistry?.listMappings?.() || [],
      dataContractReady: true,
      checkedReads: false,
      sampleCounts: { leads: 0, quotes: 0, orders: 0 },
      warnings: [...new Set(warnings)],
      setupInstructions: this.setupInstructions({ realReady, credentialsPresent }),
    };
    if (!testReads) return result;
    try {
      const context = { requestId, agentId: 'business-data-read-only-check', channel: 'internal' };
      const [leads, quotes, orders] = await Promise.all([
        this.adapter.select({ table: 'leads', limit: 5 }, context),
        this.adapter.select({ table: 'quotes', limit: 5 }, context),
        this.adapter.select({ table: 'orders', limit: 5 }, context),
      ]);
      return {
        ...result,
        checkedReads: true,
        sampleCounts: {
          leads: leads.rows.length,
          quotes: quotes.rows.length,
          orders: orders.rows.length,
        },
      };
    } catch (error) {
      return {
        ...result,
        checkedReads: true,
        status: 'degraded',
        mode: SOURCE_MODES.MOCK,
        errorCode: error.code || 'BUSINESS_DATA_READ_FAILED',
        warnings: [...new Set([...result.warnings, error.code || 'BUSINESS_DATA_READ_FAILED'])],
      };
    }
  }

  setupInstructions({ realReady, credentialsPresent } = {}) {
    if (realReady) return [];
    const instructions = [
      'Keep CORNEROPS_BUSINESS_DATA_MODE=read_only, CORNEROPS_DB_READ_ONLY=true and CORNEROPS_DB_ALLOW_WRITES=false.',
      'Use READONLY_DATABASE_URL or SUPABASE_READONLY_KEY only; never use service-role/admin keys for v1.1.',
      'Keep CORNEROPS_DB_SCHEMA_DISCOVERY_ENABLED=false unless doing an explicit read-only schema inspection.',
    ];
    if (!credentialsPresent) instructions.unshift('Provide read-only Supabase/Postgres credentials in a private environment when ready.');
    return instructions;
  }
}

module.exports = { BusinessDataReadOnlyReadinessService };
