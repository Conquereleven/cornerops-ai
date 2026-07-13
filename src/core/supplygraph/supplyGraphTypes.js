const crypto = require('crypto');
const { sanitizePersistencePayload, sanitizeMessage } = require('../security/SecuritySanitizer');

const SUPPLYGRAPH_TABLES = Object.freeze([
  'supplier_profiles',
  'supplier_catalog_items',
  'supplier_offer_snapshots',
  'supplier_evidence_packages', 'supplier_fact_observations', 'supplier_evidence_applications',
  'demand_requests',
  'demand_items',
  'sourcing_match_runs',
  'sourcing_match_item_results',
  'sourcing_match_candidates',
  'sourcing_recommendations',
]);
const DEMAND_PRIORITIES = Object.freeze(['critical', 'high', 'medium', 'low']);
const DEMAND_STATUSES = Object.freeze(['needs_information', 'ready_for_matching', 'closed']);
const DEMAND_COMMANDS = Object.freeze([
  'set_priority', 'set_required_by', 'set_status', 'add_item', 'update_item',
  'deactivate_item', 'mark_ready_for_matching', 'close_request',
]);

const createSupplyGraphError = (message, code, statusCode = 400) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const normalizeText = (value) => String(value || '')
  .normalize('NFKC')
  .trim()
  .replace(/\s+/g, ' ');

const normalizeKey = (value) => normalizeText(value)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const sha256 = (value) => crypto.createHash('sha256')
  .update(Buffer.isBuffer(value) ? value : String(value || ''))
  .digest('hex');
const boundedString = (value, max = 500) => sanitizeMessage(normalizeText(value)).slice(0, max);
const nullableString = (value, max) => boundedString(value, max) || null;
const finiteNumber = (value, { min = 0, nullable = true } = {}) => {
  if (value === null || value === undefined || value === '') return nullable ? null : 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min) {
    throw createSupplyGraphError('Numeric field is invalid.', 'SUPPLYGRAPH_NUMBER_INVALID');
  }
  return number;
};

const opaqueCustomerReference = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const reference = String(value).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(reference)) {
    throw createSupplyGraphError(
      'customerReference must be an opaque identifier without contact data.',
      'SUPPLYGRAPH_CUSTOMER_REFERENCE_INVALID',
    );
  }
  return reference;
};

const normalizeDemandItem = (item = {}, fallbackKey) => {
  const productQuery = boundedString(item.productQuery, 300);
  if (!productQuery) {
    throw createSupplyGraphError('Each demand item requires productQuery.', 'SUPPLYGRAPH_PRODUCT_QUERY_REQUIRED');
  }
  const itemKey = normalizeKey(item.itemKey || fallbackKey);
  if (!itemKey) throw createSupplyGraphError('Each demand item requires itemKey.', 'SUPPLYGRAPH_ITEM_KEY_REQUIRED');
  return {
    itemKey: itemKey.slice(0, 120),
    productQuery,
    normalizedQuery: normalizeKey(productQuery).replace(/-/g, ' '),
    requestedQuantity: finiteNumber(item.requestedQuantity, { min: Number.EPSILON }),
    requestedUnit: nullableString(item.requestedUnit, 80),
    packPreference: nullableString(item.packPreference, 160),
    brandRequired: Boolean(item.brandRequired),
    preferredBrand: nullableString(item.preferredBrand, 160),
    substitutesAllowed: item.substitutesAllowed === null || item.substitutesAllowed === undefined
      ? null : Boolean(item.substitutesAllowed),
    maximumUnitPrice: finiteNumber(item.maximumUnitPrice, { min: 0 }),
    temperatureZone: nullableString(item.temperatureZone, 80),
    notes: nullableString(item.notes, 1000),
    active: item.active === undefined ? true : Boolean(item.active),
  };
};

const evaluateDemandCompleteness = (request = {}, items = []) => {
  const missing = [];
  const critical = [];
  if (!request.requiredBy) {
    missing.push('required_by');
    critical.push('required_by');
  }
  const activeItems = items.filter((item) => item.active !== false);
  if (!activeItems.length) {
    missing.push('active_items');
    critical.push('active_items');
  }
  activeItems.forEach((item) => {
    const prefix = `items.${item.itemKey}`;
    if (!item.requestedQuantity) {
      missing.push(`${prefix}.requested_quantity`);
      critical.push(`${prefix}.requested_quantity`);
    }
    if (!item.requestedUnit) {
      missing.push(`${prefix}.requested_unit`);
      critical.push(`${prefix}.requested_unit`);
    }
    if (item.substitutesAllowed === null || item.substitutesAllowed === undefined) {
      missing.push(`${prefix}.substitutes_allowed`);
      critical.push(`${prefix}.substitutes_allowed`);
    }
    if (!item.packPreference) missing.push(`${prefix}.pack_preference`);
    if (item.maximumUnitPrice === null || item.maximumUnitPrice === undefined) {
      missing.push(`${prefix}.maximum_unit_price`);
    }
    if (!item.temperatureZone) missing.push(`${prefix}.temperature_zone`);
    if (item.brandRequired && !item.preferredBrand) {
      missing.push(`${prefix}.preferred_brand`);
      critical.push(`${prefix}.preferred_brand`);
    }
  });
  return {
    missingFields: [...new Set(missing)],
    criticalMissingFields: [...new Set(critical)],
    completeForMatching: critical.length === 0,
  };
};

const sanitizeMetadata = (value) => sanitizePersistencePayload(value || {});

module.exports = {
  DEMAND_COMMANDS,
  DEMAND_PRIORITIES,
  DEMAND_STATUSES,
  SUPPLYGRAPH_TABLES,
  boundedString,
  createSupplyGraphError,
  evaluateDemandCompleteness,
  finiteNumber,
  normalizeDemandItem,
  normalizeKey,
  normalizeText,
  nullableString,
  opaqueCustomerReference,
  sanitizeMetadata,
  sha256,
};
