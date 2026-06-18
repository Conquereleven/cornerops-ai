class AcpxSessionAdapter {
  constructor({ enabled = false, dryRun = true } = {}) {
    this.enabled = enabled;
    this.dryRun = dryRun;
  }

  async createSession(input = {}) {
    if (!this.enabled || this.dryRun) {
      return {
        bridgeId: 'acpx',
        status: 'dry_run',
        sessionId: `dry-run-${input.agentId || 'agent'}`,
        message: 'No real ACP session was created.',
      };
    }
    return { bridgeId: 'acpx', status: 'not_implemented' };
  }
}

module.exports = {
  AcpxSessionAdapter,
};
