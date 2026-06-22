const highRiskPermissions = ['command_execution', 'filesystem', 'network', 'browser', 'secret_access'];

const inferRiskLevel = (permissions = []) =>
  permissions.some((permission) => highRiskPermissions.includes(permission))
    ? 'high'
    : 'low';

class ClawHubSkillRegistryAdapter {
  constructor({ adapter, approvalService, registry, policy } = {}) {
    this.adapter = adapter;
    this.approvalService = approvalService;
    this.registry = registry;
    this.policy = policy;
  }

  evaluate(operation, context = {}) {
    return this.policy.evaluate({
      agentId: context.agentId,
      operation,
      service: this.registry.get('clawhub'),
    });
  }

  async listApprovedSkills(context = {}) {
    const decision = this.evaluate('listApprovedSkills', context);
    if (!decision.allowed) return [];
    return this.adapter.listClawHubSkills().filter((skill) => skill.status === 'approved');
  }

  async proposeSkillForReview(input = {}, context = {}) {
    const decision = this.evaluate('proposeSkillForReview', context);
    return {
      status: decision.allowed ? 'dry_run' : 'denied',
      skill: {
        id: input.id || `skill-${Date.now()}`,
        name: input.name || 'Unnamed skill',
        source: input.source || 'clawhub',
        status: 'proposed',
        riskLevel: input.riskLevel || inferRiskLevel(input.permissions),
        permissions: input.permissions || [],
        notes: input.notes,
      },
      message: decision.allowed
        ? 'Skill review proposed; no install or execution occurred.'
        : decision.reason,
    };
  }

  async approveSkill(input = {}, context = {}) {
    const decision = this.evaluate('approveSkill', context);
    if (decision.requiresApproval) {
      const approval = await this.approvalService.requestApproval({
        ...context,
        actionType: 'approve_clawhub_skill',
        toolName: 'approveClawHubSkillTool',
        payload: input,
      });
      return { status: 'needs_approval', approvalId: approval.id, skillId: input.id };
    }
    return { status: 'denied', message: decision.reason };
  }

  async disableSkill(input = {}, context = {}) {
    const decision = this.evaluate('disableSkill', context);
    if (decision.requiresApproval) {
      const approval = await this.approvalService.requestApproval({
        ...context,
        actionType: 'disable_clawhub_skill',
        toolName: 'disableClawHubSkillTool',
        payload: input,
      });
      return { status: 'needs_approval', approvalId: approval.id, skillId: input.id };
    }
    return { status: 'denied', message: decision.reason };
  }
}

module.exports = {
  ClawHubSkillRegistryAdapter,
  inferRiskLevel,
};
