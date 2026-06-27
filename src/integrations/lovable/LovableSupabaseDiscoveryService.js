const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');

class LovableSupabaseDiscoveryService {
  constructor({ config = {} } = {}) {
    this.config = config;
  }

  async discover() {
    const configured = Boolean(this.config.cornermexSupabaseEnabled
      && this.config.cornermexSupabaseUrl
      && this.config.cornermexSupabaseAnonKey);
    const writesBlocked = this.config.cornermexSupabaseReadOnly !== false
      && this.config.cornermexSupabaseAllowWrites !== true;
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
      sourceMode: configured && writesBlocked ? LOVABLE_SOURCE_MODES.REAL_READ_ONLY : LOVABLE_SOURCE_MODES.MOCK,
      schemaDiscoveryEnabled: false,
      migrationsEnabled: false,
      mutationMethodsBlocked: ['insert', 'update', 'delete', 'upsert', 'rpc'],
      entities: configured ? ['product', 'lead', 'quote', 'order', 'customer', 'payment'] : [],
      flows: configured ? ['read_only_supabase_contract_discovery'] : [],
      warnings,
    };
  }
}

module.exports = { LovableSupabaseDiscoveryService };
