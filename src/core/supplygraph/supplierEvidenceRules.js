const { sha256 } = require('./supplyGraphTypes');
const { stable } = require('./supplyGraphMatchRules');

const EVIDENCE_MODEL_VERSION = 'supplygraph-evidence-v1.12.0';
const FACT_TYPES = Object.freeze([
  'price', 'stock_status', 'stock_quantity', 'minimum_order',
  'lead_time_days', 'shelf_life_days', 'temperature_zone',
]);
const SOURCE_TYPES = Object.freeze([
  'supplier_quote', 'supplier_price_list', 'supplier_email_summary',
  'supplier_call_summary', 'supplier_portal_observation', 'public_catalog_snapshot',
  'internal_manual_verification', 'production_acceptance_test',
]);
const VERIFICATION_STATUSES = Object.freeze(['unverified', 'source_verified', 'human_verified']);
const EVIDENCE_SCOPES = Object.freeze(['production', 'acceptance_test']);
const PACKAGE_STATUSES = Object.freeze(['pending_review', 'applied', 'rejected', 'cancelled', 'expired']);
const APPLICATION_STATUSES = Object.freeze([
  'applied', 'no_material_change', 'acceptance_test_only', 'blocked_by_conflict',
  'blocked_by_approval', 'blocked_by_stale_preview',
]);
const TRUST = Object.freeze({ legacy_source_snapshot: 1, unverified: 0, source_verified: 2, human_verified: 3 });
const RULESET = Object.freeze({
  evidenceModelVersion: EVIDENCE_MODEL_VERSION,
  factTypes: FACT_TYPES,
  sourceTypes: SOURCE_TYPES,
  verificationStatuses: VERIFICATION_STATUSES,
  scopes: EVIDENCE_SCOPES,
  packageStatuses: PACKAGE_STATUSES,
  applicationStatuses: APPLICATION_STATUSES,
  trust: TRUST,
  precedence: Object.freeze(['trust', 'validity', 'observed_at', 'source_integrity']),
  acceptanceTestExcluded: true,
  conflicts: Object.freeze(['equal_trust_equal_time_different_value', 'stock_status_quantity', 'checksum_payload']),
  expiry: 'valid_until_exclusive',
});
const EVIDENCE_RULESET_CHECKSUM = sha256(stable(RULESET));

module.exports = {
  APPLICATION_STATUSES, EVIDENCE_MODEL_VERSION, EVIDENCE_RULESET_CHECKSUM,
  EVIDENCE_SCOPES, FACT_TYPES, PACKAGE_STATUSES, RULESET, SOURCE_TYPES, TRUST,
  VERIFICATION_STATUSES,
};
