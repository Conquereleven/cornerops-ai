const { controlledActionExecutor } = require('../../core/actions');

const actions = async () => {
  const status = controlledActionExecutor.status();
  const lines = status.actions.map((action) =>
    `- ${action.id} | ${action.enabled ? 'enabled' : 'disabled'} | ${action.defaultMode} | risk=${action.riskLevel}`);
  return {
    status: 'success',
    responseText: [
      `Controlled Actions v0.9 | enabled=${status.enabled} | dryRun=${status.dryRun} | approval=${status.requireApproval}`,
      ...lines,
      `Idempotency: ${status.idempotency.healthy ? 'healthy' : 'unavailable'}`,
    ].join('\n'),
  };
};

module.exports = { actions };
