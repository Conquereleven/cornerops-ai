#!/usr/bin/env node
const data = require('../src/core/data');

const main = async () => {
  const readiness = await data.githubReadinessService.check({
    testReads: true,
    requestId: `demo-github-read-only-${Date.now()}`,
  });
  const issues = await data.githubIssueService.listIssues({ state: 'open', limit: 5 }, {
    requestId: 'demo-github-read-only-issues',
    agentId: 'dev-codex-github-agent',
    channel: 'internal',
  });
  const pullRequests = await data.githubPullRequestService.listPullRequests({ state: 'open', limit: 5 }, {
    requestId: 'demo-github-read-only-prs',
    agentId: 'dev-codex-github-agent',
    channel: 'internal',
  });
  const workflowRuns = await data.githubActionsService.listWorkflowRuns({ limit: 5 }, {
    requestId: 'demo-github-read-only-workflows',
    agentId: 'dev-codex-github-agent',
    channel: 'internal',
  });
  process.stdout.write(`${JSON.stringify({
    demo: 'github_read_only',
    mode: readiness.mode,
    tokenExposed: false,
    counts: {
      issues: issues.length,
      pullRequests: pullRequests.length,
      workflowRuns: workflowRuns.length,
    },
    writes: {
      createIssue: 'blocked',
      updateIssue: 'blocked',
      comment: 'blocked',
      mergePr: 'blocked',
      triggerWorkflow: 'blocked',
    },
    warnings: readiness.warnings,
    setupInstructions: readiness.setupInstructions,
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`GitHub read-only demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
