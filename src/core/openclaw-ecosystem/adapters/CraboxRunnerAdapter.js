class CraboxRunnerAdapter {
  constructor({ auditLogService, registry, policy } = {}) {
    this.auditLogService = auditLogService;
    this.registry = registry;
    this.policy = policy;
  }

  async invoke(operation, input = {}, context = {}) {
    const service = this.registry.get('crabox');
    const decision = this.policy.evaluate({ agentId: context.agentId, operation, service });
    const result = {
      serviceId: 'crabox',
      operation,
      status: decision.allowed ? decision.decision : 'denied',
      dryRun: true,
      message: decision.allowed
        ? `Crabox ${operation} simulated; no sandbox or host execution occurred.`
        : decision.reason,
      inputSummary: { suite: input.suite, diffId: input.diffId },
    };
    await this.auditLogService?.record({
      ...context,
      eventType: 'openclaw_ecosystem_service_invoked',
      dataSource: 'openclaw_ecosystem',
      operation: `crabox.${operation}`,
      policyDecision: decision.decision,
      status: decision.allowed ? 'success' : 'denied',
      output: result,
    });
    return result;
  }

  prepareSandbox(input, context) { return this.invoke('prepareSandbox', input, context); }
  syncDiff(input, context) { return this.invoke('syncDiff', input, context); }
  runSuite(input, context) { return this.invoke('runSuite', input, context); }
  destroySandbox(input, context) { return this.invoke('destroySandbox', input, context); }
}

module.exports = {
  CraboxRunnerAdapter,
};
