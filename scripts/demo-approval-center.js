const data = require('../src/core/data');
const { approvalCenterService } = require('../src/core/control-tower');

const run = async () => {
  const first = await data.approvalService.requestApproval({
    actionType: 'propose_order_status_change',
    createdBy: 'quotes-orders-agent',
    reason: 'Order status changes require founder approval.',
    payload: { orderId: 'masked-demo-order', sourceMode: 'mock' },
  });
  const second = await data.approvalService.requestApproval({
    actionType: 'draft_issue',
    createdBy: 'dev-codex-github-agent',
    reason: 'Issue creation remains controlled.',
    payload: { repository: 'cornerops-ai', sourceMode: 'mock' },
  });
  const before = await approvalCenterService.list();
  const approved = await approvalCenterService.decideDryRun(first.id, 'approve', 'demo-operator');
  const rejected = await approvalCenterService.decideDryRun(second.id, 'reject', 'demo-operator');
  console.log(JSON.stringify({
    pendingBefore: before.summary.pending,
    approved: approved.approval.status,
    rejected: rejected.approval.status,
    realActionsExecuted: approved.executed || rejected.executed,
    safety: 'Approval decisions changed status in memory only.',
  }, null, 2));
  return { approved, before, rejected };
};

if (require.main === module) run().catch((error) => {
  console.error(`Approval Center demo failed safely: ${error.message}`);
  process.exitCode = 1;
});

module.exports = { run };
