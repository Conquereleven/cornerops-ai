const { RULESET } = require('./supplyGraphMatchRules');
const { round } = require('./SupplyGraphScoreCalculator');

class SupplyGraphConfidenceCalculator {
  calculate(demand, catalog, offer, match, { staleAfterHours = 168, now = Date.now() } = {}) {
    if (match.disqualifiers.includes('source_checksum_mismatch')) return { score: 0, breakdown: {}, caps: ['source_integrity_failure'] };
    const demandFields = [demand.requestedQuantity, demand.requestedUnit, demand.substitutesAllowed, demand.packPreference, demand.maximumUnitPrice, demand.temperatureZone];
    const demandScore = 15 * (demandFields.filter((value) => value !== null && value !== undefined && value !== '').length / demandFields.length);
    const provenanceFields = [catalog.supplierId, catalog.identityKey, catalog.sourceChecksum, catalog.sourceReference, offer?.observedAt, offer?.verificationStatus];
    const provenance = 20 * (provenanceFields.filter(Boolean).length / provenanceFields.length);
    const stale = !offer?.observedAt || Date.parse(offer.observedAt) < now - staleAfterHours * 3600000;
    const priceFreshness = offer?.unitPrice !== null && offer?.unitPrice !== undefined ? (stale ? 5 : 15) : 0;
    const stock = offer?.stockStatus && offer.stockStatus !== 'unknown' ? (offer.stockQuantity !== null && offer.stockQuantity !== undefined ? 20 : 12) : 0;
    const moq = offer?.minimumOrderQuantity !== null && offer?.minimumOrderQuantity !== undefined ? 10 : 0;
    const leadTime = offer?.leadTimeDays !== null && offer?.leadTimeDays !== undefined ? 10 : 0;
    const shelfTemperature = (offer?.shelfLifeDays !== null && offer?.shelfLifeDays !== undefined ? 5 : 0)
      + (catalog.temperatureZone ? 5 : (!demand.temperatureZone ? 5 : 0));
    const breakdown = { demandCompleteness: round(demandScore), catalogProvenance: round(provenance), priceFreshness, stock, moq, leadTime, shelfTemperature };
    let score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    const caps = [];
    const applyCap = (condition, name, cap) => { if (condition) { caps.push(name); score = Math.min(score, cap); } };
    applyCap(stock === 0, 'stock_unknown', RULESET.confidenceCaps.stockUnknown);
    applyCap(moq === 0 && leadTime === 0, 'moq_and_lead_time_unknown', RULESET.confidenceCaps.moqAndLeadUnknown);
    applyCap(stale && offer?.unitPrice !== null && offer?.unitPrice !== undefined, 'stale_price', RULESET.confidenceCaps.stalePrice);
    applyCap(match.identityAmbiguous, 'ambiguous_catalog_identity', RULESET.confidenceCaps.ambiguousIdentity);
    return { score: round(score), breakdown, caps };
  }
}

module.exports = { SupplyGraphConfidenceCalculator };
