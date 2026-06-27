const SOURCE_MODES = Object.freeze({
  DISABLED: 'disabled',
  DRY_RUN: 'dry_run',
  LOCAL_INTERNAL: 'local_internal',
  MISSING_CONFIG: 'missing_config',
  MIXED: 'mixed',
  MOCK: 'mock',
  REPO_DISCOVERED: 'repo_discovered',
  REAL_READ_ONLY: 'real_read_only',
});

const normalizeSourceMode = (mode) => {
  if (mode === 'read_only') return SOURCE_MODES.REAL_READ_ONLY;
  if (Object.values(SOURCE_MODES).includes(mode)) return mode;
  return SOURCE_MODES.MOCK;
};

const combineSourceModes = (modes = []) => {
  const normalized = [...new Set(modes.filter(Boolean).map(normalizeSourceMode))];
  if (!normalized.length) return SOURCE_MODES.DISABLED;
  if (normalized.length === 1) return normalized[0];
  if (normalized.includes(SOURCE_MODES.REAL_READ_ONLY) && normalized.includes(SOURCE_MODES.MOCK)) {
    return SOURCE_MODES.MIXED;
  }
  if (normalized.includes(SOURCE_MODES.REAL_READ_ONLY)) return SOURCE_MODES.MIXED;
  if (normalized.includes(SOURCE_MODES.REPO_DISCOVERED) && normalized.length > 1) return SOURCE_MODES.MIXED;
  return normalized[0];
};

module.exports = { SOURCE_MODES, combineSourceModes, normalizeSourceMode };
