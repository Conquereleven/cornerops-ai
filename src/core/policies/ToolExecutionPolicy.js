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

class ToolExecutionPolicy {
  evaluateAction(action = {}) {
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
  ToolExecutionPolicy,
};
