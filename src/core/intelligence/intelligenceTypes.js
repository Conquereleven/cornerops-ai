const INTELLIGENCE_SOURCE_MODES = Object.freeze({
  LOCAL_INTERNAL: 'local_internal',
  MOCK: 'mock',
  REAL_READ_ONLY: 'real_read_only',
  REAL_READ_ONLY_PARTIAL: 'real_read_only_partial',
  REPO_DISCOVERED: 'repo_discovered',
});

const INTELLIGENCE_SEVERITIES = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

const INTELLIGENCE_CASE_STATUSES = Object.freeze({
  DRAFT: 'draft',
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  DISMISSED: 'dismissed',
  RESOLVED: 'resolved',
});

const CONNECTOR_TYPES = Object.freeze({
  CORNERMEX: 'cornermex',
  SHOPIFY: 'shopify',
  WOOCOMMERCE: 'woocommerce',
  AMAZON: 'amazon',
  NOON: 'noon',
  MANUAL_IMPORT: 'manual_import',
});

module.exports = {
  CONNECTOR_TYPES,
  INTELLIGENCE_CASE_STATUSES,
  INTELLIGENCE_SEVERITIES,
  INTELLIGENCE_SOURCE_MODES,
};
