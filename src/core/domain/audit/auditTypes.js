const AUDIT_EVENT_TYPES = Object.freeze([
  'agent_request',
  'tool_invocation',
  'data_read',
  'data_write_proposed',
  'data_write_approved',
  'data_write_rejected',
  'github_issue_draft',
  'github_issue_created',
  'approval_requested',
  'approval_approved',
  'approval_rejected',
  'security_denied',
  'sync_started',
  'sync_completed',
  'sync_failed',
  'openclaw_ecosystem_service_invoked',
  'openclaw_skill_review_requested',
  'openclaw_skill_approved',
  'openclaw_skill_disabled',
]);

module.exports = {
  AUDIT_EVENT_TYPES,
};
