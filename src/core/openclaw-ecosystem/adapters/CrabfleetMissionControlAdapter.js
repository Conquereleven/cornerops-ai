class CrabfleetMissionControlAdapter {
  async listMissions() {
    return {
      serviceId: 'crabfleet',
      status: 'document_only',
      message: 'Crabfleet mission control remains disabled/document-only in v0.1.',
    };
  }
}

module.exports = {
  CrabfleetMissionControlAdapter,
};
