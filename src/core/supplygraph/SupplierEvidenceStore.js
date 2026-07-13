const { randomUUID } = require('crypto');
const { createSupplyGraphError } = require('./supplyGraphTypes');
const { safeCamel } = require('./SupplyGraphStore');

const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const fail = (message, code, status = 400) => { throw createSupplyGraphError(message, code, status); };

class SupplierEvidenceStore {
  constructor({ supplyGraphStore, internalStore } = {}) { this.supplyGraphStore = supplyGraphStore; this.internalStore = internalStore; }
  get state() { return this.supplyGraphStore.state; }
  isMemory() { return this.supplyGraphStore.isTestMemory(); }
  table(name) { return this.supplyGraphStore.table(name); }

  reviewRecommendation(record) {
    return {
      idempotencyKey: `supplygraph-evidence-review:${record.idempotencyKey}`,
      sourceType: 'supplygraph_evidence', sourceId: record.id,
      sourceFlow: 'supplygraph_supplier_evidence_review_flow', actionType: 'review_supplier_evidence_package',
      title: 'Review supplier evidence package', description: 'Review field-level supplier evidence before internal application.',
      priority: 'medium', status: 'recommended', operatingStage: 'internal_review', ownerType: 'founder', approvalRequired: true,
      evidence: { conditionActive: true, packageId: record.id, evidenceScope: record.evidenceScope, sourceChecksum: record.sourceChecksum.slice(0, 12) },
      safePayload: { internalOnly: true, executed: false, externalActionAllowed: false, supplierContactAllowed: false, customerContactAllowed: false },
    };
  }

  async create(normalized, context = {}) {
    return this.isMemory() ? this.createMemory(normalized, context)
      : this.internalStore.withTransaction((client) => this.createPostgres(client, normalized, context));
  }

  validateOwnershipMemory(normalized) {
    const supplier = this.state.suppliers.find((item) => item.id === normalized.package.supplierId && item.status === 'active');
    if (!supplier) fail('Verified supplier not found.', 'SUPPLYGRAPH_EVIDENCE_SUPPLIER_NOT_FOUND', 404);
    for (const fact of normalized.facts) {
      const item = this.state.catalogItems.find((candidate) => candidate.id === fact.supplierCatalogItemId);
      if (!item || item.supplierId !== supplier.id) fail('Catalog item does not belong to supplier.', 'SUPPLYGRAPH_EVIDENCE_OWNERSHIP_MISMATCH', 409);
      if (item.activeObservation === false) fail('Inactive catalog item cannot receive evidence.', 'SUPPLYGRAPH_EVIDENCE_CATALOG_INACTIVE', 409);
    }
  }

  async createMemory(normalized, context) {
    this.validateOwnershipMemory(normalized);
    const existing = this.state.evidencePackages.find((item) => item.idempotencyKey === normalized.package.idempotencyKey);
    if (existing) return { package: clone(existing), facts: clone(this.state.factObservations.filter((fact) => fact.packageId === existing.id)), reused: true };
    const timestamp = now();
    const record = { id: randomUUID(), ...clone(normalized.package), workItemId: null, approvalRequestId: null, createdAt: timestamp, updatedAt: timestamp, version: 1, appliedAt: null, closedAt: null };
    const facts = normalized.facts.map((fact, index) => ({ id: randomUUID(), packageId: record.id, supplierId: record.supplierId, ...clone(fact), idempotencyKey: `${record.idempotencyKey}:${fact.idempotencyKey || index}`, createdAt: timestamp }));
    this.state.evidencePackages.push(record); this.state.factObservations.push(...facts);
    const workQueue = await this.internalStore.syncRecommendations([this.reviewRecommendation(record)], { ...context, sourceType: 'supplygraph_evidence', sourceId: record.id });
    const workItem = workQueue.items?.[0]; const approval = this.internalStore.state.approvals.find((item) => item.workItemId === workItem?.id);
    Object.assign(record, { workItemId: workItem?.id || null, approvalRequestId: approval?.id || null, approvalStatus: approval?.status || 'pending' });
    await this.supplyGraphStore.appendAudit(null, { eventType: 'supplier_evidence_package_created', entityType: 'supplier_evidence_package', entityId: record.id, ...context, metadata: { factCount: facts.length, evidenceScope: record.evidenceScope } });
    return { package: clone(record), facts: clone(facts), workQueue, approval: clone(approval), reused: false };
  }

