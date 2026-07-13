const WORK_ITEM_STATUSES = Object.freeze([
  'recommended', 'drafted', 'queued_for_approval', 'approved', 'rejected',
  'in_progress', 'manually_completed', 'dismissed', 'expired',
]);
const WORK_ITEM_PRIORITIES = Object.freeze(['critical', 'high', 'medium', 'low']);
const APPROVAL_STATUSES = Object.freeze(['pending', 'approved', 'rejected', 'cancelled', 'expired']);
const INTERNAL_TABLES = Object.freeze([
  'work_items', 'approval_requests', 'audit_events',
  'supplier_profiles', 'supplier_catalog_items', 'supplier_offer_snapshots',
  'demand_requests', 'demand_items',
  'sourcing_match_runs', 'sourcing_match_item_results',
  'sourcing_match_candidates', 'sourcing_recommendations',
  'supplier_evidence_packages', 'supplier_fact_observations', 'supplier_evidence_applications',
  'supplier_onboarding_packages', 'supplier_onboarding_catalog_items', 'supplier_onboarding_applications',
  'seller_product_media', 'seller_inventory_ledger', 'seller_inventory_balances',
  'sourcing_supplier_coverage_results',
]);
const OPEN_WORK_ITEM_STATUSES = Object.freeze([
  'recommended', 'drafted', 'queued_for_approval', 'approved', 'in_progress',
]);

const createWorkQueueError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  APPROVAL_STATUSES,
  INTERNAL_TABLES,
  OPEN_WORK_ITEM_STATUSES,
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_STATUSES,
  createWorkQueueError,
};
