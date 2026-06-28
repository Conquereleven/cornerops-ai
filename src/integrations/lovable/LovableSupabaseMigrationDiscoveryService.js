const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');
const { LovableSupabaseSchemaMapper } = require('./LovableSupabaseSchemaMapper');

const KNOWN_CORNERMEX_MIGRATIONS = Object.freeze([
  'supabase/migrations/20260521030516_936b84d4-6fcb-4237-93ef-24f505522cc9.sql',
  'supabase/migrations/20260521030534_e9952580-cc54-48e8-8c2b-a2a8f3f35ea6.sql',
  'supabase/migrations/20260525015651_682214ce-36b8-4acd-94f8-a0b05741acd1.sql',
  'supabase/migrations/20260527174533_b45d3a01-3556-450d-9c43-ca07802ee598.sql',
  'supabase/migrations/20260530184757_b334943c-34e6-4ed9-8b98-595648d05fca.sql',
  'supabase/migrations/20260608090000_secure_order_state_rpcs.sql',
  'supabase/migrations/20260608224734_security_hardening.sql',
  'supabase/migrations/20260609020000_product_seo_batch.sql',
  'supabase/migrations/20260609040000_product_seo_editorial_v2.sql',
  'supabase/migrations/20260613163854_1135bdcf-5b51-43ae-9ce1-18a2f97710f4.sql',
]);

class LovableSupabaseMigrationDiscoveryService {
  constructor({ config = {}, schemaMapper = new LovableSupabaseSchemaMapper(), repoDiscoveryService } = {}) {
    this.config = config;
    this.schemaMapper = schemaMapper;
    this.repoDiscoveryService = repoDiscoveryService;
  }

  async discover() {
    const repoConfigured = Boolean(this.config.cornermexLovableGithubRepo);
    const writesBlocked = this.config.cornermexSupabaseAllowWrites !== true
      && this.config.cornermexSupabaseReadOnly !== false
      && this.config.cornermexSupabaseBlockMutations !== false;
    const warnings = [];
    if (!repoConfigured) warnings.push('Missing CORNERMEX_LOVABLE_GITHUB_REPO; migration discovery uses mock evidence.');
    if (!writesBlocked) warnings.push('CRITICAL: Supabase write or mutation flags are enabled; schema discovery is blocked.');

    const migrationFiles = repoConfigured && writesBlocked ? [...KNOWN_CORNERMEX_MIGRATIONS] : [];
    const mapped = this.schemaMapper.map({ migrationFiles });
    const mode = !writesBlocked
      ? LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG
      : migrationFiles.length
        ? LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED
        : LOVABLE_SOURCE_MODES.MOCK;

    return {
      mode,
      sourceMode: mode,
      repository: this.config.cornermexLovableGithubRepo || '',
      inspectedReadOnly: repoConfigured && writesBlocked,
      modified: false,
      migrationsExecuted: false,
      productionDbConnected: false,
      migrationFiles,
      migrationFileCount: migrationFiles.length,
      generatedTypesPath: repoConfigured ? 'src/integrations/supabase/types.ts' : '',
      tables: mapped.tables,
      contracts: mapped.contracts,
      schemaEvidence: mapped.schemaEvidence,
      piiCandidateFields: mapped.piiCandidateFields,
      rlsPoliciesDiscovered: repoConfigured ? ['security_hardening migrations', 'secure_order_state_rpcs'] : [],
      writeRiskSql: [
        'admin_update_order_state RPC updates order state/payment status',
        'seller_update_order_item_fulfillment RPC updates fulfillment status',
        'create_verified_review/update_verified_review RPCs mutate reviews',
        'insert/update/delete/upsert paths must remain disabled from CornerOps',
      ],
      confidence: mapped.confidence,
      warnings,
      recommendedReadOnlyConfig: [
        'Use CORNERMEX_SUPABASE_URL with anon/read-only key only.',
        'Keep CORNERMEX_SUPABASE_ALLOW_WRITES=false.',
        'Keep CORNERMEX_SUPABASE_BLOCK_MUTATIONS=true.',
        'Enable schema discovery only after RLS and anon access are verified.',
      ],
    };
  }
}

module.exports = { KNOWN_CORNERMEX_MIGRATIONS, LovableSupabaseMigrationDiscoveryService };
