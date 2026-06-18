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
    config = {},
    octopoolRelay,
  } = {}) {
    this.adapter = adapter;
    this.approvalService = approvalService;
    this.config = config;
    this.octopoolRelay = octopoolRelay;
  }

  async listIssues(filters = {}, context = {}) {
    if (this.octopoolRelay && this.config.octopoolEnabled) {
      return this.octopoolRelay.listIssues(filters, context);
    }
    return this.adapter.listGitHubIssues().filter((issue) => !filters.state || issue.state === filters.state);
  }

  async getIssue(issueNumber, context = {}) {
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
    const approval = await this.approvalService.getApproval(approvalId);
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
    if (this.octopoolRelay && this.config.octopoolEnabled) {
      return this.octopoolRelay.listPullRequests(filters, context);
    }
    return this.adapter.listGitHubPullRequests().filter((pr) => !filters.state || pr.state === filters.state);
  }

  async getPullRequest(prNumber, context = {}) {
    const prs = await this.listPullRequests({}, context);
    return prs.find((pr) => Number(pr.number) === Number(prNumber)) || null;
  }

  async listWorkflowRuns(filters = {}, context = {}) {
    if (this.octopoolRelay && this.config.octopoolEnabled) {
      return this.octopoolRelay.listWorkflowRuns(filters, context);
    }
    return this.adapter.listGitHubWorkflowRuns().filter((run) => !filters.branch || run.branch === filters.branch);
  }

  async getWorkflowRun(runId, context = {}) {
    const runs = await this.listWorkflowRuns({}, context);
    return runs.find((run) => String(run.id) === String(runId)) || null;
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
