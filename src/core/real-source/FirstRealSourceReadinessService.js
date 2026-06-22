class FirstRealSourceReadinessService {
  constructor({ databaseAdapter, githubClient, selector } = {}) {
    this.databaseAdapter = databaseAdapter;
    this.githubClient = githubClient;
    this.selector = selector;
  }

  async getBusinessDbReadiness() {
    const health = await this.databaseAdapter.health();
    const credentialsPresent = Boolean(this.databaseAdapter.config?.credentialsAvailable);
    const ready = health.mode === 'real_read_only' && health.readOnlyVerified;
    const warnings = [...(health.warnings || [])];
    if (!credentialsPresent) {
      warnings.push(
        this.databaseAdapter.config?.provider === 'supabase'
          ? 'Missing SUPABASE_URL and/or SUPABASE_READONLY_KEY.'
          : 'Missing READONLY_DATABASE_URL or an implemented read-only provider adapter.',
      );
    }
    return {
      source: 'business_db',
      ready,
      mode: ready ? 'read_only' : 'mock',
      readOnlyVerified: Boolean(health.readOnlyVerified),
      credentialsPresent,
      provider: health.configuredProvider || health.provider,
      warnings: [...new Set(warnings)],
    };
  }

  getGitHubReadiness() {
    const status = this.githubClient.getStatus();
    const credentialsPresent = Boolean(
      this.githubClient.config?.token
      && this.githubClient.config?.owner
      && this.githubClient.config?.repo,
    );
    const warnings = [...(status.warnings || [])];
    if (!credentialsPresent) warnings.push('Missing GITHUB_TOKEN, GITHUB_OWNER and/or GITHUB_REPO.');
    return {
      source: 'github',
      ready: Boolean(status.connected && status.readOnly),
      mode: status.connected ? 'read_only' : 'mock',
      readOnlyVerified: Boolean(status.readOnly),
      credentialsPresent,
      repo: status.repo,
      warnings: [...new Set(warnings)],
    };
  }

  async getReport() {
    const businessDb = await this.getBusinessDbReadiness();
    const github = this.getGitHubReadiness();
    return {
      ...this.selector.select({ businessDb, github }),
      businessDb,
      github,
    };
  }
}

module.exports = { FirstRealSourceReadinessService };
