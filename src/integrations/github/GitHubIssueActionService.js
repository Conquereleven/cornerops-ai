const { createActionError } = require('../../core/actions/actionTypes');
const { validateGitHubIssuePayload } = require('../../core/actions/payloadValidation');

class GitHubIssueActionService {
  constructor({ config = {}, fetchImpl = globalThis.fetch } = {}) {
    this.config = config;
    this.fetchImpl = fetchImpl;
  }

  createDraft(payload) {
    return {
      status: 'draft',
      dryRun: true,
      payload: validateGitHubIssuePayload(payload, { allowedLabels: this.config.githubAllowedIssueLabels || [] }),
    };
  }

  async execute(payload) {
    const draft = this.createDraft(payload);
    const enabled = this.config.githubEnabled === true
      && this.config.corneropsControlledActionsEnabled === true
      && this.config.corneropsControlledActionsDryRun === false
      && this.config.corneropsControlledActionsRequireApproval === true
      && this.config.corneropsControlledActionsFailClosed === true
      && this.config.githubReadOnly === false
      && this.config.githubDryRun === false
      && this.config.githubAllowIssueCreation === true
      && this.config.corneropsActionGithubIssueCreateEnabled === true
      && this.config.corneropsActionGithubIssueCreateDryRun === false
      && this.config.corneropsActionGithubIssueCreateRequireApproval === true;
    if (!enabled) throw createActionError('Real GitHub issue creation is blocked by configuration.', 'GITHUB_ISSUE_REAL_EXECUTION_BLOCKED', 403);
    if (!this.config.githubToken || !this.config.githubOwner || !this.config.githubRepo || !this.fetchImpl) {
      throw createActionError('GitHub credentials or repository configuration are missing.', 'GITHUB_ISSUE_CONFIGURATION_MISSING', 503);
    }
    const response = await this.fetchImpl(
      `https://api.github.com/repos/${encodeURIComponent(this.config.githubOwner)}/${encodeURIComponent(this.config.githubRepo)}/issues`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.config.githubToken}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': this.config.githubApiVersion || '2022-11-28',
          'User-Agent': 'cornerops-ai-controlled-actions',
        },
        body: JSON.stringify({
          title: draft.payload.title,
          body: draft.payload.body,
          labels: draft.payload.labels,
          assignees: draft.payload.assignees,
        }),
      },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw createActionError(`GitHub issue creation failed with HTTP ${response.status}.`, 'GITHUB_ISSUE_CREATE_FAILED', 502);
    }
    return {
      status: 'executed',
      dryRun: false,
      externalResourceId: String(result.id || result.number || ''),
      externalUrl: result.html_url,
    };
  }
}

module.exports = { GitHubIssueActionService };
