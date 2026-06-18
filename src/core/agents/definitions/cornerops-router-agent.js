const {
  AGENT_DOMAINS,
  AGENT_IDS,
  AGENT_PACK_VERSION,
  CHANNELS,
  PERMISSION_LEVELS,
} = require('../agentTypes');

module.exports = {
  id: AGENT_IDS.ROUTER,
  name: 'CornerOps Router Agent',
  version: AGENT_PACK_VERSION,
  description: 'Central intent, domain and risk router for CornerOps AI.',
  domain: AGENT_DOMAINS.ROUTING,
  enabled: true,
  allowedChannels: CHANNELS,
  allowedTools: [],
  permissionLevel: PERMISSION_LEVELS.READ_ONLY,
  requiresHumanApprovalFor: [],
  systemPromptPath: 'src/core/agents/prompts/cornerops-router-agent.md',
  fallbackAgentId: AGENT_IDS.DAILY_BRIEFING,
};
