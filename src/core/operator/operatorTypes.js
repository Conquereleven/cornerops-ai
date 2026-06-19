const OPERATOR_CHANNELS = Object.freeze(['cli', 'api', 'web', 'openclaw']);
const OPERATOR_STATUSES = Object.freeze([
  'success',
  'needs_approval',
  'denied',
  'dry_run',
  'error',
]);
const OPERATOR_SOURCE_MODES = Object.freeze(['mock', 'read_only', 'mixed', 'disabled']);

const OPERATOR_INTENTS = Object.freeze({
  APPROVAL_ACTION: 'approval_action',
  AUDIT_SUMMARY: 'audit_summary',
  B2B_LEADS_FOLLOWUP: 'b2b_leads_followup',
  B2B_MESSAGE_DRAFT: 'b2b_message_draft',
  BRIEFING: 'briefing',
  CONTEXT_HEALTH: 'context_health',
  CONTROL_TOWER_STATUS: 'control_tower_status',
  DATA_HEALTH: 'data_health',
  FORBIDDEN_EXTERNAL_ACTION: 'forbidden_external_action',
  FORBIDDEN_WRITE: 'forbidden_write',
  GITHUB_ENGINEERING_SUMMARY: 'github_engineering_summary',
  HELP: 'help',
  MANUAL_PAYMENTS_REVIEW: 'manual_payments_review',
  ORDERS_REVIEW: 'orders_review',
  PENDING_APPROVALS: 'pending_approvals',
  QUOTES_REVIEW: 'quotes_review',
  SECURITY_AUDIT_SUMMARY: 'security_audit_summary',
  UNKNOWN: 'unknown',
});

module.exports = {
  OPERATOR_CHANNELS,
  OPERATOR_INTENTS,
  OPERATOR_SOURCE_MODES,
  OPERATOR_STATUSES,
};
