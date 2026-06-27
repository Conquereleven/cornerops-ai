const { CONTROLLED_ACTION_IDS, context, createDemoHarness } = require('./controlled-actions-demo-harness');

const run = async () => {
  const harness = createDemoHarness();
  const payload = { title: 'Fix manual payment audit IDs', body: 'Draft generated locally with no GitHub credentials.' };
  const draft = await harness.executor.createDraft(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, payload, context('dev-codex-github-agent', 'demo-github-1'));
  const request = await harness.executor.requestApproval(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, payload, context('dev-codex-github-agent', 'demo-github-1'));
  await harness.approvalService.approveApproval(request.approvalId, 'founder-demo');
  const execution = await harness.executor.executeApproval(request.approvalId, { dryRun: true, operatorId: 'founder-demo' });
  const result = {
    draft: draft.status,
    approvalStatus: 'approved',
    executionStatus: execution.status,
    realGitHubIssueCreated: false,
    realExecutionFlagsEnabled: false,
    auditId: execution.auditId,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
};

if (require.main === module) run().catch((error) => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
module.exports = { run };
