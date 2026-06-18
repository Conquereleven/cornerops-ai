const path = require('path');

const loadFixture = (fixturePath) =>
  require(path.resolve(__dirname, '../../../..', fixturePath));

class MockDataAdapter {
  constructor({ fixturesRoot = 'tests/fixtures' } = {}) {
    this.fixturesRoot = fixturesRoot;
  }

  clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  load(relativePath) {
    return this.clone(loadFixture(path.join(this.fixturesRoot, relativePath)));
  }

  listLeads() {
    return this.load('leads/leads.sample.json');
  }

  listQuotes() {
    return this.load('quotes/quotes.sample.json');
  }

  listOrders() {
    return this.load('orders/orders.sample.json');
  }

  listGitHubIssues() {
    return this.load('github/issues.sample.json');
  }

  listGitHubPullRequests() {
    return this.load('github/pull-requests.sample.json');
  }

  listGitHubWorkflowRuns() {
    return this.load('github/workflow-runs.sample.json');
  }

  listAuditLogs() {
    return this.load('audit/audit-logs.sample.json');
  }

  listApprovals() {
    return this.load('approvals/approvals.sample.json');
  }

  listOpenClawServices() {
    return this.load('openclaw-ecosystem/services.sample.json');
  }

  listClawHubSkills() {
    return this.load('openclaw-ecosystem/skills.sample.json');
  }
}

module.exports = {
  MockDataAdapter,
};
