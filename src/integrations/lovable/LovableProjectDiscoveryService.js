const { LOVABLE_SOURCE_MODES } = require('./lovableTypes');

class LovableProjectDiscoveryService {
  constructor({ config = {}, repoDiscoveryService, supabaseDiscoveryService } = {}) {
    this.config = config;
    this.repoDiscoveryService = repoDiscoveryService;
    this.supabaseDiscoveryService = supabaseDiscoveryService;
  }

  async discover() {
    const projectConfigured = Boolean(this.config.cornermexLovableProjectUrl || this.config.cornermexLovableProjectName);
    const repo = await this.repoDiscoveryService.discover();
    const supabase = await this.supabaseDiscoveryService.discover();
    const warnings = [];
    if (!projectConfigured) warnings.push('Missing CORNERMEX_LOVABLE_PROJECT_URL and CORNERMEX_LOVABLE_PROJECT_NAME.');
    if (!this.config.cornermexLovableGithubRepo) warnings.push('Missing CORNERMEX_LOVABLE_GITHUB_REPO.');
    if (!this.config.cornermexSupabaseUrl || !this.config.cornermexSupabaseAnonKey) {
      warnings.push('Missing CORNERMEX_SUPABASE_URL and/or CORNERMEX_SUPABASE_ANON_KEY.');
    }
    const sourceMode = supabase.sourceMode === LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG
      ? LOVABLE_SOURCE_MODES.BLOCKED_UNSAFE_CONFIG
      : supabase.sourceMode === LOVABLE_SOURCE_MODES.REAL_READ_ONLY
      ? LOVABLE_SOURCE_MODES.REAL_READ_ONLY
      : supabase.sourceMode === LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED
        ? LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED
      : repo.sourceMode === LOVABLE_SOURCE_MODES.REPO_DISCOVERED
        ? LOVABLE_SOURCE_MODES.REPO_DISCOVERED
        : projectConfigured ? LOVABLE_SOURCE_MODES.MOCK : LOVABLE_SOURCE_MODES.MISSING_CONFIG;
    return {
      project: {
        configured: projectConfigured,
        urlConfigured: Boolean(this.config.cornermexLovableProjectUrl),
        nameConfigured: Boolean(this.config.cornermexLovableProjectName),
        deploymentConfigured: Boolean(this.config.cornermexLovableDeploymentUrl),
        url: this.config.cornermexLovableProjectUrl ? '[configured]' : '',
        name: this.config.cornermexLovableProjectName || '',
      },
      enabled: Boolean(this.config.cornermexLovableEnabled),
      discoveryMode: this.config.cornermexLovableDiscoveryMode || 'mock',
      readOnly: this.config.cornermexLovableReadOnly !== false,
      dryRun: this.config.cornermexLovableDryRun !== false,
      sourceMode,
      repo,
      supabase,
      entities: [...new Set([...(repo.entities || []), ...(supabase.entities || [])])],
      flows: [...new Set([...(repo.flows || []), ...(supabase.flows || [])])],
      warnings: [...new Set([...warnings, ...(repo.warnings || []), ...(supabase.warnings || [])])],
      risks: [
        'Discovery is using mock/template data until founder configuration is provided.',
        'Repo discovery cannot prove production database schema.',
        'Supabase reads require anon/read-only credentials and write flags disabled.',
      ],
      nextSteps: [
        projectConfigured ? 'Lovable project URL/name configured.' : 'Provide Lovable project URL/name.',
        this.config.cornermexLovableGithubRepo ? 'Lovable-connected GitHub repo configured.' : 'Provide the connected GitHub repository URL if available.',
        supabase.sourceMode === LOVABLE_SOURCE_MODES.SCHEMA_DISCOVERED
          ? 'Add Supabase URL and anon/read-only key, verify RLS, then run cornermex:supabase-read-only-check.'
          : 'Provide Supabase URL and anon/read-only key if available.',
        'Share Lovable .env.example and known schema/table names if available.',
      ],
    };
  }
}

module.exports = { LovableProjectDiscoveryService };
