class GitHubActionsService {
  constructor({ client } = {}) {
    this.client = client;
  }

  listWorkflowRuns(filters, context) {
    return this.client.listWorkflowRuns(filters, context);
  }

  getWorkflowRun(runId, context) {
    return this.client.getWorkflowRun(runId, context);
  }
}

module.exports = {
  GitHubActionsService,
};
