const { randomUUID } = require('crypto');
const { createSupplyGraphError, sanitizeMetadata } = require('./supplyGraphTypes');
const { safeCamel } = require('./SupplyGraphStore');
const { RULESETS, VERSIONS } = require('./authorizedSellerRules');

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const json = (value) => JSON.stringify(sanitizeMetadata(value));

class SupplyGraphMatchStore {
  constructor({ supplyGraphStore, internalStore, evidenceStore, evidenceResolver } = {}) {
    this.supplyGraphStore = supplyGraphStore;
    this.internalStore = internalStore;
    this.evidenceStore = evidenceStore;
    this.evidenceResolver = evidenceResolver;
  }

  get state() { return this.supplyGraphStore.state; }
  table(name) { return this.supplyGraphStore.table(name); }
  isMemory() { return this.supplyGraphStore.isTestMemory(); }

  async loadInputs(demandRequestId) {
    const demand = await this.supplyGraphStore.getDemand(demandRequestId);
    if (!demand) return null;
    if (this.isMemory()) {
      const activeCatalog = this.state.catalogItems.filter((item) => item.activeObservation !== false);
      const latestOffers = new Map();
      this.state.offerSnapshots.forEach((offer) => {
        const current = latestOffers.get(offer.supplierCatalogItemId);
        if (!current || `${offer.observedAt}:${offer.createdAt}` > `${current.observedAt}:${current.createdAt}`) latestOffers.set(offer.supplierCatalogItemId, offer);
      });
      const catalog = clone(activeCatalog.map((item) => ({ ...item, latestOffer: latestOffers.get(item.id) || null })));
      return { ...demand, suppliers: clone(this.state.suppliers.filter((item) => item.status === 'active')), catalog: await this.enrichWithEvidence(catalog) };
    }
    const [suppliers, catalog] = await Promise.all([
      this.internalStore.pool.query(`select * from ${this.table('supplier_profiles')} where status='active' order by canonical_key`),
      this.internalStore.pool.query(
        `select c.*,row_to_json(o) latest_offer from ${this.table('supplier_catalog_items')} c
         left join lateral (select * from ${this.table('supplier_offer_snapshots')} s
           where s.supplier_catalog_item_id=c.id order by s.observed_at desc,s.created_at desc limit 1) o on true
         where c.active_observation=true order by c.supplier_id,c.identity_key`,
      ),
    ]);
    const mappedCatalog = catalog.rows.map((row) => {
      const item = safeCamel(row);
      return { ...item, latestOffer: item.latestOffer ? safeCamel(item.latestOffer) : null };
    });
    return {
      ...demand,
      suppliers: suppliers.rows.map(safeCamel),
      catalog: await this.enrichWithEvidence(mappedCatalog),
    };
  }

  async enrichWithEvidence(catalog) {
    if (!this.evidenceStore || !this.evidenceResolver || !catalog.length) return catalog;
    const observations = await this.evidenceStore.appliedEvidenceForCatalog(catalog.map((item) => item.id));
    const grouped = new Map();
    observations.forEach((fact) => { const list = grouped.get(fact.supplierCatalogItemId) || []; list.push(fact); grouped.set(fact.supplierCatalogItemId, list); });
    return catalog.map((item) => {
      const resolved = this.evidenceResolver.resolve({ catalogItem: item, legacyOffer: item.latestOffer, observations: grouped.get(item.id) || [] });
      const field = (name) => resolved.fields[name] || {};
      const scalar = (name, key = 'value') => field(name).known ? (field(name).value?.[key] ?? field(name).value) : null;
      const latestOffer = { ...(item.latestOffer || {}),
        unitPrice: scalar('price', 'amount'), currency: field('price').currency || item.latestOffer?.currency || null,
        stockStatus: scalar('stock_status') || 'unknown', stockQuantity: scalar('stock_quantity', 'quantity'),
        minimumOrderQuantity: scalar('minimum_order', 'quantity'), minimumOrderUnit: field('minimum_order').unit || null,
        leadTimeDays: scalar('lead_time_days'), shelfLifeDays: scalar('shelf_life_days'), resolvedEvidence: resolved,
      };
      return { ...item, temperatureZone: scalar('temperature_zone') || item.temperatureZone || null, latestOffer,
        evidenceWatermark: resolved.watermark, evidenceFactIds: resolved.affectedFactIds,
        evidenceModelVersion: resolved.evidenceModelVersion, evidenceRulesetChecksum: resolved.evidenceRulesetChecksum };
    });
  }

