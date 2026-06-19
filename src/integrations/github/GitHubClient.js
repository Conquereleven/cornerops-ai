const { createHash, createHmac, timingSafeEqual } = require('crypto');

const idempotencyKeyForIssue = ({ title = '', body = '', requestId = '' } = {}) =>
  createHash('sha256')
    .update(`${title}:${requestId}:${body}`)
    .digest('hex')
    .slice(0, 24);

class GitHubClient {
  constructor({
    adapter,
    approvalService,
    auditLogService,
    config = {},
    fetchImpl = globalThis.fetch,
    octopoolRelay,
  } = {}) {
    this.adapter = adapter;
    this.approvalService = approvalService;
    this.auditLogService = auditLogService;
    this.config = {
      allowIssueCreation: false,
      allowPrWrite: false,
      allowWorkflowTrigger: false,
      dryRun: true,
      enabled: false,
      firstRealSource: 'github',
      firstRealSourceMode: 'read_only',
      readOnly: true,
      realSourceOnboardingEnabled: false,
      ...config,
    };
    this.fetchImpl = fetchImpl;
    this.octopoolRelay = octopoolRelay;
  }

  async listIssues(filters = {}, context = {}) {
    if (this.canUseRealReads()) {
      const params = new URLSearchParams({
        state: filters.state || 'open',
        per_page: String(Math.min(Number(filters.limit) || 100, 100)),
      });
      const issues = await this.request(`/repos/${this.repoPath()}/issues?${params}`, context);
      const result = issues.filter((issue) => !issue.pull_request);
      await this.auditRead('listIssues', context, result.length);
      return result;
    }
    if (this.octopoolRelay && this.config.octopoolEnabled) {
      const result = await this.octopoolRelay.listIssues(filters, context);
      await this.auditRead('listIssues', context, result.length, 'octopool');
      return result;
    }
    const result = this.adapter.listGitHubIssues()
      .filter((issue) => !filters.state || issue.state === filters.state);
    await this.auditRead('listIssues', context, result.length, 'mock');
    return result;
  }

  async getIssue(issueNumber, context = {}) {
    if (this.canUseRealReads()) {
      const result = await this.request(`/repos/${this.repoPath()}/issues/${encodeURIComponent(issueNumber)}`, context);
      await this.auditRead('getIssue', context, 1);
      return result;
    }
    const issues = await this.listIssues({}, context);
    return issues.find((issue) => Number(issue.number) === Number(issueNumber)) || null;
  }

  async createIssueDraft(input = {}) {
    return {
      status: 'draft',
      title: input.title,
      body: input.body || '',
      labels: input.labels || [],
      idempotencyKey: idempotencyKeyForIssue(input),
      dryRun: true,
    };
  }

  async createIssue(input = {}, approvalId) {
    const draft = await this.createIssueDraft(input);
    if (this.config.readOnly) {
      return {
        ...draft,
        status: 'denied',
        message: 'GITHUB_READ_ONLY=true; GitHub writes are blocked.',
      };
    }
    if (!this.config.allowIssueCreation) {
      return {
        ...draft,
        status: 'denied',
        message: 'GITHUB_ALLOW_ISSUE_CREATION=false; issue creation is blocked.',
      };
    }
    if (this.config.dryRun) {
      return {
        ...draft,
        status: 'dry_run',
        message: 'GITHUB_DRY_RUN=true; no real GitHub issue was created.',
      };
    }
    if (!approvalId) {
      const approval = await this.approvalService.requestApproval({
        actionType: 'create_github_issue',
        toolName: 'createGitHubIssueTool',
        payload: draft,
        requestId: input.requestId,
        userId: input.userId,
        channel: input.channel || 'internal',
      });
      return {
        ...draft,
        status: 'needs_approval',
        approvalId: approval.id,
      };
    }
    const approval = await this.approvalService?.getApproval(approvalId);
    if (!approval || approval.status !== 'approved') {
      return {
        ...draft,
        status: 'needs_approval',
        approvalId,
        message: 'Approved approvalId is required before creating a real issue.',
      };
    }
    return {
      ...draft,
      status: 'not_implemented',
      message: 'Real issue creation is intentionally not wired in v0.1.',
    };
  }

