class OpenClawEcosystemPolicy {
  constructor({ dryRun = true, ecosystemEnabled = false, requireApproval = true } = {}) {
    this.dryRun = dryRun;
    this.ecosystemEnabled = ecosystemEnabled;
    this.requireApproval = requireApproval;
  }

  evaluate({ agentId, operation, service } = {}) {
    if (!service) return this.deny('OpenClaw ecosystem service not found.');
    if (!this.ecosystemEnabled || !service.enabled) {
      return this.deny(`Service ${service.id} is disabled.`);
    }
    if (service.allowedAgents?.length && !service.allowedAgents.includes(agentId)) {
      return this.deny(`Agent ${agentId} is not allowed to use ${service.id}.`);
    }
    if (service.allowedOperations?.length && !service.allowedOperations.includes(operation)) {
      return this.deny(`Operation ${operation} is not allowed for ${service.id}.`);
    }
    if (service.mode === 'document_only') {
      return this.deny(`Service ${service.id} is document_only in v0.1.`);
    }
    if (
      this.requireApproval
      && (service.requiresApprovalFor || []).includes(operation)
    ) {
      return {
        allowed: true,
        decision: 'approval_required',
        dryRun: true,
        requiresApproval: true,
        reason: 'OpenClaw ecosystem operation requires human approval.',
      };
    }
    return {
      allowed: true,
      decision: this.dryRun || service.mode === 'dry_run' ? 'dry_run' : 'allowed',
      dryRun: this.dryRun || service.mode === 'dry_run',
      requiresApproval: false,
      reason: 'OpenClaw ecosystem operation is allowed within current mode.',
    };
  }

  deny(reason) {
    return {
      allowed: false,
      decision: 'denied',
      dryRun: true,
      requiresApproval: false,
      reason,
    };
  }
}

module.exports = {
  OpenClawEcosystemPolicy,
};