  async findByFingerprint(fingerprint) {
    if (this.isMemory()) return clone(this.state.matchRuns.find((item) => item.inputFingerprint === fingerprint) || null);
    const result = await this.internalStore.pool.query(`select * from ${this.table('sourcing_match_runs')} where input_fingerprint=$1`, [fingerprint]);
    return result.rows[0] ? safeCamel(result.rows[0]) : null;
  }

  async persist(assessment, workItems, context = {}) {
    if (this.isMemory()) return this.persistMemory(assessment, workItems, context);
    return this.internalStore.withTransaction((client) => this.persistPostgres(client, assessment, workItems, context));
  }

  async persistMemory(assessment, workItems, context) {
    const existing = this.state.matchRuns.find((item) => item.inputFingerprint === assessment.run.inputFingerprint);
    if (existing) return { ...(await this.get(existing.id)), reused: true, workQueue: await this.internalStore.syncRecommendations(workItems, context) };
    const createdAt = now();
    const run = { id: randomUUID(), ...clone(assessment.run), createdAt };
    this.state.matchRuns.push(run);
    const items = assessment.items.map((entry) => ({ id: randomUUID(), matchRunId: run.id, ...clone(entry.result), createdAt }));
    this.state.matchItemResults.push(...items);
    const candidates = [];
    assessment.items.forEach((entry, index) => entry.candidates.forEach((candidate) => candidates.push({
      id: randomUUID(), matchRunId: run.id, itemResultId: items[index].id,
      demandItemId: items[index].demandItemId, ...clone(candidate), createdAt,
    })));
    this.state.matchCandidates.push(...candidates);
    this.state.supplierCoverageResults.push(...(assessment.coverageResults||[]).map((row)=>({id:randomUUID(),matchRunId:run.id,...clone(row),createdAt})));
    const recommendation = { id: randomUUID(), matchRunId: run.id, ...clone(assessment.recommendation), createdAt };
    this.state.sourcingRecommendations.push(recommendation);
    await this.supplyGraphStore.appendAudit(null, { eventType: 'supplygraph_match_run_created', entityType: 'sourcing_match_run', entityId: run.id, ...context, metadata: { inputFingerprint: run.inputFingerprint.slice(0, 12), coverageStatus: run.coverageStatus } });
    const workQueue = await this.internalStore.syncRecommendations(workItems, context);
    return { matchRun: run, items: items.map((result) => ({ ...result, candidates: candidates.filter((candidate) => candidate.itemResultId === result.id) })), recommendation, workQueue, reused: false };
  }

