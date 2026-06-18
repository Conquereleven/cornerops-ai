class McporterMcpAdapter {
  constructor({ enabled = false, dryRun = true, toolExecutionPolicy } = {}) {
    this.enabled = enabled;
    this.dryRun = dryRun;
    this.toolExecutionPolicy = toolExecutionPolicy;
  }

  async callTool(input = {}) {
    if (!this.enabled || this.dryRun) {
      return {
        bridgeId: 'mcporter',
        status: 'dry_run',
        toolName: input.toolName,
        message: 'Real MCP call skipped because MCPORTER is disabled or dry-run.',
      };
    }
    const policy = this.toolExecutionPolicy?.evaluateAction?.({
      toolName: input.toolName,
      mutates: Boolean(input.mutates),
      requiresApproval: Boolean(input.requiresApproval),
    });
    if (policy && !policy.allowed) return { bridgeId: 'mcporter', status: 'denied', reason: policy.reason };
    return { bridgeId: 'mcporter', status: 'not_implemented', message: 'Real MCP calls are not wired in v0.2.' };
  }
}

module.exports = {
  McporterMcpAdapter,
};
