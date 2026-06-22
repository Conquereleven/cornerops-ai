const APPROVAL_TYPES = Object.freeze([
  'send_message',
  'create_github_issue',
  'update_lead_status',
  'add_order_note',
  'order_status_change',
  'mark_manual_payment_paid',
  'create_calendar_event',
  'run_script',
  'run_crabox_suite',
  'run_lobster_workflow',
  'approve_clawhub_skill',
  'disable_clawhub_skill',
]);

module.exports = {
  APPROVAL_TYPES,
};
