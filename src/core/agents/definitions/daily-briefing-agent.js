const {
  AGENT_DOMAINS,
  AGENT_IDS,
  AGENT_PACK_VERSION,
  CHANNELS,
  PERMISSION_LEVELS,
} = require('../agentTypes');

module.exports = {
  id: AGENT_IDS.DAILY_BRIEFING,
  name: 'Daily Briefing Agent',
  version: AGENT_PACK_VERSION,
  description: 'Read-only executive daily operations briefing for CornerMex.',
  domain: AGENT_DOMAINS.BRIEFING,
  enabled: true,
  allowedChannels: CHANNELS,
  allowedTools: [
    'read_tasks',
    'read_leads',
    'read_quotes',
    'read_orders',
    'read_calendar',
  ],
  permissionLevel: PERMISSION_LEVELS.READ_ONLY,
  requiresHumanApprovalFor: ['create_task', 'send_message', 'send_email'],
  systemPromptPath: 'src/core/agents/prompts/daily-briefing-agent.md',
  fallbackAgentId: AGENT_IDS.ROUTER,
};
