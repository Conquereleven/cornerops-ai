const { CONTROLLED_ACTION_IDS, context, createDemoHarness } = require('./controlled-actions-demo-harness');

const run = async () => {
  const harness = createDemoHarness();
  const payload = { title: 'Manual payment audit IDs', body: 'Show audit IDs in the internal manual-payment view.' };
  const draft = await harness.executor.createDraft(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, payload, context('dev-codex-github-agent', 'demo-action-1'));
  const requested = await harness.executor.requestApproval(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, payload, context('dev-codex-github-agent', 'demo-action-1'));
  await harness.approvalService.approveApproval(requested.approvalId, 'founder-demo');
  const executed = await harness.executor.executeApproval(requested.approvalId, { dryRun: true, operatorId: 'founder-demo' });
  const duplicate = await harness.executor.executeApproval(requested.approvalId, { dryRun: true, operatorId: 'founder-demo' });
  const realRequest = await harness.executor.requestApproval(CONTROLLED_ACTION_IDS.GITHUB_ISSUE_CREATE, { ...payload, title: 'Real attempt stays blocked' }, context('dev-codex-github-agent', 'demo-action-2'));
  await harness.approvalService.approveApproval(realRequest.approvalId, 'founder-demo');
  let realBlocked;
  try {
    await harness.executor.executeApproval(realRequest.approvalId, { dryRun: false, operatorId: 'founder-demo' });
  } catch (error) {
    realBlocked = error.code;
  }
  const result = {
    actions: harness.executor.status().actions.map((action) => action.id),
    draft: draft.status,
    approval: requested.approvalId,
    dryRunExecution: executed.status,
    duplicatePrevented: duplicate.duplicate,
    realExecutionBlocked: realBlocked,
    auditEvents: harness.auditLogService.list().length,
    credentialsUsed: false,
    externalSideEffects: 0,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
};

if (require.main === module) run().catch((error) => { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; });
module.exports = { run };
