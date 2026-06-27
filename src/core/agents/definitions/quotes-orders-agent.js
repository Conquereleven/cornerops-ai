const {
  AGENT_DOMAINS,
  AGENT_IDS,
  AGENT_PACK_VERSION,
  PERMISSION_LEVELS,
} = require('../agentTypes');

module.exports = {
  id: AGENT_IDS.QUOTES_ORDERS,
  name: 'Quotes Orders Agent',
  version: AGENT_PACK_VERSION,
  description: 'Quotes, orders, payment-state and manual operations assistant.',
  domain: AGENT_DOMAINS.ORDERS,
  enabled: true,
  allowedChannels: ['slack', 'web', 'internal'],
  allowedTools: [
    'read_quotes',
    'read_orders',
    'draft_message',
    'propose_order_status_change',
    'propose_payment_mark_paid',
    'cornerops.note.create',
    'cornerops.task.create',
  ],
  permissionLevel: PERMISSION_LEVELS.APPROVAL_REQUIRED,
  requiresHumanApprovalFor: [
    'change_order_status',
    'mark_order_paid',
    'create_internal_note',
  ],
  systemPromptPath: 'src/core/agents/prompts/quotes-orders-agent.md',
  fallbackAgentId: AGENT_IDS.DAILY_BRIEFING,
};
