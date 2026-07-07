const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');

const hasValue = (value) => String(value || '').trim().length > 0;

const serviceRoleLike = (value = '') =>
  /service[_-]?role/i.test(String(value))
  || /^sb_secret_/i.test(String(value))
  || /^eyJ/.test(String(value)) && /service_role/i.test(String(value));

class CornerMexLovableConfigValidator {
  constructor({ config = {} } = {}) {
    this.config = config;
  }

  validate() {
    const config = this.config;
    const projectUrlConfigured = hasValue(config.cornermexLovableProjectUrl);
    const projectNameConfigured = hasValue(config.cornermexLovableProjectName);
    const deploymentUrlConfigured = hasValue(config.cornermexLovableDeploymentUrl);
    const repoConfigured = hasValue(config.cornermexLovableGithubRepo);
    const supabaseEnabled = Boolean(config.cornermexSupabaseEnabled);
    const supabaseUrlConfigured = hasValue(config.cornermexSupabaseUrl);
    const supabaseAnonKeyConfigured = hasValue(config.cornermexSupabaseAnonKey);
    const supabaseConfigured = Boolean(supabaseEnabled && supabaseUrlConfigured && supabaseAnonKeyConfigured);
    const readOnlyFlags = {
      lovableReadOnly: config.cornermexLovableReadOnly !== false,
      lovableDryRun: config.cornermexLovableDryRun !== false,
      supabaseReadOnly: config.cornermexSupabaseReadOnly !== false,
      supabaseAllowWrites: Boolean(config.cornermexSupabaseAllowWrites),
      connectorAuditReads: config.corneropsCornermexConnectorAuditReads !== false,
      connectorPiiMasking: config.corneropsCornermexConnectorPiiMasking !== false,
    };
    const missing = [];
    if (!projectUrlConfigured && !projectNameConfigured) missing.push('CORNERMEX_LOVABLE_PROJECT_URL or CORNERMEX_LOVABLE_PROJECT_NAME');
    if (!repoConfigured) missing.push('CORNERMEX_LOVABLE_GITHUB_REPO');
    if (!deploymentUrlConfigured) missing.push('CORNERMEX_LOVABLE_DEPLOYMENT_URL');
    if (!supabaseUrlConfigured) missing.push('CORNERMEX_SUPABASE_URL');
    if (!supabaseAnonKeyConfigured) missing.push('CORNERMEX_SUPABASE_ANON_KEY');
    const unsafe = [];
    if (!readOnlyFlags.lovableReadOnly) unsafe.push('CORNERMEX_LOVABLE_READ_ONLY must be true');
    if (!readOnlyFlags.lovableDryRun) unsafe.push('CORNERMEX_LOVABLE_DRY_RUN must be true');
    if (!readOnlyFlags.supabaseReadOnly) unsafe.push('CORNERMEX_SUPABASE_READ_ONLY must be true');
    if (readOnlyFlags.supabaseAllowWrites) unsafe.push('CORNERMEX_SUPABASE_ALLOW_WRITES must be false');
    if (!readOnlyFlags.connectorAuditReads) unsafe.push('CORNEROPS_CORNERMEX_CONNECTOR_AUDIT_READS must be true');
    if (!readOnlyFlags.connectorPiiMasking) unsafe.push('CORNEROPS_CORNERMEX_CONNECTOR_PII_MASKING must be true');
    if (serviceRoleLike(config.cornermexSupabaseAnonKey)) unsafe.push('CORNERMEX_SUPABASE_ANON_KEY looks like a service-role key; use anon/read-only only');
    const maxRows = Number(config.cornermexSupabaseMaxRows) || 100;
    const queryTimeoutMs = Number(config.cornermexSupabaseQueryTimeoutMs) || 10000;
    if (maxRows < 1 || maxRows > 1000) unsafe.push('CORNERMEX_SUPABASE_MAX_ROWS must be between 1 and 1000');
    if (queryTimeoutMs < 100 || queryTimeoutMs > 30000) unsafe.push('CORNERMEX_SUPABASE_QUERY_TIMEOUT_MS must be between 100 and 30000');
    const repoCandidate = repoConfigured && readOnlyFlags.lovableReadOnly;
    const realReadOnlyCandidate = supabaseConfigured
      && readOnlyFlags.supabaseReadOnly
      && !readOnlyFlags.supabaseAllowWrites
      && !serviceRoleLike(config.cornermexSupabaseAnonKey);
    const mode = realReadOnlyCandidate
      ? LOVABLE_SOURCE_MODES.REAL_READ_ONLY
      : repoCandidate ? LOVABLE_SOURCE_MODES.REPO_DISCOVERED
        : (projectUrlConfigured || projectNameConfigured) ? LOVABLE_SOURCE_MODES.MOCK : LOVABLE_SOURCE_MODES.MISSING_CONFIG;
    return {
      status: unsafe.length ? 'blocked' : missing.length ? 'missing_config' : 'ready',
      sourceModeCandidate: mode,
      canReachRepoDiscovered: repoCandidate && unsafe.length === 0,
      canReachRealReadOnly: realReadOnlyCandidate && unsafe.length === 0,
      configCompleteness: {
        project: projectUrlConfigured || projectNameConfigured,
        deployment: deploymentUrlConfigured,
        repo: repoConfigured,
        supabase: supabaseConfigured,
        schema: hasValue(config.cornermexSupabaseSchema),
      },
      readOnlyFlags,
      limits: { maxRows, queryTimeoutMs },
      missing,
      unsafe,
      secrets: {
        supabaseAnonKeyPresent: supabaseAnonKeyConfigured,
        supabaseAnonKeyPrinted: false,
        serviceRoleKeySuspected: serviceRoleLike(config.cornermexSupabaseAnonKey),
      },
      nextSteps: this.nextSteps({ repoConfigured, supabaseConfigured, unsafe, missing }),
    };
  }

  nextSteps({ repoConfigured, supabaseConfigured, unsafe, missing }) {
    if (unsafe.length) return ['Fix unsafe read-only/write-blocking flags before enabling real discovery.'];
    if (!repoConfigured) return ['Set CORNERMEX_LOVABLE_GITHUB_REPO to reach repo_discovered mode.'];
    if (!supabaseConfigured) return ['Set CORNERMEX_SUPABASE_URL and CORNERMEX_SUPABASE_ANON_KEY to prepare real_read_only mode.'];
    if (missing.length) return ['Complete optional Lovable project/deployment metadata for better operator context.'];
    return ['Run npm run demo:v1.1.2 and review Control Tower before trusting real read-only data.'];
  }
}

module.exports = { CornerMexLovableConfigValidator, serviceRoleLike };