  async createPostgres(client, normalized, context) {
    const catalogIds = normalized.facts.map((fact) => fact.supplierCatalogItemId);
    const ownership = await client.query(`select id,supplier_id,active_observation from ${this.table('supplier_catalog_items')} where id=any($1::uuid[])`, [catalogIds]);
    if (ownership.rows.length !== new Set(catalogIds).size || ownership.rows.some((row) => row.supplier_id !== normalized.package.supplierId)) fail('Catalog item does not belong to supplier.', 'SUPPLYGRAPH_EVIDENCE_OWNERSHIP_MISMATCH', 409);
    if (ownership.rows.some((row) => !row.active_observation)) fail('Inactive catalog item cannot receive evidence.', 'SUPPLYGRAPH_EVIDENCE_CATALOG_INACTIVE', 409);
    const p = normalized.package;
    const inserted = await client.query(
      `insert into ${this.table('supplier_evidence_packages')}
       (idempotency_key,supplier_id,evidence_scope,evidence_model_version,ruleset_checksum,source_type,source_reference,
        source_checksum,observed_at,valid_until,verification_status,status,reviewer_reference,notes,created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending_review',$12,$13,$14)
       on conflict (idempotency_key) do nothing returning *`,
      [p.idempotencyKey,p.supplierId,p.evidenceScope,p.evidenceModelVersion,p.rulesetChecksum,p.sourceType,p.sourceReference,p.sourceChecksum,p.observedAt,p.validUntil,p.verificationStatus,p.reviewerReference,p.notes,p.createdBy],
    );
    if (!inserted.rows[0]) {
      const existing = await client.query(`select * from ${this.table('supplier_evidence_packages')} where idempotency_key=$1`, [p.idempotencyKey]);
      const facts = await client.query(`select * from ${this.table('supplier_fact_observations')} where package_id=$1 order by created_at,id`, [existing.rows[0].id]);
      return { package: safeCamel(existing.rows[0]), facts: facts.rows.map(safeCamel), reused: true };
    }
    const record = inserted.rows[0]; const facts = [];
    for (const fact of normalized.facts) {
      const result = await client.query(
        `insert into ${this.table('supplier_fact_observations')}
         (package_id,supplier_id,supplier_catalog_item_id,idempotency_key,fact_type,fact_known,fact_value,unit,currency,
          observed_at,valid_until,source_type,source_reference,source_checksum,verification_status,evidence_scope)
         values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning *`,
        [record.id,record.supplier_id,fact.supplierCatalogItemId,`${record.idempotency_key}:${fact.idempotencyKey}`,fact.factType,fact.factKnown,JSON.stringify(fact.factValue),fact.unit,fact.currency,fact.observedAt,fact.validUntil,fact.sourceType,fact.sourceReference,fact.sourceChecksum,fact.verificationStatus,fact.evidenceScope],
      ); facts.push(result.rows[0]);
    }
    const workQueue = await this.internalStore.syncRecommendationsWithClient(client, [this.reviewRecommendation(safeCamel(record))], { ...context, sourceType: 'supplygraph_evidence', sourceId: record.id });
    const workItem = workQueue.items[0];
    const approvalResult = await client.query(`select * from ${this.table('approval_requests')} where work_item_id=$1 and status='pending' order by requested_at desc limit 1`, [workItem.id]);
    const approval = approvalResult.rows[0];
    const linked = await client.query(`update ${this.table('supplier_evidence_packages')} set work_item_id=$2,approval_request_id=$3,updated_at=now(),version=version+1 where id=$1 returning *`, [record.id,workItem.id,approval?.id || null]);
    await this.supplyGraphStore.appendAudit(client, { eventType: 'supplier_evidence_package_created', entityType: 'supplier_evidence_package', entityId: record.id, ...context, metadata: { factCount: facts.length, evidenceScope: record.evidence_scope } });
    return { package: safeCamel(linked.rows[0]), facts: facts.map(safeCamel), workQueue, approval: approval ? safeCamel(approval) : null, reused: false };
  }

