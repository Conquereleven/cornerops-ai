const { createSupplyGraphError, evaluateDemandCompleteness, sha256 } = require('./supplyGraphTypes');
const { ENGINE_VERSION, RULESET_CHECKSUM, stable } = require('./supplyGraphMatchRules');
const { SupplyGraphScoreCalculator, round } = require('./SupplyGraphScoreCalculator');
const { SupplyGraphConfidenceCalculator } = require('./SupplyGraphConfidenceCalculator');
const { VERSIONS, RULESETS } = require('./authorizedSellerRules');
const { MultiSellerCoverageCalculator } = require('./MultiSellerCoverageCalculator');

const REQUIRED_CHECKS = Object.freeze({
  stock_status: 'verify_supplier_stock', minimum_order_quantity: 'verify_supplier_moq',
  lead_time_days: 'verify_supplier_lead_time', shelf_life_days: 'verify_supplier_shelf_life',
  temperature_zone: 'verify_supplier_temperature',
});

class SupplyGraphMatchService {
  constructor({ matchStore, config = {}, scoreCalculator, confidenceCalculator } = {}) {
    this.store = matchStore;
    this.config = config;
    this.score = scoreCalculator || new SupplyGraphScoreCalculator();
    this.confidence = confidenceCalculator || new SupplyGraphConfidenceCalculator();
  }

  assertEnabled() {
    if (!this.config.supplyGraphEnabled) throw createSupplyGraphError('SupplyGraph is disabled.', 'SUPPLYGRAPH_DISABLED', 503);
    if (!this.config.supplyGraphMatchingEnabled) throw createSupplyGraphError('SupplyGraph matching is disabled.', 'SUPPLYGRAPH_MATCHING_DISABLED', 503);
  }

  validateOptions(options = {}) {
    const allowed = ['version', 'maxCandidatesPerItem'];
    if (Object.keys(options).some((key) => !allowed.includes(key))) throw createSupplyGraphError('Match option is not allowed.', 'SUPPLYGRAPH_MATCH_OPTION_DENIED', 403);
    const max = Number(options.maxCandidatesPerItem ?? this.config.supplyGraphMatchMaxCandidatesPerItem ?? 5);
    if (!Number.isInteger(max) || max < 1 || max > 10) throw createSupplyGraphError('maxCandidatesPerItem must be between 1 and 10.', 'SUPPLYGRAPH_MATCH_CANDIDATE_LIMIT_INVALID');
    return { version: Number(options.version), maxCandidatesPerItem: max };
  }

  buildWatermarks(inputs) {
    const catalog = inputs.catalog.map((item) => ({ id: item.id, supplierId: item.supplierId, identityKey: item.identityKey, sourceChecksum: item.sourceChecksum, active: item.activeObservation !== false })).sort((a, b) => a.id.localeCompare(b.id));
    const offers = inputs.catalog.map((item) => item.latestOffer).filter(Boolean).map((offer) => ({ id: offer.id, catalogItemId: offer.supplierCatalogItemId, observedAt: offer.observedAt, sourceChecksum: offer.sourceChecksum })).sort((a, b) => a.id.localeCompare(b.id));
    const evidence = inputs.catalog.map((item) => ({ id: item.id, watermark: item.evidenceWatermark || null,
      factIds: item.evidenceFactIds || [], model: item.evidenceModelVersion || null,
      ruleset: item.evidenceRulesetChecksum || null,
      freshness: Object.fromEntries(Object.entries(item.latestOffer?.resolvedEvidence?.fields || {}).map(([key, field]) => [key, { stale: field.stale, conflict: field.conflict, validUntil: field.validUntil || null }]))
    })).sort((a,b)=>a.id.localeCompare(b.id));
    return { catalogWatermark: sha256(stable(catalog)), offerWatermark: sha256(stable(offers)),
      evidenceWatermark: sha256(stable(evidence)), evidenceModelVersion: inputs.catalog[0]?.evidenceModelVersion || null,
      evidenceRulesetChecksum: inputs.catalog[0]?.evidenceRulesetChecksum || null,
      evidenceFactIds: [...new Set(evidence.flatMap((item)=>item.factIds))].sort(),
      sourceWatermark: sha256(stable({ catalog, offers, evidence })) };
  }