  async listPullRequests(filters = {}, context = {}) {
    if (this.canUseRealReads()) {
      const params = new URLSearchParams({
        state: filters.state || 'open',
        per_page: String(Math.min(Number(filters.limit) || 100, 100)),
      });
      const result = await this.request(`/repos/${this.repoPath()}/pulls?${params}`, context);
      await this.auditRead('listPullRequests', context, result.length);
      return result;
    }
    if (this.octopoolRelay && this.config.octopoolEnabled) {
      const result = await this.octopoolRelay.listPullRequests(filters, context);
      await this.auditRead('listPullRequests', context, result.length, 'octopool');
      return result;
    }
    const result = this.adapter.listGitHubPullRequests()
      .filter((pr) => !filters.state || pr.state === filters.state);
    await this.auditRead('listPullRequests', context, result.length, 'mock');
    return result;
  }

  async getPullRequest(prNumber, context = {}) {
    if (this.canUseRealReads()) {
      const result = await this.request(`/repos/${this.repoPath()}/pulls/${encodeURIComponent(prNumber)}`, context);
      await this.auditRead('getPullRequest', context, 1);
      return result;
    }
    const prs = await this.listPullRequests({}, context);
    return prs.find((pr) => Number(pr.number) === Number(prNumber)) || null;
  }

  async listWorkflowRuns(filters = {}, context = {}) {
    if (this.canUseRealReads()) {
      const params = new URLSearchParams({ per_page: String(Math.min(Number(filters.limit) || 100, 100)) });
      if (filters.branch) params.set('branch', filters.branch);
      const response = await this.request(`/repos/${this.repoPath()}/actions/runs?${params}`, context);
      const result = response.workflow_runs || [];
      await this.auditRead('listWorkflowRuns', context, result.length);
      return result;
    }
    if (this.octopoolRelay && this.config.octopoolEnabled) {
      const result = await this.octopoolRelay.listWorkflowRuns(filters, context);
      await this.auditRead('listWorkflowRuns', context, result.length, 'octopool');
      return result;
    }
    const result = this.adapter.listGitHubWorkflowRuns()
      .filter((run) => !filters.branch || run.branch === filters.branch);
    await this.auditRead('listWorkflowRuns', context, result.length, 'mock');
    return result;
  }

  async getWorkflowRun(runId, context = {}) {
    if (this.canUseRealReads()) {
      const result = await this.request(`/repos/${this.repoPath()}/actions/runs/${encodeURIComponent(runId)}`, context);
      await this.auditRead('getWorkflowRun', context, 1);
      return result;
    }
    const runs = await this.listWorkflowRuns({}, context);
    return runs.find((run) => String(run.id) === String(runId)) || null;
  }

  async getRepositoryMetadata(context = {}) {
    if (this.canUseRealReads()) {
      const result = await this.request(`/repos/${this.repoPath()}`, context);
      await this.auditRead('getRepositoryMetadata', context, 1);
      return result;
    }
    await this.auditRead('getRepositoryMetadata', context, 0, 'mock');
    return {
      name: this.config.repo || 'cornerops-ai',
      owner: this.config.owner || 'unknown',
      source: 'mock',
    };
  }

  async updateIssue() {
    return this.blockedWrite('GitHub issue updates');
  }

  async mergePullRequest() {
    return this.blockedWrite('GitHub pull request writes');
  }

  async triggerWorkflow() {
    return this.blockedWrite('GitHub workflow triggers');
  }

  blockedWrite(operation) {
    return {
      status: 'denied',
      dryRun: true,
      message: `${operation} are disabled for the v0.3 read-only beta.`,
    };
  }