  async persistPostgres(client, assessment, workItems, context) {
    const existing = await client.query(`select id from ${this.table('sourcing_match_runs')} where input_fingerprint=$1`, [assessment.run.inputFingerprint]);
    if (existing.rows[0]) {
      const workQueue = await this.internalStore.syncRecommendationsWithClient(client, workItems, context);
      return { ...(await this.getWithClient(client, existing.rows[0].id)), workQueue, reused: true };
    }
    const r = assessment.run;
    const inserted = await client.query(
      `insert into ${this.table('sourcing_match_runs')}
       (demand_request_id,demand_version,engine_version,ruleset_checksum,source_watermark,input_fingerprint,
        comparison_scope,supplier_count_evaluated,market_comparison_performed,best_supplier_claim,
        overall_match_score,overall_confidence_score,coverage_status,fulfillment_readiness,
        matched_item_count,ambiguous_item_count,unmatched_item_count,active_item_count,catalog_coverage_ratio,
        result_summary,created_by,comparison_policy_version,comparison_ruleset_checksum,supplier_comparison_performed,
        market_completeness_claim,preferred_within_verified_scope,tie_detected,single_supplier_full_coverage_available,split_sourcing_may_be_required) values
       ($1,$2,$3,$4,$5,$6,$7,$8,false,false,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,$19,$20,$21,$22,false,false,false,$23,$24)
       on conflict (input_fingerprint) do nothing returning *`,
      [r.demandRequestId, r.demandVersion, r.engineVersion, r.rulesetChecksum, r.sourceWatermark,
        r.inputFingerprint, r.comparisonScope, r.supplierCountEvaluated, r.overallMatchScore,
        r.overallConfidenceScore, r.coverageStatus, r.fulfillmentReadiness, r.matchedItemCount,
        r.ambiguousItemCount, r.unmatchedItemCount, r.activeItemCount, r.catalogCoverageRatio,
        json(r.resultSummary), r.createdBy, r.resultSummary.supplierComparisonPerformed?VERSIONS?.comparison: null,
        r.resultSummary.supplierComparisonPerformed?RULESETS?.comparison?.checksum:null,Boolean(r.resultSummary.supplierComparisonPerformed),
        r.coverageStatus==='catalog_coverage_complete',Boolean(r.resultSummary.splitSourcingPotential)],
    );
    if (!inserted.rows[0]) {
      const concurrent = await client.query(`select id from ${this.table('sourcing_match_runs')} where input_fingerprint=$1`, [r.inputFingerprint]);
      const workQueue = await this.internalStore.syncRecommendationsWithClient(client, workItems, context);
      return { ...(await this.getWithClient(client, concurrent.rows[0].id)), workQueue, reused: true };
    }
    const run = inserted.rows[0];
    for (const entry of assessment.items) {
      const result = entry.result;
      const item = await client.query(
        `insert into ${this.table('sourcing_match_item_results')}
         (match_run_id,demand_item_id,result_status,selected_supplier_id,selected_catalog_item_id,
          selected_offer_snapshot_id,match_score,confidence_score,candidate_count,reason_codes,
          disqualifiers,unknown_facts,required_human_checks) values
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb) returning *`,
        [run.id, result.demandItemId, result.resultStatus, result.selectedSupplierId,
          result.selectedCatalogItemId, result.selectedOfferSnapshotId, result.matchScore,
          result.confidenceScore, result.candidateCount, json(result.reasonCodes), json(result.disqualifiers),
          json(result.unknownFacts), json(result.requiredHumanChecks)],
      );
      for (const candidate of entry.candidates) {
        await client.query(
          `insert into ${this.table('sourcing_match_candidates')}
           (match_run_id,item_result_id,demand_item_id,supplier_id,supplier_catalog_item_id,
            supplier_offer_snapshot_id,rank,candidate_tier,match_score,confidence_score,score_breakdown,reason_codes,
            disqualifiers,evidence_snapshot) values
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb)`,
          [run.id, item.rows[0].id, result.demandItemId, candidate.supplierId,
            candidate.supplierCatalogItemId, candidate.supplierOfferSnapshotId, candidate.rank,
            candidate.candidateTier, candidate.matchScore, candidate.confidenceScore, json(candidate.scoreBreakdown),
            json(candidate.reasonCodes), json(candidate.disqualifiers), json(candidate.evidenceSnapshot)],
        );
      }
    }
    for(const coverage of assessment.coverageResults||[]){await client.query(`insert into ${this.table('sourcing_supplier_coverage_results')}(match_run_id,supplier_id,comparison_policy_version,comparison_ruleset_checksum,active_item_count,matched_item_count,ambiguous_item_count,unmatched_item_count,coverage_ratio,average_match_score,average_confidence_score,full_catalog_coverage,operational_inventory_coverage,commercially_verified_coverage,price_comparable_item_count,available_inventory_item_count,verified_stock_item_count,moq_compatible_item_count,lead_time_compatible_item_count,unknown_facts,reason_codes) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false,false,0,0,0,0,0,$13::jsonb,$14::jsonb)`,[run.id,coverage.supplierId,coverage.comparisonPolicyVersion,coverage.comparisonRulesetChecksum,coverage.activeItemCount,coverage.matchedItemCount,coverage.ambiguousItemCount,coverage.unmatchedItemCount,coverage.coverageRatio,coverage.averageMatchScore,coverage.averageConfidenceScore,coverage.fullCatalogCoverage,json(coverage.unknownFacts),json(coverage.reasonCodes)]);}
    const rec = assessment.recommendation;
    await client.query(
      `insert into ${this.table('sourcing_recommendations')}
       (match_run_id,recommendation_type,summary,next_actions,approval_required,executed,
        external_action_allowed,supplier_contact_allowed,customer_contact_allowed)
       values ($1,$2,$3,$4::jsonb,$5,false,false,false,false)`,
      [run.id, rec.recommendationType, rec.summary, json(rec.nextActions), rec.approvalRequired],
    );
    await this.supplyGraphStore.appendAudit(client, { eventType: 'supplygraph_match_run_created', entityType: 'sourcing_match_run', entityId: run.id, ...context, metadata: { inputFingerprint: r.inputFingerprint.slice(0, 12), coverageStatus: r.coverageStatus } });
    const workQueue = await this.internalStore.syncRecommendationsWithClient(client, workItems, context);
    return { ...(await this.getWithClient(client, run.id)), workQueue, reused: false };
  }