  fingerprint(inputs, watermarks) {
    const activeItems = inputs.items.filter((item) => item.active !== false).map((item) => ({
      id: item.id, itemKey: item.itemKey, productQuery: item.normalizedQuery,
      requestedQuantity: item.requestedQuantity, requestedUnit: item.requestedUnit,
      packPreference: item.packPreference, brandRequired: item.brandRequired,
      preferredBrand: item.preferredBrand, substitutesAllowed: item.substitutesAllowed,
      maximumUnitPrice: item.maximumUnitPrice, temperatureZone: item.temperatureZone,
    })).sort((a, b) => a.id.localeCompare(b.id));
    return sha256(stable({ demandRequestId: inputs.request.id, demandVersion: inputs.request.version, activeItems,
      engineVersion: this.config.supplyGraphMultiSellerComparisonEnabled ? VERSIONS.match : ENGINE_VERSION,
      rulesetChecksum: this.config.supplyGraphMultiSellerComparisonEnabled ? RULESETS.match.checksum : RULESET_CHECKSUM,
      suppliers: inputs.suppliers.map((item) => item.id).sort(), ...watermarks,
      staleAfterHours: this.config.supplyGraphObservationStaleAfterHours || 168 }));
  }

  candidate(item, catalog) {
    const offer = catalog.latestOffer || null;
    const expectedChecksum=catalog.supplierCanonicalKey==='intermex-uae'?this.config.supplyGraphIntermexSourceChecksum:null;
    const match = this.score.calculate(item, catalog, offer, { expectedChecksum });
    const confidence = this.confidence.calculate(item, catalog, offer, match, { staleAfterHours: this.config.supplyGraphObservationStaleAfterHours || 168 });
    const unknown = [...match.unknownFacts];
    if (!offer || offer.stockStatus === 'unknown') unknown.push('stock_status');
    if (!offer || offer.minimumOrderQuantity === null || offer.minimumOrderQuantity === undefined) unknown.push('minimum_order_quantity');
    if (!offer || offer.leadTimeDays === null || offer.leadTimeDays === undefined) unknown.push('lead_time_days');
    if (!offer || offer.shelfLifeDays === null || offer.shelfLifeDays === undefined) unknown.push('shelf_life_days');
    return {
      supplierId: catalog.supplierId, supplierCatalogItemId: catalog.id,
      supplierOfferSnapshotId: offer?.id || null, stableKey: `${catalog.supplierId}:${catalog.identityKey}`,
      matchScore: match.score, confidenceScore: confidence.score, resultStatus: match.resultStatus,
      scoreBreakdown: { ...match.breakdown, confidence: confidence.breakdown, confidenceCaps: confidence.caps },
      reasonCodes: match.reasons, disqualifiers: match.disqualifiers,
      unknownFacts: [...new Set(unknown)].sort(),
      evidenceSnapshot: {
        supplierName: catalog.supplierName || null,
        catalogIdentityKey: catalog.identityKey, catalogDisplayName: catalog.displayName,
        brand: catalog.brand || null, packSize: catalog.packSize || null, unitOfMeasure: catalog.unitOfMeasure || null,
        observedPrice: offer?.unitPrice ?? null, currency: offer?.currency || null,
        stockStatus: offer?.stockStatus || 'unknown', observedAt: offer?.observedAt || null,
        sourceChecksum: catalog.sourceChecksum || offer?.sourceChecksum || null,
        verificationStatus: offer?.verificationStatus || null,
      },
    };
  }

  aggregate(itemEntries) {
    const units = [...new Set(itemEntries.map((entry) => String(entry.demand.requestedUnit || '').toLowerCase()))];
    const quantityWeighted = units.length === 1 && units[0] && itemEntries.every((entry) => Number(entry.demand.requestedQuantity) > 0);
    const weights = itemEntries.map((entry) => quantityWeighted ? Number(entry.demand.requestedQuantity) : 1);
    const total = weights.reduce((sum, value) => sum + value, 0) || 1;
    const weighted = (field) => round(itemEntries.reduce((sum, entry, index) => sum + (entry.result[field] * weights[index]), 0) / total);
    return { overallMatchScore: weighted('matchScore'), overallConfidenceScore: weighted('confidenceScore'), aggregation: quantityWeighted ? 'quantity_weighted_same_unit' : 'equal_weighted_items' };
  }

  recommendation(counts, entries) {
    const matchedUnknown = entries.some((entry) => entry.result.resultStatus === 'catalog_match_found' && entry.result.requiredHumanChecks.length);
    let recommendationType = 'review_catalog_match';
    if (counts.matched > 0 && (counts.ambiguous > 0 || counts.unmatched > 0)) recommendationType = 'mixed_coverage_review';
    else if (counts.matched === 0 && counts.unmatched > 0) recommendationType = 'alternative_supplier_search_required';
    else if (matchedUnknown) recommendationType = 'verify_supplier_facts';
    return { recommendationType, summary: 'Internal SupplyGraph assessment only. Human verification is required before any sourcing action.',
      nextActions: recommendationType === 'alternative_supplier_search_required' ? ['research_alternative_supplier'] : recommendationType === 'mixed_coverage_review' ? ['review_match_evidence', 'research_unmatched_items', 'verify_supplier_facts'] : matchedUnknown ? ['verify_supplier_facts'] : ['review_match_evidence'],
      approvalRequired: true, executed: false, externalActionAllowed: false, supplierContactAllowed: false, customerContactAllowed: false };
  }