  async get(id, { includeAcceptanceTest = false, client } = {}) {
    if (this.isMemory()) {
      const record = this.state.evidencePackages.find((item) => item.id === id && (includeAcceptanceTest || item.evidenceScope === 'production'));
      if (!record) return null;
      const approval = this.internalStore.state.approvals.find((item) => item.id === record.approvalRequestId);
      return { package: { ...clone(record), approvalStatus: approval?.status || null }, facts: clone(this.state.factObservations.filter((fact) => fact.packageId === id)) };
    }
    const db = client || this.internalStore.pool;
    const result = await db.query(`select p.*,a.status approval_status from ${this.table('supplier_evidence_packages')} p left join ${this.table('approval_requests')} a on a.id=p.approval_request_id where p.id=$1 and ($2::boolean or p.evidence_scope='production')`, [id,includeAcceptanceTest]);
    if (!result.rows[0]) return null;
    const facts = await db.query(`select * from ${this.table('supplier_fact_observations')} where package_id=$1 order by created_at,id`, [id]);
    return { package: safeCamel(result.rows[0]), facts: facts.rows.map(safeCamel) };
  }

  async list(filters = {}) {
    const limit = Math.max(1, Math.min(Number(filters.limit) || 50, 100)); const offset = Math.max(0, Number(filters.offset) || 0);
    const includeAcceptanceTest = filters.includeAcceptanceTest === true;
    if (this.isMemory()) return clone(this.state.evidencePackages.filter((item) => (includeAcceptanceTest || item.evidenceScope === 'production') && (!filters.status || item.status === filters.status) && (!filters.supplierId || item.supplierId === filters.supplierId)).slice(offset,offset+limit));
    const values=[includeAcceptanceTest]; const clauses=['($1::boolean or evidence_scope=\'production\')'];
    if(filters.status){values.push(filters.status);clauses.push(`status=$${values.length}`);} if(filters.supplierId){values.push(filters.supplierId);clauses.push(`supplier_id=$${values.length}`);}
    values.push(limit,offset); const result=await this.internalStore.pool.query(`select * from ${this.table('supplier_evidence_packages')} where ${clauses.join(' and ')} order by created_at desc,id limit $${values.length-1} offset $${values.length}`,values);
    return result.rows.map(safeCamel);
  }

