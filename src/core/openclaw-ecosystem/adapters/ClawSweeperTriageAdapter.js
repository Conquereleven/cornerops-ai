class ClawSweeperTriageAdapter {
  async triage() {
    return {
      serviceId: 'clawsweeper',
      status: 'document_only',
      message: 'ClawSweeper is documented for future issue/PR triage; no execution in v0.1.',
    };
  }
}

module.exports = {
  ClawSweeperTriageAdapter,
};