  async getWithClient(client, id) {
    const [run, items, candidates, recommendation,coverage] = await Promise.all([
      client.query(`select * from ${this.table('sourcing_match_runs')} where id=$1`, [id]),
      client.query(`select * from ${this.table('sourcing_match_item_results')} where match_run_id=$1 order by created_at,id`, [id]),
      client.query(`select mc.*,ci.display_name,sp.canonical_name supplier_name,
        o.currency observed_currency,o.unit_price observed_unit_price,o.metadata observed_price_metadata,
        b.on_hand_quantity,b.available_quantity,b.unit inventory_unit,b.physical_count_verified,b.initialization_source,
        m.source_image_url,m.asset_checksum media_asset_checksum,m.mime_type media_mime_type,m.usage_basis media_usage_basis,m.status media_status,
        (m.managed_storage_path is not null) managed_media_present
        from ${this.table('sourcing_match_candidates')} mc
        left join ${this.table('supplier_catalog_items')} ci on ci.id=mc.supplier_catalog_item_id
        left join ${this.table('supplier_profiles')} sp on sp.id=mc.supplier_id
        left join ${this.table('supplier_offer_snapshots')} o on o.id=mc.supplier_offer_snapshot_id
        left join ${this.table('seller_inventory_balances')} b on b.supplier_catalog_item_id=mc.supplier_catalog_item_id and b.seller_id=mc.supplier_id
        left join lateral (select sm.* from ${this.table('seller_product_media')} sm
          where sm.supplier_catalog_item_id=mc.supplier_catalog_item_id
          order by (sm.media_type='primary') desc,sm.position,sm.id limit 1) m on true
        where mc.match_run_id=$1 order by mc.demand_item_id,mc.rank`, [id]),
      client.query(`select * from ${this.table('sourcing_recommendations')} where match_run_id=$1`, [id]),
      client.query(`select * from ${this.table('sourcing_supplier_coverage_results')} where match_run_id=$1 order by coverage_ratio desc,supplier_id`,[id]),
    ]);
    if (!run.rows[0]) return null;
    const candidateRows = candidates.rows.map((row) => {
      const candidate=safeCamel(row);const evidence=candidate.evidenceSnapshot||{};const priceMetadata=candidate.observedPriceMetadata||{};
      return {...candidate,presentationEvidence:{presentationOnly:true,notScoringInput:true,
        displayName:candidate.displayName||evidence.catalogDisplayName||null,supplierName:candidate.supplierName||evidence.supplierName||null,
        publicPrice:candidate.observedUnitPrice??evidence.observedPrice??null,currency:candidate.observedCurrency||evidence.currency||null,
        priceType:priceMetadata.priceType||null,sourceImageUrl:candidate.sourceImageUrl||null,
        media:{managed:Boolean(candidate.managedMediaPresent),assetChecksum:candidate.mediaAssetChecksum||null,mimeType:candidate.mediaMimeType||null,usageBasis:candidate.mediaUsageBasis||null,status:candidate.mediaStatus||'missing'},
        inventory:{onHandQuantity:candidate.onHandQuantity??null,availableQuantity:candidate.availableQuantity??null,unit:candidate.inventoryUnit||null,physicalCountVerified:Boolean(candidate.physicalCountVerified),initializationSource:candidate.initializationSource||null}},
      };
    });
    return { matchRun: safeCamel(run.rows[0]), items: items.rows.map(safeCamel).map((item) => ({ ...item, candidates: candidateRows.filter((candidate) => candidate.itemResultId === item.id) })), recommendation: recommendation.rows[0] ? safeCamel(recommendation.rows[0]) : null,supplierCoverage:coverage.rows.map(safeCamel) };
  }

  async get(id) {
    if (this.isMemory()) {
      const run = this.state.matchRuns.find((item) => item.id === id);
      if (!run) return null;
      const items = this.state.matchItemResults.filter((item) => item.matchRunId === id).map((item) => ({ ...clone(item), candidates: clone(this.state.matchCandidates.filter((candidate) => candidate.itemResultId === item.id)) }));
      return { matchRun: clone(run), items, recommendation: clone(this.state.sourcingRecommendations.find((item) => item.matchRunId === id) || null),supplierCoverage:clone(this.state.supplierCoverageResults.filter((item)=>item.matchRunId===id)) };
    }
    return this.getWithClient(this.internalStore.pool, id);
  }

