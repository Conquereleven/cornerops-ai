const { AGENT_IDS } = require('../agents/agentTypes');
const { WORKFLOW_IDS } = require('./workflowTypes');

const coreWorkflows = Object.freeze([
  {
    id: WORKFLOW_IDS.DAILY_BRIEFING,
    name: 'Daily briefing',
    agentId: AGENT_IDS.DAILY_BRIEFING,
    description: 'Read-only daily operating summary and priorities.',
  },
  {
    id: WORKFLOW_IDS.B2B_FOLLOW_UP,
    name: 'B2B follow-up',
    agentId: AGENT_IDS.B2B_SALES,
    description: 'Draft-only B2B lead and account follow-up.',
  },
  {
    id: WORKFLOW_IDS.QUOTES_ORDERS_REVIEW,
    name: 'Quotes and orders review',
    agentId: AGENT_IDS.QUOTES_ORDERS,
    description: 'Quotes, orders and payment state review with approval gates.',
  },
  {
    id: WORKFLOW_IDS.GITHUB_CODEX_DRAFT,
    name: 'GitHub/Codex draft',
    agentId: AGENT_IDS.DEV_CODEX_GITHUB,
    description: 'Draft issues, PR descriptions and Codex prompts.',
  },
  {
    id: WORKFLOW_IDS.SECURITY_AUDIT_REVIEW,
    name: 'Security audit review',
    agentId: AGENT_IDS.SECURITY_AUDIT,
    description: 'Read-only review of audit logs, rejected actions and config risk.',
  },
]);

class WorkflowRegistry {
  constructor({ workflows = coreWorkflows } = {}) {
    this.workflows = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  }

  list() {
    return [...this.workflows.values()].map((workflow) => ({ ...workflow }));
  }

  get(id) {
    const workflow = this.workflows.get(id);
    return workflow ? { ...workflow } : null;
  }

  has(id) {
    return this.workflows.has(id);
  }
}

module.exports = {
  WorkflowRegistry,
  coreWorkflows,
};
