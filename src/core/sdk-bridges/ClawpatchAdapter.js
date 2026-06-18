class ClawpatchAdapter {
  constructor({ enabled = false, dryRun = true } = {}) {
    this.enabled = enabled;
    this.dryRun = dryRun;
  }

  async proposePatch(input = {}) {
    return {
      bridgeId: 'clawpatch',
      status: this.enabled && !this.dryRun ? 'needs_approval' : 'dry_run',
      requiresApproval: true,
      proposal: {
        title: input.title || 'Patch proposal',
        summary: input.summary || 'No real patching or PR landing in v0.2.',
      },
    };
  }
}

module.exports = {
  ClawpatchAdapter,
};
