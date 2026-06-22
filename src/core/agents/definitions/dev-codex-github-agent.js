const {
  AGENT_DOMAINS,
  AGENT_IDS,
  AGENT_PACK_VERSION,
  PERMISSION_LEVELS,
} = require('../agentTypes');

module.exports = {
  id: AGENT_IDS.DEV_CODEX_GITHUB,
  name: 'Dev Codex GitHub Agent',
  version: AGENT_PACK_VERSION,
  description: 'Technical drafting assistant for Codex, GitHub, PRs, issues and docs.',
  domain: AGENT_DOMAINS.DEV,
  enabled: true,
  allowedChannels: ['slack', 'telegram', 'web', 'internal'],
  allowedTools: [
    'read_github',
    'draft_issue',
    'draft_pr_description',
    'create_issue_pending_approval',
  ],
  permissionLevel: PERMISSION_LEVELS.APPROVAL_REQUIRED,
  requiresHumanApprovalFor: ['create_issue', 'merge_pr', 'deploy'],
  systemPromptPath: 'src/core/agents/prompts/dev-codex-github-agent.md',
  fallbackAgentId: AGENT_IDS.DAILY_BRIEFING,
};
