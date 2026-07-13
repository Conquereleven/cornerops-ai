const { RULESET, normalizeMatchText, significantTokens } = require('./supplyGraphMatchRules');

const round = (value) => Math.max(0, Math.min(100, Math.round(value * 100) / 100));
const normalizedEqual = (left, right) => normalizeMatchText(left) === normalizeMatchText(right);

class SupplyGraphScoreCalculator {
  identity(demand, catalog) {
    const query = normalizeMatchText(demand.productQuery);
    const name = normalizeMatchText(catalog.displayName || catalog.normalizedName);
    const wanted = significantTokens(query);
    const offered = significantTokens(name);
    if (query && query === name && wanted.length) return { score: 40, ambiguous: false, reasons: ['identity_exact'] };
    if (!wanted.length || !offered.length) return { score: 0, ambiguous: true, reasons: ['identity_evidence_missing'] };
    const overlap = wanted.filter((token) => offered.includes(token)).length;
    const recall = overlap / wanted.length;
    const precision = overlap / offered.length;
    return { score: round(40 * ((0.7 * recall) + (0.3 * precision))), ambiguous: recall < 1, reasons: [recall === 1 ? 'identity_query_contained' : 'identity_token_overlap'] };
  }

  calculate(demand, catalog, offer, { expectedChecksum } = {}) {
    const reasons = [];
    const disqualifiers = [];
    const unknownFacts = [];
    const identity = this.identity(demand, catalog);
    reasons.push(...identity.reasons);

    let brand = 10;
    if (demand.brandRequired) {
      if (!catalog.brand) { brand = 5; unknownFacts.push('catalog_brand'); }
      else if (normalizedEqual(demand.preferredBrand, catalog.brand)) { brand = 20; reasons.push('required_brand_match'); }
      else { brand = 0; disqualifiers.push('required_brand_mismatch'); }
    } else if (demand.preferredBrand) {
      if (!catalog.brand) { brand = 5; unknownFacts.push('catalog_brand'); }
      else if (normalizedEqual(demand.preferredBrand, catalog.brand)) { brand = 20; reasons.push('preferred_brand_match'); }
      else { brand = 5; reasons.push('preferred_brand_mismatch'); }
    } else reasons.push('brand_not_required');

    let packUnit = 4;
    const requestedUnit = normalizeMatchText(demand.requestedUnit);
    const catalogUnit = normalizeMatchText(catalog.unitOfMeasure);
    const pack = normalizeMatchText(demand.packPreference);
    const catalogPack = normalizeMatchText(catalog.packSize);
    if (requestedUnit && catalogUnit && requestedUnit !== catalogUnit) {
      packUnit = 0; reasons.push('unit_incompatible');
    } else if (requestedUnit && catalogUnit && pack && catalogPack && requestedUnit === catalogUnit && pack === catalogPack) {
      packUnit = 15; reasons.push('pack_unit_match');
    } else if ((requestedUnit && catalogUnit && requestedUnit === catalogUnit) || (pack && catalogPack && pack === catalogPack)) {
      packUnit = 10; reasons.push('pack_or_unit_match');
    } else unknownFacts.push('pack_unit_compatibility');

    let price = 5;
    if (demand.maximumUnitPrice !== null && demand.maximumUnitPrice !== undefined) {
      if (!offer || offer.unitPrice === null || offer.unitPrice === undefined) unknownFacts.push('observed_price');
      else if (!demand.requestedCurrency || demand.requestedCurrency !== offer.currency || !requestedUnit || !catalogUnit || requestedUnit !== catalogUnit) {
        unknownFacts.push('price_basis_comparability'); reasons.push('price_incomparable');
      } else if (Number(offer.unitPrice) <= Number(demand.maximumUnitPrice)) { price = 10; reasons.push('price_within_maximum'); }
      else { price = 0; reasons.push('price_above_maximum'); }
    } else reasons.push('price_ceiling_not_provided');

    let temperature = 3;
    if (demand.temperatureZone) {
      if (!catalog.temperatureZone) { temperature = 1; unknownFacts.push('temperature_zone'); }
      else if (normalizedEqual(demand.temperatureZone, catalog.temperatureZone)) { temperature = 5; reasons.push('temperature_match'); }
      else { temperature = 0; disqualifiers.push('temperature_conflict'); }
    } else reasons.push('temperature_not_required');

    let integrity = 0;
    if (!catalog.activeObservation) disqualifiers.push('inactive_catalog_observation');
    if (expectedChecksum && catalog.sourceChecksum && catalog.sourceChecksum !== expectedChecksum) disqualifiers.push('source_checksum_mismatch');
    else if (catalog.sourceChecksum && offer?.sourceChecksum && catalog.sourceChecksum === offer.sourceChecksum && offer.verificationStatus !== 'unverified') {
      integrity = 10; reasons.push('source_integrity_verified');
    } else if (catalog.sourceChecksum && catalog.sourceReference) { integrity = 5; unknownFacts.push('offer_source_integrity'); }
    else unknownFacts.push('source_integrity');

    const breakdown = { identity: identity.score, brand, packUnit, price, temperature, integrity };
    const raw = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
    const score = disqualifiers.length ? 0 : round(raw);
    const resultStatus = disqualifiers.length || score < RULESET.thresholds.ambiguous
      ? 'no_catalog_match' : score >= RULESET.thresholds.match ? 'catalog_match_found' : 'ambiguous_catalog_match';
    return { score, resultStatus, breakdown, reasons: [...new Set(reasons)].sort(), disqualifiers: [...new Set(disqualifiers)].sort(), unknownFacts: [...new Set(unknownFacts)].sort(), identityAmbiguous: identity.ambiguous };
  }
}

module.exports = { SupplyGraphScoreCalculator, round };
