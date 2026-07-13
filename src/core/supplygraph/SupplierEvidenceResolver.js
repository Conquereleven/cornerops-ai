const { sha256 } = require('./supplyGraphTypes');
const { stable } = require('./supplyGraphMatchRules');
const { EVIDENCE_MODEL_VERSION, EVIDENCE_RULESET_CHECKSUM, FACT_TYPES, TRUST } = require('./supplierEvidenceRules');

const clone = (value) => JSON.parse(JSON.stringify(value));
const sameValue = (a, b) => stable({ value: a.factValue, unit: a.unit, currency: a.currency }) === stable({ value: b.factValue, unit: b.unit, currency: b.currency });

class SupplierEvidenceResolver {
  constructor({ now = () => Date.now() } = {}) { this.now = now; }

  legacyFacts(catalogItem, offer) {
    if (!offer) return [];
    const base = {
      id: `legacy:${offer.id}`, packageId: null, supplierId: catalogItem.supplierId,
      supplierCatalogItemId: catalogItem.id, factKnown: true,
      observedAt: offer.observedAt, validUntil: offer.validUntil || null,
      sourceType: offer.sourceType || 'public_catalog_snapshot', sourceReference: offer.sourceReference || catalogItem.sourceReference,
      sourceChecksum: offer.sourceChecksum || catalogItem.sourceChecksum,
      verificationStatus: 'legacy_source_snapshot', evidenceScope: 'production', legacy: true,
    };
    const values = [
      ['price', offer.unitPrice === null || offer.unitPrice === undefined ? null : { amount: Number(offer.unitPrice) }, offer.unitOfMeasure || catalogItem.unitOfMeasure || 'catalog_item', offer.currency],
      ['stock_status', offer.stockStatus ? { value: offer.stockStatus } : null],
      ['stock_quantity', offer.stockQuantity === null || offer.stockQuantity === undefined ? null : { quantity: Number(offer.stockQuantity) }, offer.unitOfMeasure || catalogItem.unitOfMeasure],
      ['minimum_order', offer.minimumOrderQuantity === null || offer.minimumOrderQuantity === undefined ? null : { quantity: Number(offer.minimumOrderQuantity) }, offer.minimumOrderUnit],
      ['lead_time_days', offer.leadTimeDays === null || offer.leadTimeDays === undefined ? null : { value: Number(offer.leadTimeDays) }],
      ['shelf_life_days', offer.shelfLifeDays === null || offer.shelfLifeDays === undefined ? null : { value: Number(offer.shelfLifeDays) }],
      ['temperature_zone', catalogItem.temperatureZone ? { value: catalogItem.temperatureZone } : null],
    ];
    return values.filter(([, value]) => value !== null).map(([factType, factValue, unit = null, currency = null]) => ({ ...base, factType, factValue, unit, currency }));
  }

  resolve({ catalogItem, legacyOffer, observations = [], includeProposed = [] } = {}) {
    const candidates = [...this.legacyFacts(catalogItem, legacyOffer), ...observations, ...includeProposed]
      .filter((fact) => fact.evidenceScope === 'production')
      .filter((fact) => fact.packageStatus === undefined || fact.packageStatus === 'applied' || fact.proposed === true);
    const fields = {};
    const conflicts = [];
    for (const factType of FACT_TYPES) {
      const active = candidates.filter((fact) => fact.factType === factType)
        .filter((fact) => !fact.validUntil || Date.parse(fact.validUntil) > this.now());
      const checksumConflict = active.find((fact, index) => active.some((peer, peerIndex) => peerIndex > index
        && peer.sourceChecksum === fact.sourceChecksum && !sameValue(peer, fact)));
      if (checksumConflict) {
        const peer = active.find((fact) => fact.id !== checksumConflict.id && fact.sourceChecksum === checksumConflict.sourceChecksum && !sameValue(fact, checksumConflict));
        conflicts.push({ factType, factIds: [checksumConflict.id, peer.id].sort(), reason: 'same_checksum_different_payload' });
        fields[factType] = { factType, known: false, value: null, stale: false, conflict: true, resolutionReason: 'source_integrity_conflict' };
        continue;
      }
      active.sort((a, b) => (TRUST[b.verificationStatus] || 0) - (TRUST[a.verificationStatus] || 0)
        || Date.parse(b.observedAt) - Date.parse(a.observedAt)
        || String(a.id).localeCompare(String(b.id)));
      const winner = active[0];
      if (!winner) {
        fields[factType] = { factType, known: false, value: null, stale: false, conflict: false, resolutionReason: 'no_current_evidence' };
        continue;
      }
      const peer = active.find((fact, index) => index > 0
        && (TRUST[fact.verificationStatus] || 0) === (TRUST[winner.verificationStatus] || 0)
        && Date.parse(fact.observedAt) === Date.parse(winner.observedAt)
        && !sameValue(fact, winner));
      if (peer) {
        conflicts.push({ factType, factIds: [winner.id, peer.id].sort(), reason: 'equal_trust_equal_time_different_value' });
        fields[factType] = { factType, known: false, value: null, stale: false, conflict: true, resolutionReason: 'unresolved_equal_precedence_conflict' };
        continue;
      }
      fields[factType] = {
        factType, known: Boolean(winner.factKnown), value: winner.factKnown ? clone(winner.factValue) : null,
        unit: winner.unit || null, currency: winner.currency || null, observedAt: winner.observedAt,
        validUntil: winner.validUntil || null, verificationStatus: winner.verificationStatus,
        sourceType: winner.sourceType, sourceReference: winner.sourceReference || null,
        sourceChecksum: winner.sourceChecksum, packageId: winner.packageId || null,
        factId: winner.id, evidenceScope: winner.evidenceScope, stale: false, conflict: false,
        resolutionReason: winner.factKnown ? (winner.legacy ? 'legacy_baseline' : 'highest_precedence_current_evidence') : 'explicit_unknown',
      };
    }
    const material = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, {
      known: field.known, value: field.value, unit: field.unit || null, currency: field.currency || null,
      observedAt: field.observedAt || null, validUntil: field.validUntil || null,
      verificationStatus: field.verificationStatus || null, sourceChecksum: field.sourceChecksum || null,
      factId: field.factId || null, conflict: field.conflict,
    }]));
    return {
      catalogItemId: catalogItem.id, fields, conflicts,
      evidenceModelVersion: EVIDENCE_MODEL_VERSION, evidenceRulesetChecksum: EVIDENCE_RULESET_CHECKSUM,
      watermark: sha256(stable(material)), affectedFactIds: Object.values(fields).map((field) => field.factId).filter(Boolean).sort(),
    };
  }
}

module.exports = { SupplierEvidenceResolver };