  async previewInputs(id, { includeAcceptanceTest = false, client } = {}) {
    const detail = await this.get(id,{includeAcceptanceTest,client}); if(!detail)return null;
    const ids=[...new Set(detail.facts.map((fact)=>fact.supplierCatalogItemId))];
    if(this.isMemory()){
      const catalogById=new Map(this.state.catalogItems.filter((item)=>ids.includes(item.id)).map((item)=>[item.id,clone(item)]));
      const legacyOffersByCatalogId=new Map(); this.state.offerSnapshots.filter((offer)=>ids.includes(offer.supplierCatalogItemId)).forEach((offer)=>{const current=legacyOffersByCatalogId.get(offer.supplierCatalogItemId);if(!current||offer.observedAt>current.observedAt)legacyOffersByCatalogId.set(offer.supplierCatalogItemId,clone(offer));});
      const appliedObservationsByCatalogId=new Map(); this.state.factObservations.filter((fact)=>ids.includes(fact.supplierCatalogItemId)).forEach((fact)=>{const p=this.state.evidencePackages.find((pkg)=>pkg.id===fact.packageId);if(p?.status==='applied'&&p.evidenceScope==='production'){const list=appliedObservationsByCatalogId.get(fact.supplierCatalogItemId)||[];list.push({...clone(fact),packageStatus:p.status});appliedObservationsByCatalogId.set(fact.supplierCatalogItemId,list);}});
      return {...detail,catalogById,legacyOffersByCatalogId,appliedObservationsByCatalogId};
    }
    const db=client||this.internalStore.pool;
    const [catalog,offers,observations]=await Promise.all([
      db.query(`select * from ${this.table('supplier_catalog_items')} where id=any($1::uuid[])`,[ids]),
      db.query(`select distinct on (supplier_catalog_item_id) * from ${this.table('supplier_offer_snapshots')} where supplier_catalog_item_id=any($1::uuid[]) order by supplier_catalog_item_id,observed_at desc,created_at desc`,[ids]),
      db.query(`select f.*,p.status package_status from ${this.table('supplier_fact_observations')} f join ${this.table('supplier_evidence_packages')} p on p.id=f.package_id where f.supplier_catalog_item_id=any($1::uuid[]) and p.status='applied' and p.evidence_scope='production'`,[ids]),
    ]);
    const catalogById=new Map(catalog.rows.map((row)=>{const item=safeCamel(row);return[item.id,item];}));
    const legacyOffersByCatalogId=new Map(offers.rows.map((row)=>{const item=safeCamel(row);return[item.supplierCatalogItemId,item];}));
    const appliedObservationsByCatalogId=new Map(); observations.rows.map(safeCamel).forEach((fact)=>{const list=appliedObservationsByCatalogId.get(fact.supplierCatalogItemId)||[];list.push(fact);appliedObservationsByCatalogId.set(fact.supplierCatalogItemId,list);});
    return {...detail,catalogById,legacyOffersByCatalogId,appliedObservationsByCatalogId};
  }

