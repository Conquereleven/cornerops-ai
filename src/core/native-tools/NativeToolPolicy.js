class NativeToolPolicy {
  constructor({ allowHostControl = false, auditEnabled = true, dryRun = true, requireApproval = true, requireAudit = true } = {}) {
    this.allowHostControl = allowHostControl;
    this.auditEnabled = auditEnabled;
    this.dryRun = dryRun;
    this.requireApproval = requireApproval;
    this.requireAudit = requireAudit;
  }

  evaluate({ operation, tool } = {}) {
    if (!tool) return this.deny('Native tool not found.');
    if (this.requireAudit && !this.auditEnabled) {
      return this.deny('Native tool denied because audit logging is unavailable.');
    }
    if (!['low', 'medium', 'high', 'critical'].includes(tool.riskLevel)) {
      return this.deny('Native tool risk is unknown.');
    }
    if (!['mock', 'read_only', 'dry_run', 'approval_required', 'document_only', 'disabled'].includes(tool.mode)) {
      return this.deny('Native tool mode is unknown.');
    }
    if (!tool.enabled || tool.mode === 'disabled' || tool.mode === 'document_only') {
      return this.deny(`Native tool ${tool.id} is disabled or document-only.`);
    }
    if (!tool.allowedOperations.includes(operation)) {
      return this.deny(`Operation ${operation} is not allowed for ${tool.id}.`);
    }
    if (!this.allowHostControl && ['host_control', 'ui_automation', 'terminal_command'].includes(operation)) {
      return this.deny('Host-control native operations are disabled by default.');
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
