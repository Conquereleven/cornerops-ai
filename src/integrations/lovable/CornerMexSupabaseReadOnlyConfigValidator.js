const { serviceRoleLike } = require('./CornerMexLovableConfigValidator');
const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');

class CornerMexSupabaseReadOnlyConfigValidator {
  constructor({ config = {} } = {}) {
    this.config = config;
  }

  validate() {
    const missing = [
      ...(!this.config.cornermexSupabaseUrl ? ['CORNERMEX_SUPABASE_URL'] : []),
      ...(!this.config.cornermexSupabaseAnonKey ? ['CORNERMEX_SUPABASE_ANON_KEY'] : []),
      ...(!this.config.cornermexSupabaseSchema ? ['CORNERMEX_SUPABASE_SCHEMA'] : []),
    ];
    const unsafe = [
      ...(this.config.cornermexSupabaseReadOnly === false ? ['CORNERMEX_SUPABASE_READ_ONLY must be true.'] : []),
      ...(this.config.cornermexSupabaseAllowWrites === true ? ['CORNERMEX_SUPABASE_ALLOW_WRITES must be false.'] : []),
      ...(this.config.cornermexSupabaseBlockMutations === false ? ['CORNERMEX_SUPABASE_BLOCK_MUTATIONS must be true.'] : []),
      ...(this.config.cornermexSupabaseServiceRoleKeyBlocked === false ? ['CORNERMEX_SUPABASE_SERVICE_ROLE_KEY_BLOCKED must be true.'] : []),
      ...(serviceRoleLike(this.config.cornermexSupabaseAnonKey) ? ['Service-role-like Supabase key detected; use anon/publishable read-only key only.'] : []),
    ];
    const maxRows = Math.max(1, Math.min(Number(this.config.cornermexSupabaseMaxRows) || 50, 1000));
    const queryTimeoutMs = Math.max(100, Math.min(
      Number(this.config.cornermexSupabaseRequestTimeoutMs || this.config.cornermexSupabaseQueryTimeoutMs) || 8000,
      30000,
    ));
    const realReady = Boolean(
      this.config.cornermexSupabaseEnabled
      && this.config.cornermexSupabaseUrl
      && this.config.cornermexSupabaseAnonKey
      && !unsafe.length,
    );
    return {
      status: unsafe.length ? LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG
        : realReady ? LOVABLE_SOURCE_MODES.REAL_READ_ONLY
        : missing.length ? LOVABLE_SOURCE_MODES.REPO_DISCOVERED
        : LOVABLE_SOURCE_MODES.REPO_DISCOVERED,
      safe: unsafe.length === 0,
      enabled: Boolean(this.config.cornermexSupabaseEnabled),
      missing,
      unsafe,
      readOnlyFlags: {
        readOnly: this.config.cornermexSupabaseReadOnly !== false,
        allowWrites: Boolean(this.config.cornermexSupabaseAllowWrites),
        blockMutations: this.config.cornermexSupabaseBlockMutations !== false,
        auditReads: this.config.cornermexSupabaseAuditReads !== false,
        piiMasking: this.config.cornermexSupabasePiiMasking !== false,
        serviceRoleKeyBlocked: this.config.cornermexSupabaseServiceRoleKeyBlocked !== false,
      },
      limits: { maxRows, queryTimeoutMs },
      secrets: {
        urlPresent: Boolean(this.config.cornermexSupabaseUrl),
        anonKeyPresent: Boolean(this.config.cornermexSupabaseAnonKey),
        anonKeyPrinted: false,
        serviceRoleKeySuspected: serviceRoleLike(this.config.cornermexSupabaseAnonKey),
      },
      schema: this.config.cornermexSupabaseSchema || 'public',
      schemaDiscoveryEnabled: Boolean(this.config.cornermexSupabaseSchemaDiscoveryEnabled),
    };
  }
}

module.exports = { CornerMexSupabaseReadOnlyConfigValidator };
