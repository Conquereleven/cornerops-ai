const {
  AGENT_DOMAINS,
  AGENT_IDS,
  AGENT_PACK_VERSION,
  PERMISSION_LEVELS,
} = require('../agentTypes');

module.exports = {
  id: AGENT_IDS.SECURITY_AUDIT,
  name: 'Security Audit Agent',
  version: AGENT_PACK_VERSION,
  description: 'Read-only security, audit log and policy review assistant.',
  domain: AGENT_DOMAINS.SECURITY,
  enabled: true,
  allowedChannels: ['slack', 'web', 'internal'],
  allowedTools: [
    'read_audit_logs',
    'read_agent_logs',
    'read_config_summary',
  ],
  permissionLevel: PERMISSION_LEVELS.READ_ONLY,
  requiresHumanApprovalFor: ['change_config', 'delete_logs', 'rotate_secret'],
  systemPromptPath: 'src/core/agents/prompts/security-audit-agent.md',
  fallbackAgentId: AGENT_IDS.DAILY_BRIEFING,
};
