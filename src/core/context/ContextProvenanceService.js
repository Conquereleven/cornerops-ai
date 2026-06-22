class ContextProvenanceService {
  summarize(record = {}) {
    return {
      sourceId: record.sourceId,
      adapter: record.provenance?.adapter || 'unknown',
      originalSource: record.provenance?.originalSource || 'unknown',
      importedAt: record.provenance?.importedAt,
      checksum: record.provenance?.checksum,
    };
  }

  hasProvenance(record = {}) {
    return Boolean(record.provenance?.adapter && record.provenance?.importedAt);
  }
}

module.exports = {
  ContextProvenanceService,
};
