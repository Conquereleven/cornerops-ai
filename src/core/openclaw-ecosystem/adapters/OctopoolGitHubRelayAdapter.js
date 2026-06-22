class OctopoolGitHubRelayAdapter {
  constructor({ adapter, registry, policy } = {}) {
    this.adapter = adapter;
    this.registry = registry;
    this.policy = policy;
  }

  evaluate(operation, context = {}) {
    return this.policy.evaluate({
      agentId: context.agentId,
      operation,
      service: this.registry.get('octopool'),
    });
  }

  async listIssues(filters = {}, context = {}) {
    const decision = this.evaluate('listIssues', context);
    return decision.allowed ? this.adapter.listGitHubIssues().filter((issue) => !filters.state || issue.state === filters.state) : [];
  }

  async listPullRequests(filters = {}, context = {}) {
    const decision = this.evaluate('listPullRequests', context);
    return decision.allowed ? this.adapter.listGitHubPullRequests().filter((pr) => !filters.state || pr.state === filters.state) : [];
  }

  async listWorkflowRuns(filters = {}, context = {}) {
    const decision = this.evaluate('listWorkflowRuns', context);
    return decision.allowed ? this.adapter.listGitHubWorkflowRuns().filter((run) => !filters.branch || run.branch === filters.branch) : [];
  }

  async getRepositorySummary(filters = {}, context = {}) {
    const [issues, pullRequests, workflowRuns] = await Promise.all([
      this.listIssues(filters, context),
      this.listPullRequests(filters, context),
      this.listWorkflowRuns(filters, context),
    ]);
    return {
      serviceId: 'octopool',
      mode: 'read_only',
      issuesOpen: issues.filter((issue) => issue.state === 'open').length,
      pullRequestsOpen: pullRequests.filter((pr) => pr.state === 'open').length,
      failingRuns: workflowRuns.filter((run) => run.conclusion === 'failure').length,
    };
  }
}

module.exports = {
  OctopoolGitHubRelayAdapter,
};
