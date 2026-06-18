const workflows = [
  'daily-briefing.workflow',
  'b2b-followup.workflow',
  'quotes-orders-review.workflow',
  'github-triage.workflow',
  'security-audit.workflow',
  'data-health-check.workflow',
].map((id) => ({
  id,
  description: `${id.replace('.workflow', '').replace(/-/g, ' ')} dry-run workflow`,
  trigger: 'manual',
  steps: ['read data', 'apply policy', 'prepare draft output', 'audit'],
  requiredDataSources: ['leads', 'quotes', 'orders', 'github', 'audit_logs'],
  requiredTools: [],
  approvalPoints: ['writes', 'external messages', 'runner execution'],
  riskLevel: id.includes('github') ? 'medium' : 'low',
}));

class LobsterWorkflowShellAdapter {
  constructor({ registry, policy } = {}) {
    this.registry = registry;
    this.policy = policy;
  }

  evaluate(operation, context = {}) {
    return this.policy.evaluate({
      agentId: context.agentId,
      operation,
      service: this.registry.get('lobster'),
    });
  }

  async listWorkflows(context = {}) {
    const decision = this.evaluate('listWorkflows', context);
    return decision.allowed ? workflows.map((workflow) => ({ ...workflow })) : [];
  }

  async dryRunWorkflow(input = {}, context = {}) {
    const decision = this.evaluate('dryRunWorkflow', context);
    const workflow = workflows.find((item) => item.id === input.workflowId) || workflows[0];
    return {
      status: decision.allowed ? 'dry_run' : 'denied',
      workflow,
      dryRunOutput: decision.allowed
        ? `Workflow ${workflow.id} simulated. No external action executed.`
        : decision.reason,
    };
  }

  async proposeWorkflow(input = {}, context = {}) {
    const decision = this.evaluate('proposeWorkflow', context);
    return {
      status: decision.allowed ? 'dry_run' : 'denied',
      proposal: {
        id: input.id || 'custom.workflow',
        description: input.description || 'Proposed workflow',
        steps: input.steps || [],
      },
      message: decision.allowed ? 'Workflow proposal captured for review.' : decision.reason,
    };
  }
}

module.exports = {
  LobsterWorkflowShellAdapter,
  workflows,
};