  workItems(run, recommendation, entries) {
    const base = { sourceType: 'supplygraph_match', sourceId: run.demandRequestId, priority: 'medium', status: 'recommended', operatingStage: 'internal_review', ownerType: 'founder', evidence: { conditionActive: true, matchRunFingerprint: run.inputFingerprint, demandRequestId: run.demandRequestId, matchedItemCount: run.matchedItemCount, ambiguousItemCount: run.ambiguousItemCount, unmatchedItemCount: run.unmatchedItemCount }, safePayload: { internalOnly: true, executed: false, externalActionAllowed: false, supplierContactAllowed: false, customerContactAllowed: false, productActivationAllowed: false } };
    const items = [{ ...base, idempotencyKey: `supplygraph-match-review:${run.inputFingerprint}`, sourceFlow: 'supplygraph_match_review_flow', actionType: 'review_supplygraph_match', title: 'Review SupplyGraph match assessment', description: recommendation.summary, approvalRequired: true }];
    if (entries.some((entry) => entry.result.requiredHumanChecks.length)) items.push({ ...base, idempotencyKey: `supplygraph-supplier-facts:${run.inputFingerprint}`, sourceFlow: 'supplygraph_supplier_fact_verification_flow', actionType: 'verify_supplier_commercial_facts', title: 'Verify unknown supplier commercial facts', approvalRequired: false });
    if (run.unmatchedItemCount) items.push({ ...base, idempotencyKey: `supplygraph-alternative-search:${run.inputFingerprint}`, sourceFlow: 'supplygraph_alternative_search_flow', actionType: 'research_alternative_supplier', title: 'Research alternatives for unmatched demand items', approvalRequired: false });
    return items;
  }

