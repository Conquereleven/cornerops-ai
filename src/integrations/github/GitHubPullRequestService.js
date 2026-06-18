class GitHubPullRequestService {
  constructor({ client } = {}) {
    this.client = client;
  }

  listPullRequests(filters, context) {
    return this.client.listPullRequests(filters, context);
  }

  getPullRequest(prNumber, context) {
    return this.client.getPullRequest(prNumber, context);
  }
}

module.exports = {
  GitHubPullRequestService,
};
