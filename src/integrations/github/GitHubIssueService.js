class GitHubIssueService {
  constructor({ client } = {}) {
    this.client = client;
  }

  listIssues(filters, context) {
    return this.client.listIssues(filters, context);
  }

  createIssueDraft(input) {
    return this.client.createIssueDraft(input);
  }

  createIssue(input, approvalId) {
    return this.client.createIssue(input, approvalId);
  }
}

module.exports = {
  GitHubIssueService,
};