  async apply(id, command, buildPreview, context = {}) {
    if(this.isMemory()) return this.applyMemory(id,command,buildPreview,context);
    return this.internalStore.withTransaction(async(client)=>{
      const locked=await client.query(`select * from ${this.table('supplier_evidence_packages')} where id=$1 for update`,[id]); const row=locked.rows[0]; if(!row)return null;
      if(row.status==='applied')fail('Evidence package is already applied.','SUPPLYGRAPH_EVIDENCE_ALREADY_APPLIED',409);
      if(Number(command.version)!==row.version)fail('Evidence package version is stale.','SUPPLYGRAPH_EVIDENCE_VERSION_CONFLICT',409);
      const approval=await client.query(`select * from ${this.table('approval_requests')} where id=$1`,[row.approval_request_id]);
      if(approval.rows[0]?.status!=='approved')fail('Approved linked Approval is required.','SUPPLYGRAPH_EVIDENCE_APPROVAL_REQUIRED',409);
      const preview=await buildPreview(client,safeCamel({...row,approval_status:approval.rows[0].status}));
      if(command.previewFingerprint!==preview.previewFingerprint)fail('Preview fingerprint is stale.','SUPPLYGRAPH_EVIDENCE_PREVIEW_STALE',409);
      if(preview.conflicts.length)fail('Evidence conflicts require human resolution.','SUPPLYGRAPH_EVIDENCE_CONFLICT',409);
      const resultStatus=row.evidence_scope==='acceptance_test'?'acceptance_test_only':preview.productionResolutionWouldChange?'applied':'no_material_change';
      const fingerprint=require('./supplyGraphTypes').sha256(require('./supplyGraphMatchRules').stable({id,rowVersion:row.version,preview:preview.previewFingerprint,resultStatus}));
      const app=await client.query(`insert into ${this.table('supplier_evidence_applications')} (package_id,application_fingerprint,preview_fingerprint,expected_package_version,result_status,applied_fact_count,unchanged_fact_count,conflict_count,reason_codes,applied_by) values ($1,$2,$3,$4,$5,$6,$7,0,$8::jsonb,$9) returning *`,[id,fingerprint,preview.previewFingerprint,row.version,resultStatus,preview.items.flatMap((item)=>item.changes).filter((change)=>change.changed).length,preview.items.flatMap((item)=>item.changes).filter((change)=>!change.changed).length,JSON.stringify([resultStatus]),context.actorId||'founder']);
      const updated=await client.query(`update ${this.table('supplier_evidence_packages')} set status='applied',applied_at=now(),updated_at=now(),version=version+1 where id=$1 returning *`,[id]);
      await this.supplyGraphStore.appendAudit(client,{eventType:'supplier_evidence_package_applied',entityType:'supplier_evidence_package',entityId:id,...context,metadata:{resultStatus,executed:false,externalAction:false}});
      let workQueue=null;if(row.evidence_scope==='production'&&preview.productionResolutionWouldChange){workQueue=await this.internalStore.syncRecommendationsWithClient(client,[{idempotencyKey:`supplygraph-rematch-after-evidence:${preview.projectedEvidenceWatermark}`,sourceType:'supplygraph_evidence',sourceId:id,sourceFlow:'supplygraph_rematch_after_evidence_flow',actionType:'review_rematch_after_supplier_evidence',title:'Review rematch after supplier evidence',description:'Resolved production evidence changed; matching remains a separate founder action.',priority:'medium',status:'recommended',approvalRequired:false,evidence:{conditionActive:true,packageId:id,evidenceWatermark:preview.projectedEvidenceWatermark},safePayload:{internalOnly:true,executed:false,externalActionAllowed:false}}],{...context,sourceType:'supplygraph_evidence',sourceId:id});}
      return{package:safeCamel(updated.rows[0]),application:safeCamel(app.rows[0]),preview,workQueue,executed:false,externalActionsBlocked:true};
    });
  }

  async applyMemory(id,command,buildPreview,context){const record=this.state.evidencePackages.find((item)=>item.id===id);if(!record)return null;if(record.status==='applied')fail('Evidence package is already applied.','SUPPLYGRAPH_EVIDENCE_ALREADY_APPLIED',409);if(Number(command.version)!==record.version)fail('Evidence package version is stale.','SUPPLYGRAPH_EVIDENCE_VERSION_CONFLICT',409);const approval=this.internalStore.state.approvals.find((item)=>item.id===record.approvalRequestId);if(approval?.status!=='approved')fail('Approved linked Approval is required.','SUPPLYGRAPH_EVIDENCE_APPROVAL_REQUIRED',409);record.approvalStatus=approval.status;const preview=await buildPreview(null,record);if(command.previewFingerprint!==preview.previewFingerprint)fail('Preview fingerprint is stale.','SUPPLYGRAPH_EVIDENCE_PREVIEW_STALE',409);if(preview.conflicts.length)fail('Evidence conflicts require human resolution.','SUPPLYGRAPH_EVIDENCE_CONFLICT',409);const resultStatus=record.evidenceScope==='acceptance_test'?'acceptance_test_only':preview.productionResolutionWouldChange?'applied':'no_material_change';const application={id:randomUUID(),packageId:id,applicationFingerprint:require('./supplyGraphTypes').sha256(require('./supplyGraphMatchRules').stable({id,rowVersion:record.version,preview:preview.previewFingerprint,resultStatus})),previewFingerprint:preview.previewFingerprint,expectedPackageVersion:record.version,resultStatus,appliedFactCount:preview.items.flatMap((item)=>item.changes).filter((change)=>change.changed).length,unchangedFactCount:preview.items.flatMap((item)=>item.changes).filter((change)=>!change.changed).length,conflictCount:0,reasonCodes:[resultStatus],appliedBy:context.actorId||'founder',createdAt:now()};this.state.evidenceApplications.push(application);Object.assign(record,{status:'applied',appliedAt:now(),updatedAt:now(),version:record.version+1});await this.supplyGraphStore.appendAudit(null,{eventType:'supplier_evidence_package_applied',entityType:'supplier_evidence_package',entityId:id,...context,metadata:{resultStatus,executed:false}});let workQueue=null;if(record.evidenceScope==='production'&&preview.productionResolutionWouldChange)workQueue=await this.internalStore.syncRecommendations([{idempotencyKey:`supplygraph-rematch-after-evidence:${preview.projectedEvidenceWatermark}`,sourceType:'supplygraph_evidence',sourceId:id,sourceFlow:'supplygraph_rematch_after_evidence_flow',actionType:'review_rematch_after_supplier_evidence',title:'Review rematch after supplier evidence',priority:'medium',approvalRequired:false,evidence:{conditionActive:true,packageId:id,evidenceWatermark:preview.projectedEvidenceWatermark},safePayload:{internalOnly:true,executed:false,externalActionAllowed:false}}],{...context,sourceType:'supplygraph_evidence',sourceId:id});return{package:clone(record),application:clone(application),preview,workQueue,executed:false,externalActionsBlocked:true};}

