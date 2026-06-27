const { ask } = require('./ask');
const { controlledActionExecutor } = require('../../core/actions');

const approvals = async (action, id, options) => {
  if (action === 'execute-dry-run' && id) {
    const result = await controlledActionExecutor.executeApproval(id, {
      dryRun: true,
      operatorId: 'local-founder',
    });
    return {
      status: result.status,
      responseText: `Approval ${id} executed in dry-run. Audit: ${result.auditId}. No real side effect occurred.`,
    };
  }
  if (action === 'approve' && id) return ask(`Approve approval ${id}`, options);
  if (action === 'reject' && id) return ask(`Reject approval ${id}`, options);
  return ask('Show pending approvals', options);
};

module.exports = { approvals };
