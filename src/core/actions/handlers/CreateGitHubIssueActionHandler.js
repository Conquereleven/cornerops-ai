const { validateGitHubIssuePayload } = require('../payloadValidation');

class CreateGitHubIssueActionHandler {
  constructor({ service } = {}) {
    this.service = service;
  }

  createDraft(payload) {
    return this.service.createDraft(payload);
  }

  async execute(payload, { dryRun } = {}) {
    const clean = validateGitHubIssuePayload(payload, {
      allowedLabels: this.service.config.githubAllowedIssueLabels || [],
    });
    if (dryRun) return { status: 'dry_run_executed', dryRun: true, payload: clean };
    return this.service.execute(clean);
  }
}

module.exports = { CreateGitHubIssueActionHandler };