  async cancel(id,command,context={}){if(!String(command.reason||'').trim())fail('Cancellation reason is required.','SUPPLYGRAPH_EVIDENCE_REASON_REQUIRED');if(this.isMemory()){const row=this.state.evidencePackages.find((item)=>item.id===id);if(!row)return null;if(row.status!=='pending_review')fail('Only pending package can be cancelled.','SUPPLYGRAPH_EVIDENCE_CANCEL_CONFLICT',409);if(Number(command.version)!==row.version)fail('Evidence package version is stale.','SUPPLYGRAPH_EVIDENCE_VERSION_CONFLICT',409);Object.assign(row,{status:'cancelled',closedAt:now(),updatedAt:now(),version:row.version+1});await this.supplyGraphStore.appendAudit(null,{eventType:'supplier_evidence_package_cancelled',entityType:'supplier_evidence_package',entityId:id,...context,metadata:{reason:command.reason}});return clone(row);}return this.internalStore.withTransaction(async(client)=>{const result=await client.query(`update ${this.table('supplier_evidence_packages')} set status='cancelled',closed_at=now(),updated_at=now(),version=version+1 where id=$1 and version=$2 and status='pending_review' returning *`,[id,command.version]);if(!result.rows[0])fail('Package cannot be cancelled or version is stale.','SUPPLYGRAPH_EVIDENCE_CANCEL_CONFLICT',409);await this.supplyGraphStore.appendAudit(client,{eventType:'supplier_evidence_package_cancelled',entityType:'supplier_evidence_package',entityId:id,...context,metadata:{reason:command.reason}});return safeCamel(result.rows[0]);});}

  async appliedEvidenceForCatalog(catalogIds,{includeAcceptanceTest=false}={}){if(this.isMemory())return clone(this.state.factObservations.filter((fact)=>catalogIds.includes(fact.supplierCatalogItemId)).filter((fact)=>{const p=this.state.evidencePackages.find((pkg)=>pkg.id===fact.packageId);return p?.status==='applied'&&(includeAcceptanceTest||p.evidenceScope==='production');}).map((fact)=>({...fact,packageStatus:'applied'})));const result=await this.internalStore.pool.query(`select f.*,p.status package_status from ${this.table('supplier_fact_observations')} f join ${this.table('supplier_evidence_packages')} p on p.id=f.package_id where f.supplier_catalog_item_id=any($1::uuid[]) and p.status='applied' and ($2::boolean or p.evidence_scope='production')`,[catalogIds,includeAcceptanceTest]);return result.rows.map(safeCamel);}

