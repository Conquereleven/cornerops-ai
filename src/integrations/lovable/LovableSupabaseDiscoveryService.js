const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');

class LovableSupabaseDiscoveryService {
  constructor({ config = {}, migrationDiscoveryService } = {}) {
    this.config = config;
    this.migrationDiscoveryService = migrationDiscoveryService;
  }

  async discover() {
    const migrationDiscovery = this.migrationDiscoveryService?.discover
      ? await this.migrationDiscoveryService.discover()
      : null;
    const configured = Boolean(this.config.cornermexSupabaseEnabled
      && this.config.cornermexSupabaseUrl
      && this.config.cornermexSupabaseAnonKey);
    const writesBlocked = this.config.cornermexSupabaseReadOnly !== false
      && this.config.cornermexSupabaseAllowWrites !== true
      && this.config.cornermexSupabaseBlockMutations !== false;
    const warnings = [];
    if (!configured) warnings.push('CornerMex Supabase read-only config is missing; using mock data.');
    if (!writesBlocked) warnings.push('CRITICAL: CornerMex Supabase write flags are enabled.');
    return {
      configured,
      urlConfigured: Boolean(this.config.cornermexSupabaseUrl),
      anonKeyConfigured: Boolean(this.config.cornermexSupabaseAnonKey),
      secretsExposed: false,
      schema: this.config.cornermexSupabaseSchema || 'public',
      readOnly: this.config.cornermexSupabaseReadOnly !== false,
      writesBlocked,
      allowWrites: Boolean(this.config.cornermexSupabaseAllowWrites),
      maxRows: this.config.cornermexSupabaseMaxRows || 100,
      queryTimeoutMs: this.config.cornermexSupabaseQueryTimeoutMs || 10000,
      sourceMode: !writesBlocked
        ? LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG
        : configured && writesBlocked ? LOVABLE_SOURCE_MODES.REAL_READ_ONLY
        : migrationDiscovery?.mode === LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED ? LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED
        : LOVABLE_SOURCE_MODES.MOCK,
      schemaDiscoveryEnabled: Boolean(this.config.cornermexSupabaseSchemaDiscoveryEnabled),
      migrationsEnabled: Boolean(migrationDiscovery?.migrationFileCount),
      migrationDiscovery,
      mutationMethodsBlocked: ['insert', 'update', 'delete', 'upsert', 'rpc'],
      tablesDiscovered: configured && this.config.cornermexSupabaseSchemaDiscoveryEnabled
        ? ['products', 'leads', 'quotes', 'orders', 'customers', 'payments']
        : migrationDiscovery?.tables || [],
      mappingConfidence: !writesBlocked ? 'blocked'
        : configured && writesBlocked && this.config.cornermexSupabaseSchemaDiscoveryEnabled ? 'high'
        : migrationDiscovery?.confidence || (configured && writesBlocked ? 'medium' : 'low'),
      piiRisk: configured ? 'medium_high_masked' : 'mock_only',
      entities: configured ? ['product', 'lead', 'quote', 'order', 'customer', 'payment'] : [],
      flows: configured ? ['read_only_supabase_contract_discovery'] : [],
      warnings,
    };
  }
}

module.exports = { LovableSupabaseDiscoveryService };
