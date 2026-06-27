class ControlledActionPolicy {
  constructor({ config = {}, dataAccessPolicy } = {}) {
    this.config = config;
    this.dataAccessPolicy = dataAccessPolicy;
  }

  evaluate({ action, agentId, approval, auditAvailable, channel = 'internal', dryRun = true, operatorId } = {}) {
    if (!action) return this.deny('Missing action policy decision.', 'CONTROLLED_ACTION_POLICY_MISSING');
    if (!this.config.corneropsControlledActionsEnabled) return this.deny('Controlled actions are disabled.', 'CONTROLLED_ACTIONS_DISABLED');
    if (!action.enabled) return this.deny('Controlled action is disabled.', 'CONTROLLED_ACTION_DISABLED');
    if (!auditAvailable || this.config.corneropsAuditEnabled === false) return this.deny('Audit logging is unavailable.', 'CONTROLLED_ACTION_AUDIT_REQUIRED');
    if (this.config.corneropsControlledActionsFailClosed === false) return this.deny('Fail-closed policy must remain enabled.', 'CONTROLLED_ACTION_FAIL_CLOSED_REQUIRED');
    if (action.productionDataImpact) return this.deny('Production data impact is forbidden in v0.9.', 'CONTROLLED_ACTION_PRODUCTION_DATA_DENIED');
    if (action.allowedAgents.length && !action.allowedAgents.includes(agentId)) return this.deny(`Agent ${agentId || 'unknown'} is not allowed for this action.`, 'CONTROLLED_ACTION_AGENT_DENIED');
    if (action.allowedChannels.length && !action.allowedChannels.includes(channel)) return this.deny(`Channel ${channel} is not allowed for this action.`, 'CONTROLLED_ACTION_CHANNEL_DENIED');
    if (!operatorId) return this.deny('Operator identity is required.', 'CONTROLLED_ACTION_OPERATOR_REQUIRED');
    if (['high', 'critical'].includes(action.riskLevel)) return this.deny('High and critical actions are not allowlisted in v0.9.', 'CONTROLLED_ACTION_RISK_DENIED');

    const dataDecision = this.dataAccessPolicy?.evaluate({
      agentId,
      channel,
      dataSource: {
        id: action.externalSideEffect ? 'github' : 'cornerops_local_internal',
        mode: dryRun ? 'mock' : 'approval_required',
        enabled: true,
        piiLevel: 'internal',
        allowedAgents: action.allowedAgents,
        allowedChannels: action.allowedChannels,
        allowedOperations: ['propose_write', 'write'],
      },
      operation: dryRun ? 'propose_write' : 'write',
      userId: operatorId,
    });
    if (!dataDecision?.allowed) return this.deny(dataDecision?.reason || 'Data access policy denied the action.', 'CONTROLLED_ACTION_DATA_POLICY_DENIED');

    if (dryRun) return this.allow('dry_run', true, 'Action is restricted to dry-run simulation.');
    if (this.config.corneropsControlledActionsDryRun) return this.deny('Global controlled-action dry-run is enabled.', 'CONTROLLED_ACTION_REAL_DISABLED');
    if (action.requiresDryRunByDefault && action.defaultMode === 'dry_run') {
      return this.deny('This action remains configured for dry-run.', 'CONTROLLED_ACTION_REAL_DISABLED');
    }
    if (!action.externalSideEffect && !this.config.corneropsAllowLocalInternalWrites) {
      return this.deny('Local internal writes are not explicitly enabled.', 'CONTROLLED_ACTION_LOCAL_WRITE_DISABLED');
    }
    if (this.config.corneropsControlledActionsRequireApproval !== true || action.requiresApproval !== true) {
      return this.deny('Explicit human approval is mandatory.', 'CONTROLLED_ACTION_APPROVAL_REQUIRED');
    }
    if (!approval || approval.status !== 'approved') return this.deny('An approved approval is required.', 'CONTROLLED_ACTION_APPROVAL_REQUIRED');
    if (action.externalSideEffect && !approval.resolvedBy) return this.deny('External side effects require an identified approver.', 'CONTROLLED_ACTION_APPROVER_REQUIRED');
    return this.allow('allowed', false, 'Approved controlled action may execute.');
  }

  allow(decision, dryRun, reason) {
    return { allowed: true, decision, dryRun, requiresApproval: true, reason };
  }

  deny(reason, code) {
    return { allowed: false, decision: 'denied', dryRun: true, requiresApproval: false, reason, code };
  }
}

module.exports = { ControlledActionPolicy };