  async list(filters = {}) {
    const limit = Math.max(1, Math.min(Number(filters.limit) || 50, 100));
    const offset = Math.max(0, Number(filters.offset || filters.cursor) || 0);
    if (this.isMemory()) return clone(this.state.matchRuns.filter((run) => (!filters.demandRequestId || run.demandRequestId === filters.demandRequestId) && (!filters.coverageStatus || run.coverageStatus === filters.coverageStatus) && (!filters.fulfillmentReadiness || run.fulfillmentReadiness === filters.fulfillmentReadiness)).slice(offset, offset + limit));
    const clauses = []; const values = [];
    const add = (column, value, operator = '=') => { if (value) { values.push(value); clauses.push(`${column}${operator}$${values.length}`); } };
    add('r.demand_request_id', filters.demandRequestId); add('r.coverage_status', filters.coverageStatus);
    add('r.fulfillment_readiness', filters.fulfillmentReadiness); add('rec.recommendation_type', filters.recommendationType);
    add('r.created_at', filters.createdAfter, '>='); add('r.created_at', filters.createdBefore, '<=');
    values.push(limit, offset);
    const result = await this.internalStore.pool.query(
      `select r.* from ${this.table('sourcing_match_runs')} r left join ${this.table('sourcing_recommendations')} rec on rec.match_run_id=r.id
       ${clauses.length ? `where ${clauses.join(' and ')}` : ''} order by r.created_at desc,r.id limit $${values.length - 1} offset $${values.length}`, values,
    );
    return result.rows.map(safeCamel);
  }

  async latestForDemand(id) { const runs = await this.list({ demandRequestId: id, limit: 1 }); return runs[0] ? this.get(runs[0].id) : null; }

  async metrics() {
    if (this.isMemory()) {
      const runs = this.state.matchRuns;
      return {
        totalMatchRuns: runs.length,
        matchRunsLast24Hours: runs.filter((run) => Date.parse(run.createdAt) >= Date.now() - 86400000).length,
        latestMatchRunAt: runs.map((run) => run.createdAt).sort().at(-1) || null,
        catalogCoverageCompleteCount: runs.filter((run) => run.coverageStatus === 'catalog_coverage_complete').length,
        catalogCoveragePartialCount: runs.filter((run) => run.coverageStatus === 'catalog_coverage_partial').length,
        catalogCoverageNoneCount: runs.filter((run) => run.coverageStatus === 'catalog_coverage_none').length,
        supplierVerificationRequiredCount: runs.filter((run) => run.fulfillmentReadiness === 'supplier_verification_required').length,
        averageMatchScore: runs.length ? roundAverage(runs, 'overallMatchScore') : null,
        averageConfidenceScore: runs.length ? roundAverage(runs, 'overallConfidenceScore') : null,
        unmatchedItemCount: runs.reduce((sum, run) => sum + run.unmatchedItemCount, 0),
        ambiguousItemCount: runs.reduce((sum, run) => sum + run.ambiguousItemCount, 0),
        pendingMatchReviewCount: (this.internalStore.state?.workItems || []).filter((item) => item.actionType === 'review_supplygraph_match' && item.approvalStatus === 'pending').length,
        alternativeSearchTaskCount: (this.internalStore.state?.workItems || []).filter((item) => item.actionType === 'research_alternative_supplier' && item.evidence?.conditionActive !== false).length,
      };
    }
    const result = await this.internalStore.pool.query(
      `select count(*)::int total_match_runs,
       count(*) filter (where created_at>=now()-interval '24 hours')::int match_runs_last_24_hours,
       max(created_at) latest_match_run_at,
       count(*) filter (where coverage_status='catalog_coverage_complete')::int catalog_coverage_complete_count,
       count(*) filter (where coverage_status='catalog_coverage_partial')::int catalog_coverage_partial_count,
       count(*) filter (where coverage_status='catalog_coverage_none')::int catalog_coverage_none_count,
       count(*) filter (where fulfillment_readiness='supplier_verification_required')::int supplier_verification_required_count,
       round(avg(overall_match_score),2)::float8 average_match_score,
       round(avg(overall_confidence_score),2)::float8 average_confidence_score,
       coalesce(sum(unmatched_item_count),0)::int unmatched_item_count,
       coalesce(sum(ambiguous_item_count),0)::int ambiguous_item_count,
       (select count(*)::int from ${this.table('work_items')} where action_type='review_supplygraph_match' and approval_status='pending') pending_match_review_count,
       (select count(*)::int from ${this.table('work_items')} where action_type='research_alternative_supplier' and coalesce((evidence->>'conditionActive')::boolean,true)) alternative_search_task_count
       from ${this.table('sourcing_match_runs')}`,
    );
    return safeCamel(result.rows[0]);
  }
}

const roundAverage = (items, field) => Math.round((items.reduce((sum, item) => sum + Number(item[field]), 0) / items.length) * 100) / 100;

module.exports = { SupplyGraphMatchStore };
