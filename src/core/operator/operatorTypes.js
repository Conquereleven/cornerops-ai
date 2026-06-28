const OPERATOR_CHANNELS = Object.freeze(['cli', 'api', 'web', 'openclaw']);
const OPERATOR_STATUSES = Object.freeze([
  'success',
  'needs_approval',
  'denied',
  'dry_run',
  'error',
]);
const OPERATOR_SOURCE_MODES = Object.freeze(['mock', 'read_only', 'real_read_only', 'mixed', 'disabled']);

const OPERATOR_INTENTS = Object.freeze({
  APPROVAL_ACTION: 'approval_action',
  AUDIT_SUMMARY: 'audit_summary',
  B2B_LEADS_FOLLOWUP: 'b2b_leads_followup',
  B2B_MESSAGE_DRAFT: 'b2b_message_draft',
  BRIEFING: 'briefing',
  CONTEXT_HEALTH: 'context_health',
  CONTROL_TOWER_STATUS: 'control_tower_status',
  CONTROLLED_ACTIONS_STATUS: 'controlled_actions_status',
  CORNERMEX_STATUS: 'cornermex_status',
  CREATE_GITHUB_ISSUE_DRAFT: 'create_github_issue_draft',
  CREATE_INTERNAL_TASK_DRAFT: 'create_internal_task_draft',
  DATA_HEALTH: 'data_health',
  DRAFT_EMAIL_FOLLOW_UP: 'draft_email_follow_up',
  DRAFT_WHATSAPP_FOLLOW_UP: 'draft_whatsapp_follow_up',
  FLOWS_STATUS: 'flows_status',
  FORBIDDEN_EXTERNAL_ACTION: 'forbidden_external_action',
  FORBIDDEN_WRITE: 'forbidden_write',
  GITHUB_ENGINEERING_SUMMARY: 'github_engineering_summary',
  HELP: 'help',
  MANUAL_PAYMENTS_REVIEW: 'manual_payments_review',
  ORDERS_REVIEW: 'orders_review',
  PRODUCT_ISSUES: 'product_issues',
  PENDING_APPROVALS: 'pending_approvals',
  QUOTES_REVIEW: 'quotes_review',
  SECURITY_AUDIT_SUMMARY: 'security_audit_summary',
  SUPABASE_STATUS: 'supabase_status',
  UNKNOWN: 'unknown',
});

module.exports = {
  OPERATOR_CHANNELS,
  OPERATOR_INTENTS,
  OPERATOR_SOURCE_MODES,
  OPERATOR_STATUSES,
};