  async applicationsForPackage(id){if(this.isMemory())return clone(this.state.evidenceApplications.filter((item)=>item.packageId===id));const result=await this.internalStore.pool.query(`select * from ${this.table('supplier_evidence_applications')} where package_id=$1 order by created_at,id`,[id]);return result.rows.map(safeCamel);}

  async metrics(){if(this.isMemory()){const packages=this.state.evidencePackages;const facts=this.state.factObservations;const production=packages.filter((p)=>p.status==='applied'&&p.evidenceScope==='production');const productionIds=new Set(production.map((p)=>p.id));const productionFacts=facts.filter((f)=>productionIds.has(f.packageId));const nowMs=Date.now();return{totalEvidencePackages:packages.length,pendingEvidencePackages:packages.filter((p)=>p.status==='pending_review').length,rejectedEvidencePackages:packages.filter((p)=>p.status==='rejected').length,cancelledEvidencePackages:packages.filter((p)=>p.status==='cancelled').length,appliedProductionPackages:production.length,appliedAcceptanceTestPackages:packages.filter((p)=>p.status==='applied'&&p.evidenceScope==='acceptance_test').length,totalFactObservations:facts.length,knownFacts:facts.filter((f)=>f.factKnown).length,explicitUnknownFacts:facts.filter((f)=>!f.factKnown).length,verifiedProductionFacts:productionFacts.filter((f)=>['source_verified','human_verified'].includes(f.verificationStatus)).length,humanVerifiedProductionFacts:productionFacts.filter((f)=>f.verificationStatus==='human_verified').length,expiredProductionFacts:productionFacts.filter((f)=>f.validUntil&&Date.parse(f.validUntil)<=nowMs).length,productionCatalogItemsWithEvidence:new Set(productionFacts.map((f)=>f.supplierCatalogItemId)).size};}const result=await this.internalStore.pool.query(`select (select count(*)::int from ${this.table('supplier_evidence_packages')}) total_evidence_packages,(select count(*)::int from ${this.table('supplier_evidence_packages')} where status='pending_review') pending_evidence_packages,(select count(*)::int from ${this.table('supplier_evidence_packages')} where status='rejected') rejected_evidence_packages,(select count(*)::int from ${this.table('supplier_evidence_packages')} where status='cancelled') cancelled_evidence_packages,(select count(*)::int from ${this.table('supplier_evidence_packages')} where status='applied' and evidence_scope='production') applied_production_packages,(select count(*)::int from ${this.table('supplier_evidence_packages')} where status='applied' and evidence_scope='acceptance_test') applied_acceptance_test_packages,(select count(*)::int from ${this.table('supplier_fact_observations')}) total_fact_observations,(select count(*)::int from ${this.table('supplier_fact_observations')} where fact_known) known_facts,(select count(*)::int from ${this.table('supplier_fact_observations')} where not fact_known) explicit_unknown_facts,(select count(*)::int from ${this.table('supplier_fact_observations')} f join ${this.table('supplier_evidence_packages')} p on p.id=f.package_id where p.status='applied' and p.evidence_scope='production' and f.verification_status in ('source_verified','human_verified')) verified_production_facts,(select count(*)::int from ${this.table('supplier_fact_observations')} f join ${this.table('supplier_evidence_packages')} p on p.id=f.package_id where p.status='applied' and p.evidence_scope='production' and f.verification_status='human_verified') human_verified_production_facts,(select count(*)::int from ${this.table('supplier_fact_observations')} f join ${this.table('supplier_evidence_packages')} p on p.id=f.package_id where p.status='applied' and p.evidence_scope='production' and f.valid_until is not null and f.valid_until<=now()) expired_production_facts,(select count(distinct f.supplier_catalog_item_id)::int from ${this.table('supplier_fact_observations')} f join ${this.table('supplier_evidence_packages')} p on p.id=f.package_id where p.status='applied' and p.evidence_scope='production') production_catalog_items_with_evidence`);return safeCamel(result.rows[0]);}
}

module.exports = { SupplierEvidenceStore };
