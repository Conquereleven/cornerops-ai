const crypto = require('crypto');
const { createSupplyGraphError, sanitizeMetadata } = require('./supplyGraphTypes');
const {
  EVIDENCE_MODEL_VERSION, EVIDENCE_RULESET_CHECKSUM, EVIDENCE_SCOPES,
  FACT_TYPES, SOURCE_TYPES, VERIFICATION_STATUSES,
} = require('./supplierEvidenceRules');

const bounded = (value, max) => String(value || '').trim().slice(0, max);
const fail = (message, code, status = 400) => { throw createSupplyGraphError(message, code, status); };
const sha = (value) => /^[a-f0-9]{64}$/i.test(String(value || '')) ? String(value).toLowerCase() : fail('sourceChecksum must be SHA-256 hex.', 'SUPPLYGRAPH_EVIDENCE_CHECKSUM_INVALID');
const iso = (value, name) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) fail(`${name} is invalid.`, 'SUPPLYGRAPH_EVIDENCE_TIME_INVALID');
  return date.toISOString();
};

class SupplierEvidenceValidator {
  constructor({ maxFacts = 100, now = () => Date.now() } = {}) { this.maxFacts = maxFacts; this.now = now; }

  sourceReference(value) {
    if (!value) return null;
    const ref = bounded(value, 500);
    if (/^https:\/\//i.test(ref)) {
      let url; try { url = new URL(ref); } catch { fail('sourceReference URL is invalid.', 'SUPPLYGRAPH_EVIDENCE_SOURCE_REFERENCE_INVALID'); }
      if (url.username || url.password || [...url.searchParams.keys()].some((key) => /(token|secret|signature|key|auth|credential)/i.test(key))) fail('Credential-bearing sourceReference is forbidden.', 'SUPPLYGRAPH_EVIDENCE_SOURCE_REFERENCE_SECRET');
      url.hash = '';
      return url.toString().slice(0, 500);
    }
    if (/[@]|\+?\d[\d\s().-]{7,}|^(javascript|data|file):|^\.?\.?\//i.test(ref)) fail('sourceReference contains prohibited contact or local data.', 'SUPPLYGRAPH_EVIDENCE_SOURCE_REFERENCE_INVALID');
    if (/^[a-z]+:/i.test(ref)) fail('sourceReference scheme is not allowed.', 'SUPPLYGRAPH_EVIDENCE_SOURCE_REFERENCE_INVALID');
    return ref;
  }

  fact(input, packageBase, index) {
    const factType = bounded(input.factType, 40).toLowerCase();
    if (!FACT_TYPES.includes(factType)) fail('factType is invalid.', 'SUPPLYGRAPH_EVIDENCE_FACT_TYPE_INVALID');
    const known = input.known === undefined ? input.factKnown !== false : Boolean(input.known);
    const value = known ? sanitizeMetadata(input.value ?? input.factValue) : null;
    const unit = input.unit ? bounded(input.unit, 40).toLowerCase() : null;
    const currency = input.currency ? bounded(input.currency, 3).toUpperCase() : null;
    if (known) this.validateValue(factType, value, unit, currency);
    return {
      idempotencyKey: bounded(input.idempotencyKey, 160) || `fact:${index}:${factType}`,
      supplierCatalogItemId: bounded(input.supplierCatalogItemId, 80), factType, factKnown: known,
      factValue: value, unit, currency,
      observedAt: input.observedAt ? iso(input.observedAt, 'fact observedAt') : packageBase.observedAt,
      validUntil: input.validUntil ? iso(input.validUntil, 'fact validUntil') : packageBase.validUntil,
      sourceType: packageBase.sourceType, sourceReference: packageBase.sourceReference,
      sourceChecksum: packageBase.sourceChecksum, verificationStatus: packageBase.verificationStatus,
      evidenceScope: packageBase.evidenceScope,
    };
  }

  validateValue(type, value, unit, currency) {
    const object = value && typeof value === 'object' && !Array.isArray(value) ? value : { value };
    const number = Number(object.amount ?? object.quantity ?? object.value);
    if (type === 'price' && (!(number >= 0) || !unit || !/^[A-Z]{3}$/.test(currency || ''))) fail('Price requires non-negative amount, ISO currency and basis unit.', 'SUPPLYGRAPH_EVIDENCE_PRICE_INVALID');
    if (type === 'stock_status' && !['in_stock', 'out_of_stock', 'limited', 'preorder', 'unknown'].includes(String(object.value ?? value))) fail('stock_status is invalid.', 'SUPPLYGRAPH_EVIDENCE_STOCK_STATUS_INVALID');
    if (type === 'stock_quantity' && (!(number >= 0) || !unit)) fail('stock_quantity requires non-negative quantity and unit.', 'SUPPLYGRAPH_EVIDENCE_STOCK_QUANTITY_INVALID');
    if (type === 'minimum_order' && (!(number > 0) || !unit)) fail('minimum_order requires positive quantity and unit.', 'SUPPLYGRAPH_EVIDENCE_MOQ_INVALID');
    if (type === 'lead_time_days' && (!Number.isInteger(number) || number < 0 || number > 365)) fail('lead_time_days is invalid.', 'SUPPLYGRAPH_EVIDENCE_LEAD_TIME_INVALID');
    if (type === 'shelf_life_days' && (!Number.isInteger(number) || number < 0 || number > 3650)) fail('shelf_life_days is invalid.', 'SUPPLYGRAPH_EVIDENCE_SHELF_LIFE_INVALID');
    if (type === 'temperature_zone' && !['ambient', 'chilled', 'frozen', 'unknown'].includes(String(object.value ?? value))) fail('temperature_zone is invalid.', 'SUPPLYGRAPH_EVIDENCE_TEMPERATURE_INVALID');
  }

  normalize(input = {}, actorId = 'founder') {
    const evidenceScope = bounded(input.evidenceScope, 30).toLowerCase();
    const sourceType = bounded(input.sourceType, 60).toLowerCase();
    const verificationStatus = bounded(input.verificationStatus, 30).toLowerCase();
    if (!EVIDENCE_SCOPES.includes(evidenceScope)) fail('evidenceScope is invalid.', 'SUPPLYGRAPH_EVIDENCE_SCOPE_INVALID');
    if (!SOURCE_TYPES.includes(sourceType)) fail('sourceType is invalid.', 'SUPPLYGRAPH_EVIDENCE_SOURCE_TYPE_INVALID');
    if (!VERIFICATION_STATUSES.includes(verificationStatus)) fail('verificationStatus is invalid.', 'SUPPLYGRAPH_EVIDENCE_VERIFICATION_INVALID');
    if (evidenceScope === 'production' && verificationStatus === 'unverified') fail('Production evidence must be verified.', 'SUPPLYGRAPH_EVIDENCE_PRODUCTION_UNVERIFIED');
    if (evidenceScope === 'acceptance_test' && sourceType !== 'production_acceptance_test') fail('Acceptance-test evidence requires its isolated source type.', 'SUPPLYGRAPH_EVIDENCE_ACCEPTANCE_SOURCE_INVALID');
    const reviewerReference = input.reviewerReference ? bounded(input.reviewerReference, 160) : null;
    if (verificationStatus === 'human_verified' && !reviewerReference) fail('human_verified requires reviewerReference.', 'SUPPLYGRAPH_EVIDENCE_REVIEWER_REQUIRED');
    const observedAt = iso(input.observedAt, 'observedAt');
    if (Date.parse(observedAt) > this.now() + 5 * 60 * 1000) fail('observedAt is materially in the future.', 'SUPPLYGRAPH_EVIDENCE_FUTURE_OBSERVATION');
    const validUntil = input.validUntil ? iso(input.validUntil, 'validUntil') : null;
    if (validUntil && Date.parse(validUntil) <= Date.parse(observedAt)) fail('validUntil must be later than observedAt.', 'SUPPLYGRAPH_EVIDENCE_EXPIRY_INVALID');
    if (!Array.isArray(input.facts) || !input.facts.length) fail('Evidence package cannot be empty.', 'SUPPLYGRAPH_EVIDENCE_FACTS_EMPTY');
    if (input.facts.length > this.maxFacts) fail('Evidence package exceeds fact limit.', 'SUPPLYGRAPH_EVIDENCE_FACTS_LIMIT');
    const base = {
      idempotencyKey: bounded(input.idempotencyKey, 160) || `evidence:${crypto.randomUUID()}`,
      supplierId: bounded(input.supplierId, 80), evidenceScope,
      evidenceModelVersion: EVIDENCE_MODEL_VERSION, rulesetChecksum: EVIDENCE_RULESET_CHECKSUM,
      sourceType, sourceReference: this.sourceReference(input.sourceReference),
      sourceChecksum: sha(input.sourceChecksum), observedAt, validUntil, verificationStatus,
      reviewerReference, notes: input.notes ? bounded(input.notes, 500) : null,
      createdBy: bounded(actorId, 120) || 'founder', status: 'pending_review',
    };
    if (!base.supplierId) fail('supplierId is required.', 'SUPPLYGRAPH_EVIDENCE_SUPPLIER_REQUIRED');
    const facts = input.facts.map((fact, index) => this.fact(fact, base, index));
    const identities = facts.map((fact) => `${fact.supplierCatalogItemId}:${fact.factType}`);
    if (facts.some((fact) => !fact.supplierCatalogItemId)) fail('supplierCatalogItemId is required.', 'SUPPLYGRAPH_EVIDENCE_CATALOG_ITEM_REQUIRED');
    if (new Set(identities).size !== identities.length) fail('Duplicate fact type for catalog item.', 'SUPPLYGRAPH_EVIDENCE_DUPLICATE_FACT');
    this.validateContradictions(facts);
    return { package: base, facts };
  }

  validateContradictions(facts) {
    const groups = new Map();
    facts.forEach((fact) => { const list = groups.get(fact.supplierCatalogItemId) || []; list.push(fact); groups.set(fact.supplierCatalogItemId, list); });
    for (const group of groups.values()) {
      const status = group.find((fact) => fact.factType === 'stock_status' && fact.factKnown);
      const quantity = group.find((fact) => fact.factType === 'stock_quantity' && fact.factKnown);
      const statusValue = status?.factValue?.value ?? status?.factValue;
      const quantityValue = Number(quantity?.factValue?.quantity ?? quantity?.factValue?.value);
      if ((statusValue === 'out_of_stock' && quantityValue > 0) || (statusValue === 'in_stock' && quantityValue === 0)) fail('Stock status conflicts with quantity.', 'SUPPLYGRAPH_EVIDENCE_STOCK_CONFLICT', 409);
    }
  }
}

module.exports = { SupplierEvidenceValidator };