  canUseRealReads() {
    return Boolean(
      this.config.enabled
      && this.config.realSourceOnboardingEnabled
      && this.config.firstRealSource === 'github'
      && this.config.firstRealSourceMode === 'read_only'
      && this.config.readOnly
      && this.config.token
      && this.config.owner
      && this.config.repo
      && this.fetchImpl,
    );
  }

  repoPath() {
    return `${encodeURIComponent(this.config.owner)}/${encodeURIComponent(this.config.repo)}`;
  }

  async request(path, context = {}) {
    let response;
    try {
      response = await this.fetchImpl(`https://api.github.com${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.config.token}`,
          'X-GitHub-Api-Version': this.config.apiVersion || '2022-11-28',
          'User-Agent': 'cornerops-ai-read-only',
          'X-CornerOps-Request-Id': context.requestId || 'cornerops-read',
        },
      });
    } catch (cause) {
      const error = new Error('GitHub read failed; CornerOps remains available in degraded mode.');
      error.code = 'GITHUB_NETWORK_ERROR';
      error.cause = cause;
      await this.auditFailure(context, path, error);
      throw error;
    }
    if (!response.ok) {
      const remaining = response.headers?.get?.('x-ratelimit-remaining');
      if ((response.status === 403 && remaining === '0') || response.status === 429) {
        const error = new Error('GitHub API rate limit reached.');
        error.code = 'GITHUB_RATE_LIMIT';
        error.resetAt = response.headers?.get?.('x-ratelimit-reset');
        await this.auditFailure(context, path, error);
        throw error;
      }
      try {
        this.handleErrorStatus(response.status);
      } catch (error) {
        await this.auditFailure(context, path, error);
        throw error;
      }
    }
    return response.json();
  }

  async auditRead(operation, context, count, source = 'github') {
    await this.auditLogService?.record({
      ...context,
      eventType: 'data_read',
      dataSource: 'github',
      operation,
      output: { count, source },
      policyDecision: 'allowed',
      status: 'success',
    });
  }

  async auditFailure(context, operation, error) {
    await this.auditLogService?.record({
      ...context,
      eventType: 'data_read',
      dataSource: 'github',
      operation,
      policyDecision: 'denied',
      status: 'error',
      errorCode: error.code,
      errorMessage: error.message,
    });
  }

  getStatus() {
    const configured = Boolean(this.config.token && this.config.owner && this.config.repo);
    const warnings = [];
    if (!this.config.enabled) warnings.push('GitHub integration is disabled.');
    if (this.config.enabled && !configured) warnings.push('GitHub credentials or repository configuration are missing; mock data is used.');
    if (!this.config.realSourceOnboardingEnabled) warnings.push('Real-source onboarding is disabled.');
    if (!this.config.readOnly) warnings.push('GitHub is not in read-only mode.');
    return {
      enabled: Boolean(this.config.enabled),
      readOnly: Boolean(this.config.readOnly),
      connected: this.canUseRealReads(),
      mode: this.canUseRealReads() ? 'read_only' : 'mock',
      repo: this.config.owner && this.config.repo
        ? `${this.config.owner}/${this.config.repo}`
        : undefined,
      warnings,
    };
  }

  handleErrorStatus(status) {
    if ([401, 403, 404, 422].includes(Number(status))) {
      const error = new Error(`GitHub API returned ${status}.`);
      error.code = `GITHUB_${status}`;
      throw error;
    }
    if (Number(status) >= 500) {
      const error = new Error('GitHub API server error.');
      error.code = 'GITHUB_5XX';
      throw error;
    }
  }

  verifyWebhookSignature({ body = '', signature = '', secret = this.config.webhookSecret } = {}) {
    if (!secret || !signature) return false;
    const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    return expectedBuffer.length === signatureBuffer.length
      && timingSafeEqual(expectedBuffer, signatureBuffer);
  }
}

module.exports = {
  GitHubClient,
  idempotencyKeyForIssue,
};
