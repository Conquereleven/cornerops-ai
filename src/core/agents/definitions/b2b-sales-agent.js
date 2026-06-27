const {
  AGENT_DOMAINS,
  AGENT_IDS,
  AGENT_PACK_VERSION,
  CHANNELS,
  PERMISSION_LEVELS,
} = require('../agentTypes');

module.exports = {
  id: AGENT_IDS.B2B_SALES,
  name: 'B2B Sales Agent',
  version: AGENT_PACK_VERSION,
  description: 'Draft-only B2B sales support for CornerMex accounts and leads.',
  domain: AGENT_DOMAINS.SALES,
  enabled: true,
  allowedChannels: CHANNELS,
  allowedTools: [
    'read_leads',
    'read_contacts',
    'draft_message',
    'draft_email',
    'create_task_pending_approval',
    'cornerops.note.create',
    'cornerops.task.create',
  ],
  permissionLevel: PERMISSION_LEVELS.DRAFT_ONLY,
  requiresHumanApprovalFor: ['send_message', 'send_email', 'create_task'],
  systemPromptPath: 'src/core/agents/prompts/b2b-sales-agent.md',
  fallbackAgentId: AGENT_IDS.DAILY_BRIEFING,
};
