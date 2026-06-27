const { AGENT_IDS, CHANNELS, PERMISSION_LEVELS } = require('../agents/agentTypes');
const { ToolExecutionPolicy } = require('./ToolExecutionPolicy');

class AgentPermissionPolicy {
  constructor({
    agentsEnabled = true,
    auditEnabled = true,
    allowedUsers = [],
    dryRun = true,
    requireApproval = true,
    requireAudit = true,
    toolExecutionPolicy = new ToolExecutionPolicy(),
  } = {}) {
    this.agentsEnabled = agentsEnabled;
    this.auditEnabled = auditEnabled;
    this.allowedUsers = new Set(allowedUsers);
    this.dryRun = dryRun;
    this.requireApproval = requireApproval;
    this.requireAudit = requireAudit;
    this.toolExecutionPolicy = toolExecutionPolicy;
    this.knownAgentIds = new Set(Object.values(AGENT_IDS));
  }

  evaluate({ agent, input, proposedActions = [] }) {
    if (!this.agentsEnabled) {
      return this.deny('Agents are disabled by configuration.');
    }
    if (proposedActions.length && this.requireAudit && !this.auditEnabled) {
      return this.deny('Agent tool use denied because audit logging is unavailable.');
    }
    if (!agent || !this.knownAgentIds.has(agent.id) || !agent.enabled) {
      return this.deny('Agent is not enabled.');
    }
    if (!Object.values(PERMISSION_LEVELS).includes(agent.permissionLevel)) {
      return this.deny('Agent permission level is unknown.');
    }
    if (!input || !CHANNELS.includes(input.channel)) {
      return this.deny('Input channel is unknown.');
    }
    if (!agent.allowedChannels.includes(input.channel)) {
      return this.deny(`Channel ${input.channel} is not allowed for ${agent.id}.`);
    }
    if (this.allowedUsers.size && !this.allowedUsers.has(input.userId)) {
      return this.deny('User is not authorized for CornerOps agents.');
    }
    if (agent.permissionLevel === PERMISSION_LEVELS.ADMIN_ONLY) {
      const role = input.userRole || input.metadata?.userRole || 'operator';
      if (role !== 'admin') return this.deny('Agent requires admin role.');
    }

    for (const action of proposedActions) {
      if (action.toolName && !agent.allowedTools.includes(action.toolName)) {
        return this.deny(`Tool ${action.toolName} is not allowed for ${agent.id}.`);
      }
      const actionPolicy = this.toolExecutionPolicy.evaluateAction(action);
      if (!actionPolicy.allowed) return actionPolicy;
      if (
        agent.permissionLevel === PERMISSION_LEVELS.READ_ONLY &&
        action.mutates &&
        !(action.controlledActionId && action.requiresApproval && action.dryRunOnly)
      ) {
        return this.deny(`${agent.id} is read-only and cannot mutate data.`);
      }
      if (
        this.requireApproval &&
        (
          actionPolicy.requiresApproval ||
          agent.requiresHumanApprovalFor.includes(action.type) ||
          (
            agent.permissionLevel === PERMISSION_LEVELS.APPROVAL_REQUIRED &&
            action.mutates
          )
        )
      ) {
        return {
          allowed: true,
          requiresApproval: true,
          decision: 'requires_approval',
          reason: 'Human approval required by agent permission policy.',
        };
      }
    }

    if (agent.permissionLevel === PERMISSION_LEVELS.DRAFT_ONLY) {
      return {
        allowed: true,
        requiresApproval: false,
        decision: 'draft_only',
        reason: 'Draft-only agent; no external send or mutation.',
        dryRun: this.dryRun,
      };
    }
    return {
      allowed: true,
      requiresApproval: false,
      decision: this.dryRun ? 'dry_run' : 'allowed',
      reason: this.dryRun
        ? 'CornerOps dry run is active.'
        : 'Agent action allowed.',
      dryRun: this.dryRun,
    };
  }

  deny(reason) {
    return {
      allowed: false,
      requiresApproval: false,
      decision: 'denied',
      reason,
      dryRun: this.dryRun,
    };
  }
}

module.exports = {
  AgentPermissionPolicy,
};
