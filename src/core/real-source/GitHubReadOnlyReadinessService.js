const { SOURCE_MODES } = require('./sourceMode');

const safeRepo = (owner, repo) => owner && repo ? `${owner}/${repo}` : 'not_configured';

class GitHubReadOnlyReadinessService {
  constructor({ client, config = {} } = {}) {
    this.client = client;
    this.config = config;
  }

  getStaticStatus() {
    const status = this.client?.getStatus?.() || {};
    const credentialsPresent = Boolean(this.config.githubToken && this.config.githubOwner && this.config.githubRepo);
    const writeFlags = {
      issueCreation: Boolean(this.config.githubAllowIssueCreation),
      prWrite: Boolean(this.config.githubAllowPrWrite),
      workflowTrigger: Boolean(this.config.githubAllowWorkflowTrigger),
    };
    const writesBlocked = !writeFlags.issueCreation && !writeFlags.prWrite && !writeFlags.workflowTrigger;
    const readOnlyVerified = this.config.githubReadOnly !== false && writesBlocked;
    const canUseRealReadOnly = Boolean(
      this.config.githubEnabled
      && credentialsPresent
      && readOnlyVerified
      && (
        this.config.corneropsGithubRealReadOnlyEnabled
        || this.config.corneropsRealSourceOnboardingEnabled
        || this.config.corneropsFirstRealSourceEnabled
      )
      && this.config.corneropsGithubAuditReads !== false
      && this.client?.canUseRealReads?.()
    );
    const warnings = [];
    if (!this.config.githubEnabled) warnings.push('GITHUB_ENABLED=false; GitHub is using mock/readiness mode.');
    if (!credentialsPresent) warnings.push('Missing GITHUB_TOKEN, GITHUB_OWNER and/or GITHUB_REPO.');
    if (!this.config.githubReadOnly) warnings.push('CRITICAL: GITHUB_READ_ONLY=false.');
    if (!writesBlocked) warnings.push('CRITICAL: one or more GitHub write flags are enabled.');
    if (this.config.corneropsGithubAuditReads === false) warnings.push('CRITICAL: GitHub read auditing is disabled.');
    if (!canUseRealReadOnly) warnings.push(...(status.warnings || []));
    return {
      source: 'github',
      enabled: Boolean(this.config.githubEnabled),
      credentialsPresent,
      tokenPresent: credentialsPresent,
      tokenExposed: false,
      repo: safeRepo(this.config.githubOwner, this.config.githubRepo),
      readOnly: this.config.githubReadOnly !== false,
      dryRun: this.config.githubDryRun !== false,
      auditReads: this.config.corneropsGithubAuditReads !== false,
      writesBlocked,
      writeFlags,
      readOnlyVerified,
      connected: canUseRealReadOnly,
      mode: canUseRealReadOnly ? SOURCE_MODES.REAL_READ_ONLY : SOURCE_MODES.MOCK,
      status: canUseRealReadOnly ? 'ready' : 'mock_ready',
      rateLimit: { checked: false, remaining: null, resetAt: null },
      warnings: [...new Set(warnings)],
    };
  }

  async check({ testReads = true, limit = 10, requestId = 'github-read-only-check' } = {}) {
    const base = this.getStaticStatus();
    if (!base.connected || !testReads) {
      return {
        ...base,
        checkedReads: false,
        sampleCounts: { repository: 0, issues: 0, pullRequests: 0, workflowRuns: 0 },
        setupInstructions: this.setupInstructions(base),
      };
    }
    try {
      const context = { requestId, agentId: 'github-read-only-check', channel: 'internal' };
      const [repository, issues, pullRequests, workflowRuns] = await Promise.all([
        this.client.getRepositoryMetadata(context),
        this.client.listIssues({ state: 'open', limit }, context),
        this.client.listPullRequests({ state: 'open', limit }, context),
        this.client.listWorkflowRuns({ limit }, context),
      ]);
      return {
        ...base,
        checkedReads: true,
        status: 'ready',
        mode: SOURCE_MODES.REAL_READ_ONLY,
        sampleCounts: {
          repository: repository ? 1 : 0,
          issues: issues.length,
          pullRequests: pullRequests.length,
          workflowRuns: workflowRuns.length,
        },
        setupInstructions: [],
      };
    } catch (error) {
      return {
        ...base,
        connected: false,
        checkedReads: true,
        status: 'degraded',
        mode: SOURCE_MODES.MOCK,
        sampleCounts: { repository: 0, issues: 0, pullRequests: 0, workflowRuns: 0 },
        warnings: [...new Set([...base.warnings, error.code || 'GITHUB_READ_FAILED'])],
        errorCode: error.code || 'GITHUB_READ_FAILED',
        setupInstructions: this.setupInstructions(base),
      };
    }
  }

  setupInstructions(status = this.getStaticStatus()) {
    if (status.connected) return [];
    return [
      'Create a fine-grained GitHub token with read-only repository metadata, issues, pull requests and Actions/workflow run access.',
      'Set GITHUB_ENABLED=true, GITHUB_READ_ONLY=true, GITHUB_DRY_RUN=true, GITHUB_ALLOW_ISSUE_CREATION=false, GITHUB_ALLOW_PR_WRITE=false and GITHUB_ALLOW_WORKFLOW_TRIGGER=false.',
      'Set CORNEROPS_GITHUB_REAL_READ_ONLY_ENABLED=true or CORNEROPS_FIRST_REAL_SOURCE_ENABLED=true to allow real reads.',
      'Never commit the token. Keep it only in a private local/server environment.',
    ];
  }
}

module.exports = { GitHubReadOnlyReadinessService };
