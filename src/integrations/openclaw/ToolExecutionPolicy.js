const { POLICY_DECISIONS } = require('./types');

const READ_ONLY_ACTIONS = new Set([
  'read_tasks',
  'summarize',
  'read_calendar',
  'read_leads',
  'read_orders',
  'read_suppliers',
  'read_documents',
  'daily_briefing',
]);

const DRAFT_ONLY_ACTIONS = new Set([
  'draft_email',
  'draft_whatsapp',
  'draft_proposal',
  'draft_supplier_reply',
  'draft_customer_update',
]);

const CONFIRMATION_ACTIONS = new Set([
  'send_email',
  'send_whatsapp',
  'create_calendar_event',
  'modify_lead',
  'change_order_status',
  'create_human_task',
  'create_issue',
  'create_pull_request',
  'run_script',
]);

const ADMIN_ACTIONS = new Set([
  'change_configuration',
  'deploy',
  'rotate_secret',
  'modify_permissions',
  'connect_channel',
  'activate_tool',
]);

const FORBIDDEN_ACTIONS = new Set([
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
  constructor({ requireApproval = true, allowedTools = [] } = {}) {
    this.requireApproval = requireApproval;
    this.allowedTools = new Set(allowedTools);
  }

  evaluate({ actionType = 'unknown', toolName, userRole = 'operator' } = {}) {
    if (this.allowedTools.size && toolName && !this.allowedTools.has(toolName)) {
      return this.deny(actionType, toolName, 'Tool is not in OPENCLAW_ALLOWED_TOOLS.');
    }
    if (FORBIDDEN_ACTIONS.has(actionType)) {
      return this.deny(actionType, toolName, 'Action is forbidden by default.');
    }
    if (ADMIN_ACTIONS.has(actionType)) {
      if (userRole === 'admin') {
        return this.decision(
          this.requireApproval
            ? POLICY_DECISIONS.REQUIRES_CONFIRMATION
            : POLICY_DECISIONS.ALLOWED,
          actionType,
          toolName,
          'Admin action requires controlled approval.',
        );
      }
      return this.deny(actionType, toolName, 'Admin-only action.');
    }
    if (READ_ONLY_ACTIONS.has(actionType)) {
      return this.decision(
        POLICY_DECISIONS.ALLOWED,
        actionType,
        toolName,
        'Read-only action allowed.',
      );
    }
    if (DRAFT_ONLY_ACTIONS.has(actionType)) {
      return this.decision(
        POLICY_DECISIONS.DRAFT_ONLY,
        actionType,
        toolName,
        'Draft-only action; no external send.',
      );
    }
    if (CONFIRMATION_ACTIONS.has(actionType)) {
      return this.decision(
        this.requireApproval
          ? POLICY_DECISIONS.REQUIRES_CONFIRMATION
          : POLICY_DECISIONS.ALLOWED,
        actionType,
        toolName,
        'Sensitive action requires approval.',
      );
    }
    return this.decision(
      POLICY_DECISIONS.REQUIRES_CONFIRMATION,
      actionType,
      toolName,
      'Unknown actions require confirmation by default.',
    );
  }

  deny(actionType, toolName, reason) {
    return this.decision(POLICY_DECISIONS.DENIED, actionType, toolName, reason);
  }

  decision(policyDecision, actionType, toolName, reason) {
    return {
      actionType,
      toolName,
      policyDecision,
      allowed: policyDecision !== POLICY_DECISIONS.DENIED,
      requiresApproval: policyDecision === POLICY_DECISIONS.REQUIRES_CONFIRMATION,
      draftOnly: policyDecision === POLICY_DECISIONS.DRAFT_ONLY,
      reason,
    };
  }
}

module.exports = {
  ToolExecutionPolicy,
};
