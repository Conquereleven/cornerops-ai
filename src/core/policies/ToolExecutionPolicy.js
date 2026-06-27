const FORBIDDEN_ACTION_TYPES = new Set([
  'delete_database',
  'bulk_delete_files',
  'send_payment',
  'refund_payment',
  'change_credentials',
  'expose_secret',
  'run_destructive_command',
  'auto_contact_external_party',
  'auto_publish_external_content',
]);

const KNOWN_ACTION_TYPES = new Set([
  'read_leads', 'read_quotes', 'read_orders', 'read_tasks',
  'draft_message', 'mark_order_paid', 'change_order_status',
  'draft_issue', 'create_issue', 'read_audit_logs',
  'create_internal_note', 'create_internal_task',
  'read_agent_logs', 'read_config_summary',
  ...FORBIDDEN_ACTION_TYPES,
]);

class ToolExecutionPolicy {
  evaluateAction(action = {}) {
    if (!action.type || !KNOWN_ACTION_TYPES.has(action.type)) {
      return {
        allowed: false,
        requiresApproval: false,
        decision: 'denied',
        reason: 'Unknown action type; fail-closed policy denied execution.',
      };
    }
    if (action.riskLevel && !['low', 'medium', 'high', 'critical'].includes(action.riskLevel)) {
      return {
        allowed: false,
        requiresApproval: false,
        decision: 'denied',
        reason: 'Unknown tool risk; fail-closed policy denied execution.',
      };
    }
    if (action.destructive || FORBIDDEN_ACTION_TYPES.has(action.type)) {
      return {
        allowed: false,
        requiresApproval: false,
        decision: 'denied',
        reason: 'Destructive or forbidden action.',
      };
    }
    if (action.requiresApproval) {
      return {
        allowed: true,
        requiresApproval: true,
        decision: 'requires_approval',
        reason: 'Sensitive action requires human approval.',
      };
    }
    return {
      allowed: true,
      requiresApproval: false,
      decision: action.mutates ? 'draft_only' : 'allowed',
      reason: action.mutates
        ? 'Mutating action remains draft-only.'
        : 'Read-only action allowed.',
    };
  }
}

module.exports = {
  FORBIDDEN_ACTION_TYPES,
  KNOWN_ACTION_TYPES,
  ToolExecutionPolicy,
};