  async match(demandRequestId, options = {}, context = {}) {
    this.assertEnabled();
    const parsed = this.validateOptions(options);
    const inputs = await this.store.loadInputs(demandRequestId);
    if (!inputs) throw createSupplyGraphError('Demand request not found.', 'SUPPLYGRAPH_DEMAND_NOT_FOUND', 404);
    if (parsed.version !== inputs.request.version) throw createSupplyGraphError('Demand request version is stale.', 'SUPPLYGRAPH_VERSION_CONFLICT', 409);
    const completeness = evaluateDemandCompleteness(inputs.request, inputs.items);
    if (inputs.request.status !== 'ready_for_matching' || !completeness.completeForMatching) throw createSupplyGraphError('Demand request is not ready for matching.', 'SUPPLYGRAPH_DEMAND_NOT_READY', 409);
    if (!inputs.suppliers.length || !inputs.catalog.length) throw createSupplyGraphError('Verified supplier catalog is unavailable.', 'SUPPLYGRAPH_MATCH_SOURCE_UNAVAILABLE', 503);
    const multiEnabled = Boolean(this.config.supplyGraphMultiSellerComparisonEnabled);
    const eligibleSuppliers = multiEnabled ? inputs.suppliers.slice(0, this.config.supplyGraphComparisonMaxSellers || 32)
      : inputs.suppliers.filter((supplier) => supplier.canonicalKey === 'intermex-uae').slice(0, 1);
    const scoped = { ...inputs, suppliers: eligibleSuppliers.length ? eligibleSuppliers : inputs.suppliers.slice(0, 1) };
    scoped.catalog = inputs.catalog.filter((item) => scoped.suppliers.some((supplier) => supplier.id === item.supplierId));
    const watermarks = this.buildWatermarks(scoped);
    const inputFingerprint = this.fingerprint(scoped, watermarks);
    const entries = scoped.items.filter((item) => item.active !== false).map((demand) => {
      const demandEvidence = { ...demand, requestedCurrency: inputs.request.requestedCurrency, requiredBy: inputs.request.requiredBy };
      const candidates = scoped.catalog.map((catalog) => this.candidate(demandEvidence, {
        ...catalog,
        supplierName: scoped.suppliers.find((supplier) => supplier.id === catalog.supplierId)?.canonicalName || null,
        supplierCanonicalKey: scoped.suppliers.find((supplier) => supplier.id === catalog.supplierId)?.canonicalKey || null,
      }))
        .filter((candidate) => !candidate.disqualifiers.includes('inactive_catalog_observation'))
        .map((candidate)=>({...candidate,candidateTier:candidate.resultStatus==='catalog_match_found'?(candidate.unknownFacts.length?'match_verification_required':'match_ready'):candidate.resultStatus==='ambiguous_catalog_match'?'ambiguous':'not_matched'}))
        .sort((a, b) => ({match_ready:0,match_verification_required:1,ambiguous:2,not_matched:3}[a.candidateTier]-({match_ready:0,match_verification_required:1,ambiguous:2,not_matched:3}[b.candidateTier]) || b.matchScore - a.matchScore || b.confidenceScore - a.confidenceScore || a.stableKey.localeCompare(b.stableKey)))
        .slice(0, parsed.maxCandidatesPerItem).map((candidate, index) => ({ ...candidate, rank: index + 1 }));
      const top = candidates[0] || null;
      const resultStatus = top?.resultStatus || 'no_catalog_match';
      const selected = resultStatus === 'catalog_match_found' ? top : null;
      const unknownFacts = top?.unknownFacts || ['catalog_candidate'];
      return { demand: demandEvidence, candidates, result: { demandItemId: demand.id, resultStatus,
        selectedSupplierId: selected?.supplierId || null, selectedCatalogItemId: selected?.supplierCatalogItemId || null,
        selectedOfferSnapshotId: selected?.supplierOfferSnapshotId || null, matchScore: top?.matchScore || 0,
        confidenceScore: top?.confidenceScore || 0, candidateCount: candidates.length,
        reasonCodes: top?.reasonCodes || ['no_candidate'], disqualifiers: top?.disqualifiers || [], unknownFacts,
        requiredHumanChecks: [...new Set(unknownFacts.map((fact) => REQUIRED_CHECKS[fact]).filter(Boolean))].sort() } };
    });
    const counts = { matched: entries.filter((entry) => entry.result.resultStatus === 'catalog_match_found').length,
      ambiguous: entries.filter((entry) => entry.result.resultStatus === 'ambiguous_catalog_match').length,
      unmatched: entries.filter((entry) => entry.result.resultStatus === 'no_catalog_match').length };
    const aggregate = this.aggregate(entries);
    const coverageStatus = counts.matched === entries.length ? 'catalog_coverage_complete' : counts.matched === 0 ? 'catalog_coverage_none' : 'catalog_coverage_partial';
    const fulfillmentReadiness = counts.matched === 0 ? 'catalog_coverage_none' : counts.matched < entries.length ? 'catalog_coverage_partial'
      : entries.some((entry) => entry.result.requiredHumanChecks.length) ? 'supplier_verification_required' : 'commercial_terms_verified';
    const recommendation = this.recommendation(counts, entries);
    const supplierComparisonPerformed = multiEnabled && scoped.suppliers.length > 1;
    const run = { demandRequestId, demandVersion: scoped.request.version, engineVersion: supplierComparisonPerformed?VERSIONS.match:ENGINE_VERSION,
      rulesetChecksum: supplierComparisonPerformed?RULESETS.match.checksum:RULESET_CHECKSUM, sourceWatermark: watermarks.sourceWatermark, inputFingerprint,
      comparisonScope: supplierComparisonPerformed?'authorized_verified_seller_set':'single_verified_supplier', supplierCountEvaluated: scoped.suppliers.length,
      marketComparisonPerformed: false, bestSupplierClaim: false, ...aggregate,
      coverageStatus, fulfillmentReadiness, matchedItemCount: counts.matched, ambiguousItemCount: counts.ambiguous,
      unmatchedItemCount: counts.unmatched, activeItemCount: entries.length,
      catalogCoverageRatio: round(counts.matched / entries.length),
      resultSummary: { aggregation: aggregate.aggregation, catalogWatermark: watermarks.catalogWatermark, offerWatermark: watermarks.offerWatermark, supplierComparisonPerformed, marketComparisonPerformed: false, marketCompleteness:false, bestSupplierClaim: false, splitSourcingPotential:counts.matched>0&&counts.matched<entries.length, basketOptimizerStatus:'not_implemented' },
      createdBy: context.actorId || 'founder' };
    const workItems = this.workItems(run, recommendation, entries);
    const coverageResults=new MultiSellerCoverageCalculator().calculate({activeItemCount:entries.length,suppliers:scoped.suppliers.map((supplier)=>({supplierId:supplier.id,results:entries.map((entry)=>entry.candidates.find((candidate)=>candidate.supplierId===supplier.id)||{resultStatus:'no_catalog_match',matchScore:0,confidenceScore:0})}))});
    const result = await this.store.persist({ run, items: entries, recommendation,coverageResults }, workItems, { ...context, sourceType: 'supplygraph_match', sourceId: demandRequestId });
    return { ...result, cornerMexMutations: false, productActivationBlocked: true, externalActionsBlocked: true };
  }
}

module.exports = { SupplyGraphMatchService };
