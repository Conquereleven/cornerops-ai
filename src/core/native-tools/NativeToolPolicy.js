class NativeToolPolicy {
  constructor({ dryRun = true, requireApproval = true } = {}) {
    this.dryRun = dryRun;
    this.requireApproval = requireApproval;
  }

  evaluate({ operation, tool } = {}) {
    if (!tool) return this.deny('Native tool not found.');
    if (!tool.enabled || tool.mode === 'disabled' || tool.mode === 'document_only') {
      return this.deny(`Native tool ${tool.id} is disabled or document-only.`);
    }
    if (!tool.allowedOperations.includes(operation)) {
      return this.deny(`Operation ${operation} is not allowed for ${tool.id}.`);
    }
    const risky = ['send', 'write', 'delete', 'host_control', 'ui_automation', 'terminal_command', 'enable'];
    if (this.requireApproval && (risky.includes(operation) || tool.requiresApprovalFor.includes(operation))) {
      return {
        allowed: true,
        decision: 'approval_required',
        dryRun: true,
        requiresApproval: true,
        reason: 'Native tool operation requires approval.',
      };
    }
    return {
      allowed: true,
      decision: this.dryRun || tool.mode === 'dry_run' ? 'dry_run' : 'allowed',
      dryRun: this.dryRun || tool.mode === 'dry_run',
      requiresApproval: false,
      reason: 'Native tool operation allowed in safe mode.',
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
  NativeToolPolicy,
};
