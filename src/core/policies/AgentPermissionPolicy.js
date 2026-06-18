const { PERMISSION_LEVELS } = require('../agents/agentTypes');
const { ToolExecutionPolicy } = require('./ToolExecutionPolicy');

class AgentPermissionPolicy {
  constructor({
    agentsEnabled = true,
    allowedUsers = [],
    dryRun = true,
    requireApproval = true,
    toolExecutionPolicy = new ToolExecutionPolicy(),
  } = {}) {
    this.agentsEnabled = agentsEnabled;
    this.allowedUsers = new Set(allowedUsers);
    this.dryRun = dryRun;
    this.requireApproval = requireApproval;
    this.toolExecutionPolicy = toolExecutionPolicy;
  }

  evaluate({ agent, input, proposedActions = [] }) {
    if (!this.agentsEnabled) {
      return this.deny('Agents are disabled by configuration.');
    }
    if (!agent || !agent.enabled) {
      return this.deny('Agent is not enabled.');
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
        action.mutates
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
