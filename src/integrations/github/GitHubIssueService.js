class GitHubIssueService {
  constructor({ client } = {}) {
    this.client = client;
  }

  listIssues(filters, context) {
    return this.client.listIssues(filters, context);
  }

  getIssue(issueNumber, context) {
    return this.client.getIssue(issueNumber, context);
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
