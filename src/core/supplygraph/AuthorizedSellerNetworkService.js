const { randomUUID } = require('crypto');
const { createSupplyGraphError, sha256 } = require('./supplyGraphTypes');
const { stable } = require('./supplyGraphMatchRules');
const { LIMITS, RULESETS, VERSIONS } = require('./authorizedSellerRules');
const { REGISTRY_CHECKSUM, SELLERS } = require('./authorizedSellerRegistry');
const { safeCamel } = require('./SupplyGraphStore');
const { SellerSnapshotValidator } = require('./SellerSnapshotValidator');
const { WAVE1_SELLERS } = require('./wave1SellerRegistry');

class AuthorizedSellerNetworkService {
  constructor({ config = {}, store } = {}) { this.config=config; this.store=store; this.packages=[]; this.applications=[]; this.inventory=new Map(); }
  assertEnabled(capability) {
    if (!this.config.supplyGraphAuthorizedSellersEnabled) throw createSupplyGraphError('Authorized seller network is disabled.','SUPPLYGRAPH_AUTHORIZED_SELLERS_DISABLED',503);
    if (capability==='onboarding'&&!this.config.supplyGraphSellerOnboardingEnabled) throw createSupplyGraphError('Seller onboarding is disabled.','SUPPLYGRAPH_SELLER_ONBOARDING_DISABLED',503);
  }
  registry(filters={}) { const limit=Math.min(Math.max(Number(filters.limit)||32,1),32); return SELLERS.filter((s)=>!filters.authorizationStatus||s.authorizationStatus===filters.authorizationStatus).slice(0,limit); }
  seller(key) { return SELLERS.find((item)=>item.canonicalKey===key)||null; }
  async status() { const resolved=SELLERS.filter((s)=>s.sourceStatus==='reachable_official_source').length; const base={ status:this.config.supplyGraphAuthorizedSellersEnabled?'ready':'disabled', authorizedSellerCount:32, founderAttestedSellerCount:32, documentedSellerCount:0,suspendedSellerCount:0,revokedSellerCount:0,verifiedSellerCount:resolved,sourceVerifiedSellerCount:resolved,
    catalogSellerCount:1, catalogProductCount:190, officialSourceResolvedCount:resolved, captureBlockedCount:32-resolved,
    authorizationBasis:'founder_attestation', registryVersion:VERSIONS.registry, registryChecksum:REGISTRY_CHECKSUM,
    policyVersions:VERSIONS, policyChecksums:Object.fromEntries(Object.entries(RULESETS).map(([k,v])=>[k,v.checksum])),
    initialProductStock:LIMITS.initialProductStock, initialStockMeaning:'operational_units_not_physical_count',
    multiSupplierComparisonReady:false, splitSourcingPotentialOnly:true, basketOptimizerStatus:'not_implemented',
    marketComparisonPerformed:false, marketCompleteness:false, bestSupplierClaim:false, writesRequireApproval:true,
    externalContactBlocked:true, quoteGenerationBlocked:true, purchasingBlocked:true };
    if(!this.config.supplyGraphAuthorizedSellersEnabled||!this.isPostgres())return base;
    try{
      const t=this.store.internalStore.table.bind(this.store.internalStore);
      const result=await this.store.internalStore.pool.query(`select
        count(*) filter(where authorization_status='founder_attested')::int founder_attested,
        count(*) filter(where source_verification_status='source_verified')::int source_verified,
        count(*) filter(where product_count=0)::int profile_only,
        count(*) filter(where product_count>0)::int catalog_ready,
        coalesce(sum(product_count),0)::int total_catalog_items
        from ${t('supplier_profiles')} where authorization_status is not null`);
      const inventory=await this.store.internalStore.pool.query(`select count(*)::int products,coalesce(sum(on_hand_quantity),0)::numeric units,count(*) filter(where physical_count_verified)::int physical from ${t('seller_inventory_balances')}`);
      const row=result.rows[0],inv=inventory.rows[0];
      return{...base,status:'ready',authorizedSellerCount:row.founder_attested,founderAttestedSellerCount:row.founder_attested,sourceVerifiedSellerCount:row.source_verified,profileOnlySellerCount:row.profile_only,catalogReadySellerCount:row.catalog_ready,totalSellerCatalogItems:row.total_catalog_items,productsWithInitializedInventory:inv.products,totalInitializedInventoryUnits:Number(inv.units),physicallyVerifiedInventoryProducts:inv.physical,marketComparisonAvailable:false,marketCompletenessClaim:false,basketOptimizationStatus:'not_implemented'};
    }catch(_error){return{...base,status:'unavailable',persistenceMetrics:'unknown',warnings:['AUTHORIZED_SELLER_STATUS_QUERY_UNAVAILABLE']};}
  }
  preview(key) { this.assertEnabled('onboarding'); const seller=this.seller(key); if(!seller)return null; const fingerprint=sha256(stable({seller,version:VERSIONS.onboarding,registryChecksum:REGISTRY_CHECKSUM})); return { seller, packageFingerprint:fingerprint, catalogItemCount:seller.catalogProductCount, mediaCount:0, inventoryInitializationCount:seller.catalogProductCount,
    approvalRequired:true, executed:false, externalActionsBlocked:true, warnings:seller.warnings }; }
  isPostgres() { return Boolean(this.store?.internalStore?.pool && this.store?.internalStore?.withTransaction); }
  async createPackage(key, context={}, snapshotInput=null) {
    const preview=this.preview(key); if(!preview)return null;
    const snapshot=snapshotInput?new SellerSnapshotValidator().snapshot(snapshotInput):null;
    if(snapshot&&snapshot.sellerCanonicalKey!==key)throw createSupplyGraphError('Snapshot seller identity does not match the authorized seller.','SUPPLYGRAPH_SELLER_IDENTITY_CONFLICT',409);
    if(snapshot){
      preview.seller={...preview.seller,
        sourceStatus:snapshotInput?.research?.sourceStatus==='complete'?'source_verified':preview.seller.sourceStatus,
        captureStatus:snapshotInput?.catalog?.captureStatus||'captured',catalogProductCount:snapshot.products.length};
      preview.catalogItemCount=snapshot.products.length;preview.inventoryInitializationCount=snapshot.products.length;
      preview.packageFingerprint=sha256(stable({seller:preview.seller,snapshot,version:VERSIONS.onboarding,registryChecksum:REGISTRY_CHECKSUM}));
    }
    if(!this.isPostgres()){
      const existing=this.packages.find((p)=>p.packageFingerprint===preview.packageFingerprint);
      if(existing)return{package:existing,reused:true};
      const row={id:randomUUID(),sellerKey:key,status:'pending_review',version:1,wave1CatalogExtension:Boolean(snapshot),...preview,createdBy:context.actorId||'founder',createdAt:new Date().toISOString()};
      this.packages.push(row); return{package:row,reused:false};
    }
    const internal=this.store.internalStore;
    return internal.withTransaction(async(client)=>{
      const table=internal.table('supplier_onboarding_packages');
      const existing=await client.query(`select * from ${table} where payload_fingerprint=$1`,[preview.packageFingerprint]);
      if(existing.rows[0])return{package:existing.rows[0],reused:true};
      const inserted=await client.query(`insert into ${table}(idempotency_key,supplier_canonical_key,evidence_scope,onboarding_model_version,onboarding_ruleset_checksum,snapshot_schema_version,snapshot_key,snapshot_checksum,proposed_profile,status,verification_status,authorization_status,catalog_item_count,image_reference_count,payload_fingerprint,created_by) values($1,$2,'production',$3,$4,$5,$6,$7,$8::jsonb,'pending_review','human_verified',$9,$10,0,$11,$12) returning *`,[`seller-onboarding:${preview.packageFingerprint}`,key,VERSIONS.onboarding,RULESETS.onboarding.checksum,VERSIONS.snapshot,`authorized-seller:${key}`,REGISTRY_CHECKSUM,JSON.stringify(preview.seller),preview.seller.authorizationStatus,preview.catalogItemCount,preview.packageFingerprint,context.actorId||'founder']);
      const row=inserted.rows[0];
      for(const product of snapshot?.products||[]){
        const itemKey=sha256(stable({sellerKey:key,externalProductId:product.externalProductId,supplierSku:product.supplierSku,displayName:product.displayName,packSize:product.packSize,productPageUrl:product.productPageUrl}));
        const strongestIdentity=product.externalProductId?{type:'external_product_id',value:product.externalProductId}
          :product.supplierSku?{type:'supplier_sku',value:product.supplierSku}
            :product.productPageUrl?{type:'product_page_url',value:product.productPageUrl}
              :{type:'normalized_fallback',value:`${product.normalizedName}:${product.brand||''}:${product.packSize||''}`};
        const identityKey=sha256(stable({sellerKey:key,...strongestIdentity}));
        await client.query(`insert into ${internal.table('supplier_onboarding_catalog_items')}(package_id,item_key,identity_key,product_type,external_product_id,supplier_sku,display_name,normalized_name,description,brand,category,pack_size,unit_of_measure,public_price,currency,price_type,public_availability_label,product_page_url,primary_image_url,gallery_image_urls,source_checksum,observed_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb,$21,$22)`,[row.id,itemKey,identityKey,product.productType,product.externalProductId,product.supplierSku,product.displayName,product.normalizedName,product.description,product.brand,product.category,product.packSize,product.unitOfMeasure,product.publicPrice,product.currency,product.priceType,product.publicAvailabilityLabel,product.productPageUrl,product.primaryImageUrl,JSON.stringify(product.galleryImageUrls),product.sourceChecksum,product.observedAt]);
      }
      const workQueue=await internal.syncRecommendationsWithClient(client,[{idempotencyKey:`supplygraph-seller-onboarding:${preview.packageFingerprint}`,sourceType:'supplygraph_seller_onboarding',sourceId:row.id,sourceFlow:'authorized_seller_onboarding_review_flow',actionType:'review_authorized_seller_onboarding',title:`Review authorized seller onboarding: ${preview.seller.canonicalName}`,priority:preview.seller.pipelinePriority?.startsWith('A')?'high':'medium',approvalRequired:true,evidence:{conditionActive:true,sellerKey:key,packageFingerprint:preview.packageFingerprint,productCount:preview.catalogItemCount},safePayload:{internalOnly:true,executed:false,externalActionAllowed:false,supplierContactAllowed:false,customerContactAllowed:false}}],{...context,sourceType:'supplygraph_seller_onboarding',sourceId:row.id});
      const workItemId=workQueue.items[0]?.id||null;
      const approval=workItemId?await client.query(`select id from ${internal.table('approval_requests')} where work_item_id=$1 and status='pending' order by requested_at desc limit 1`,[workItemId]):{rows:[]};
      const linked=await client.query(`update ${table} set work_item_id=$2,approval_request_id=$3,updated_at=now(),version=version+1 where id=$1 returning *`,[row.id,workItemId,approval.rows[0]?.id||null]);
      await this.store.appendAudit(client,{eventType:'supplygraph_seller_onboarding_package_created',entityType:'supplier_onboarding_package',entityId:row.id,...context,metadata:{sellerKey:key,productCount:preview.catalogItemCount}});
      return{package:linked.rows[0],workQueue,reused:false};
    });
  }
  createFromSnapshot(snapshot,context={}){return this.createPackage(snapshot?.sellerCanonicalKey,context,snapshot);}
  async apply(id, command={}, context={}) {
    if(!this.config.supplyGraphSellerOnboardingApplicationEnabled)throw createSupplyGraphError('Seller onboarding application is disabled.','SUPPLYGRAPH_SELLER_ONBOARDING_APPLICATION_DISABLED',503);
    if(!command.approvalId)throw createSupplyGraphError('Founder approval is required.','SUPPLYGRAPH_APPROVAL_REQUIRED',409);
    if(!this.isPostgres()){
      const row=this.packages.find((p)=>p.id===id);if(!row)return null;
      if(row.wave1CatalogExtension&&!this.config.supplyGraphWave1CatalogActivationEnabled)throw createSupplyGraphError('Wave 1 catalog activation is disabled.','SUPPLYGRAPH_WAVE1_CATALOG_ACTIVATION_DISABLED',503);
      if(row.status!=='pending_review'||Number(command.version)!==row.version)throw createSupplyGraphError('Package version is stale.','SUPPLYGRAPH_VERSION_CONFLICT',409);
      row.status='applied';row.version+=1;const application={id:randomUUID(),packageId:id,approvalId:command.approvalId,executed:false,externalContact:false,createdAt:new Date().toISOString()};this.applications.push(application);return{package:row,application,inventoryInitialized:false,externalActionsBlocked:true};
    }
    return this.applyPostgres(id,command,context);
  }
  async applyPostgres(id,command,context){
    const internal=this.store.internalStore;
    return internal.withTransaction(async(client)=>{
      const table=internal.table.bind(internal);
      const locked=await client.query(`select * from ${table('supplier_onboarding_packages')} where id=$1 for update`,[id]);
      const row=locked.rows[0];if(!row)return null;
      if(row.onboarding_model_version===VERSIONS.onboarding&&!this.config.supplyGraphWave1CatalogActivationEnabled)throw createSupplyGraphError('Wave 1 catalog activation is disabled.','SUPPLYGRAPH_WAVE1_CATALOG_ACTIVATION_DISABLED',503);
      if(row.status!=='pending_review'||Number(command.version)!==row.version)throw createSupplyGraphError('Package version is stale.','SUPPLYGRAPH_VERSION_CONFLICT',409);
      const approval=await client.query(`select status from ${table('approval_requests')} where id=$1`,[command.approvalId]);
      if(approval.rows[0]?.status!=='approved')throw createSupplyGraphError('Approved founder decision is required.','SUPPLYGRAPH_APPROVAL_REQUIRED',409);
      const seller=this.seller(row.supplier_canonical_key);if(!seller)throw createSupplyGraphError('Authorized seller is not in the pinned registry.','SUPPLYGRAPH_AUTHORIZED_SELLER_NOT_FOUND',404);
      const proposedProfile=row.proposed_profile||seller;
      let profile=await client.query(`select * from ${table('supplier_profiles')} where canonical_key=$1 for update`,[seller.canonicalKey]);
      let reused=true;
      if(!profile.rows[0]){
        reused=false;
        const hostname=seller.officialSourceUrl?new URL(seller.officialSourceUrl).hostname:null;
        profile=await client.query(`insert into ${table('supplier_profiles')}(canonical_key,canonical_name,supplier_type,country_code,emirate,status,website,source_type,source_reference,observed_at,verified_at,verification_status,metadata,seller_type,channel_type,official_website,website_hostname,authorization_status,authorization_basis,authorized_at,source_verification_status,catalog_capture_status,pipeline_source,pipeline_score,pipeline_priority,pipeline_wave,pipeline_segment,pipeline_onboarding_model,pipeline_channel_target,product_count,profile_source_checksum,profile_observed_at) values($1,$2,'unknown','AE',$3,'active',$4,'founder_attestation',$4,now(),now(),'human_verified',$5::jsonb,$6,$7,$4,$8,$9,$10,now(),$11,$12,$13,$14,$15,$16,$6,$17,$7,$18,$19,now()) returning *`,[seller.canonicalKey,seller.canonicalName,seller.geography,seller.officialSourceUrl,JSON.stringify({registryChecksum:REGISTRY_CHECKSUM}),seller.sellerType,seller.targetChannel,hostname,seller.authorizationStatus,seller.authorizationBasis,seller.sourceStatus==='reachable_official_source'?'source_verified':seller.sourceStatus,seller.captureStatus,seller.pipelineSource,seller.pipelineScore,seller.pipelinePriority,seller.pipelineWave,seller.onboardingModel,seller.catalogProductCount,seller.officialSourceUrl?sha256(seller.officialSourceUrl):null]);
      }
      const proposed=await client.query(`select * from ${table('supplier_onboarding_catalog_items')} where package_id=$1 order by identity_key`,[id]);
      let createdCatalogItems=0,reusedCatalogItems=0,productsSeeded=0,seedEventsReused=0;
      for(const item of proposed.rows){
        let catalog=await client.query(`select * from ${table('supplier_catalog_items')} where supplier_id=$1 and identity_key=$2 for update`,[profile.rows[0].id,item.identity_key]);
        if(!catalog.rows[0]){
          catalog=await client.query(`insert into ${table('supplier_catalog_items')}(supplier_id,identity_key,external_product_id,supplier_sku,normalized_name,display_name,brand,category,pack_size,unit_of_measure,temperature_zone,source_type,source_reference,source_checksum,active_observation) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'unknown','seller_public_catalog',$11,$12,true) returning *`,[profile.rows[0].id,item.identity_key,item.external_product_id,item.supplier_sku,item.normalized_name,item.display_name,item.brand,item.category,item.pack_size,item.unit_of_measure,item.product_page_url,item.source_checksum]);
          createdCatalogItems+=1;
        }else reusedCatalogItems+=1;
        const catalogId=catalog.rows[0].id;
        if(item.public_price!==null){
          const offerKey=`seller-public-price:${item.source_checksum}:${catalogId}`;
          await client.query(`insert into ${table('supplier_offer_snapshots')}(supplier_catalog_item_id,idempotency_key,currency,unit_price,stock_status,observed_at,source_type,source_reference,source_checksum,verification_status,metadata) values($1,$2,$3,$4,'unknown',$5,'seller_public_catalog',$6,$7,'source_verified',$8::jsonb) on conflict(idempotency_key) do nothing`,[catalogId,offerKey,item.currency,item.public_price,item.observed_at,item.product_page_url,item.source_checksum,JSON.stringify({priceType:item.price_type,wholesalePriceClaim:false})]);
        }
        for(const [position,url] of [item.primary_image_url,...(item.gallery_image_urls||[])].filter(Boolean).entries()){
          const mediaType=position===0?'primary':'gallery';const sourceChecksum=sha256(url);const hostname=new URL(url).hostname;
          await client.query(`insert into ${table('seller_product_media')}(seller_id,supplier_catalog_item_id,media_type,position,source_image_url,source_hostname,source_checksum,usage_basis,status,observed_at) values($1,$2,$3,$4,$5,$6,$7,$8,'source_verified',$9) on conflict do nothing`,[profile.rows[0].id,catalogId,mediaType,position,url,hostname,sourceChecksum,seller.authorizationStatus==='documented'?'seller_authorization_documented':'seller_authorization_founder_attestation',item.observed_at]);
        }
        if(this.config.supplyGraphSellerInventoryEnabled){
          const inventoryUnit=item.unit_of_measure||'seller_listing_unit';
          const existingSeed=await client.query(`select id from ${table('seller_inventory_ledger')} where seller_id=$1 and supplier_catalog_item_id=$2 and movement_type='initial_seed' limit 1`,[profile.rows[0].id,catalogId]);
          if(existingSeed.rows[0]){seedEventsReused+=1;continue;}
          const seedKey=`${VERSIONS.inventory}:${profile.rows[0].id}:${catalogId}:${LIMITS.initialProductStock}`;
          const ledger=await client.query(`insert into ${table('seller_inventory_ledger')}(seller_id,supplier_catalog_item_id,movement_type,quantity_delta,unit,source_type,source_reference,idempotency_key,authorization_basis,physical_count_verified,created_by,reason) values($1,$2,'initial_seed',$3,$4,'founder_authorized_initialization',$5,$6,'founder_attestation',false,$7,'v1.14 Wave 1 catalog activation; not a physical count') on conflict(idempotency_key) do nothing returning *`,[profile.rows[0].id,catalogId,LIMITS.initialProductStock,inventoryUnit,command.approvalId,seedKey,context.actorId||'founder']);
          if(ledger.rows[0]){await client.query(`insert into ${table('seller_inventory_balances')}(seller_id,supplier_catalog_item_id,on_hand_quantity,reserved_quantity,unit,physical_count_verified,initialization_source,last_ledger_event_id) values($1,$2,$3,0,$4,false,'founder_authorized_initialization',$5) on conflict(seller_id,supplier_catalog_item_id) do nothing`,[profile.rows[0].id,catalogId,LIMITS.initialProductStock,inventoryUnit,ledger.rows[0].id]);productsSeeded+=1;}else seedEventsReused+=1;
        }
      }
      if(this.config.supplyGraphSellerInventoryEnabled&&proposed.rows.length===0&&seller.catalogProductCount>0){
        const existingCatalog=await client.query(`select id from ${table('supplier_catalog_items')} where supplier_id=$1 and active_observation=true order by id`,[profile.rows[0].id]);
        for(const catalog of existingCatalog.rows){
          const seedKey=`supplygraph-inventory-v1.13:${profile.rows[0].id}:${catalog.id}`;
          const ledger=await client.query(`insert into ${table('seller_inventory_ledger')}(seller_id,supplier_catalog_item_id,movement_type,quantity_delta,unit,source_type,source_reference,idempotency_key,authorization_basis,physical_count_verified,created_by,reason) values($1,$2,'initial_seed',$3,'operational_units','founder_authorized_initialization',$4,$5,'founder_attestation',false,$6,'Founder-authorized operational initialization; not a physical count') on conflict(idempotency_key) do nothing returning *`,[profile.rows[0].id,catalog.id,LIMITS.initialProductStock,command.approvalId,seedKey,context.actorId||'founder']);
          if(ledger.rows[0]){await client.query(`insert into ${table('seller_inventory_balances')}(seller_id,supplier_catalog_item_id,on_hand_quantity,reserved_quantity,unit,physical_count_verified,initialization_source,last_ledger_event_id) values($1,$2,$3,0,'operational_units',false,'founder_authorized_initialization',$4) on conflict(seller_id,supplier_catalog_item_id) do nothing`,[profile.rows[0].id,catalog.id,LIMITS.initialProductStock,ledger.rows[0].id]);productsSeeded+=1;}else seedEventsReused+=1;
        }
      }
      const fingerprint=sha256(stable({packageId:id,version:row.version,approvalId:command.approvalId}));
      const resultStatus=proposed.rows.length?'applied':seller.catalogProductCount?'no_material_change':'applied_partial_catalog';
      const application=await client.query(`insert into ${table('supplier_onboarding_applications')}(package_id,application_fingerprint,preview_fingerprint,expected_package_version,result_status,supplier_id,created_catalog_items,reused_catalog_items,updated_catalog_items,skipped_catalog_items,conflict_count,reason_codes,applied_by) values($1,$2,$3,$4,$5,$6,$7,$8,0,0,0,$9::jsonb,$10) returning *`,[id,fingerprint,row.payload_fingerprint,row.version,resultStatus,profile.rows[0].id,createdCatalogItems,reusedCatalogItems,JSON.stringify([reused?'supplier_reused':'supplier_created',seller.captureStatus]),context.actorId||'founder']);
      await client.query(`update ${table('supplier_profiles')} set product_count=(select count(*) from ${table('supplier_catalog_items')} where supplier_id=$1),source_verification_status=$2,catalog_capture_status=$3,updated_at=now(),version=version+1 where id=$1`,[profile.rows[0].id,proposedProfile.sourceStatus==='source_verified'?'source_verified':(profile.rows[0].source_verification_status||proposedProfile.sourceStatus),proposedProfile.captureStatus||profile.rows[0].catalog_capture_status]);
      const updated=await client.query(`update ${table('supplier_onboarding_packages')} set status='applied',applied_at=now(),updated_at=now(),version=version+1,approval_request_id=$3 where id=$1 and version=$2 returning *`,[id,row.version,command.approvalId]);
      await this.store.appendAudit(client,{eventType:'supplygraph_seller_onboarding_applied',entityType:'supplier_onboarding_package',entityId:id,...context,metadata:{sellerKey:seller.canonicalKey,reusedSupplier:reused,executed:false,externalContact:false}});
      return{package:updated.rows[0],application:application.rows[0],supplier:profile.rows[0],inventoryInitialized:productsSeeded>0,productsSeeded,seedEventsReused,initialStockPerProduct:LIMITS.initialProductStock,physicalCountVerified:false,externalActionsBlocked:true};
    });
  }
  async listPackages(filters={}) {
    const limit=Math.min(Math.max(Number(filters.limit)||50,1),100);
    if(!this.isPostgres())return this.packages.filter((p)=>!filters.status||p.status===filters.status).slice(0,limit);
    const internal=this.store.internalStore;
    const result=await internal.pool.query(`select * from ${internal.table('supplier_onboarding_packages')} where ($1::text is null or status=$1) order by created_at desc limit $2`,[filters.status||null,limit]);
    return result.rows;
  }
  async getPackage(id){
    if(!this.isPostgres())return this.packages.find((p)=>p.id===id)||null;
    const internal=this.store.internalStore;const result=await internal.pool.query(`select * from ${internal.table('supplier_onboarding_packages')} where id=$1`,[id]);return result.rows[0]||null;
  }
  async cancel(id,command={},context={}){
    this.assertEnabled('onboarding');
    if(!this.isPostgres()){const row=this.packages.find((p)=>p.id===id);if(!row)return null;if(row.status!=='pending_review'||Number(command.version)!==row.version)throw createSupplyGraphError('Package version is stale.','SUPPLYGRAPH_VERSION_CONFLICT',409);Object.assign(row,{status:'cancelled',version:row.version+1,closedAt:new Date().toISOString()});return row;}
    const internal=this.store.internalStore;return internal.withTransaction(async(client)=>{const result=await client.query(`update ${internal.table('supplier_onboarding_packages')} set status='cancelled',closed_at=now(),updated_at=now(),version=version+1 where id=$1 and status='pending_review' and version=$2 returning *`,[id,Number(command.version)]);if(!result.rows[0])throw createSupplyGraphError('Package version is stale.','SUPPLYGRAPH_VERSION_CONFLICT',409);await this.store.appendAudit(client,{eventType:'supplygraph_seller_onboarding_cancelled',entityType:'supplier_onboarding_package',entityId:id,...context});return result.rows[0];});
  }
  async persistedSellers(filters={}){if(!this.isPostgres())return this.registry(filters);return this.store.listSuppliers({...filters,limit:filters.limit||100});}
  async persistedSeller(id){if(!this.isPostgres())return this.seller(id);return this.store.getSupplier(id);}
  async sellerCatalog(id,filters={}){if(!this.isPostgres())return[];return this.store.listCatalog({supplierId:id,limit:filters.limit||100,offset:filters.offset});}
  async product(id){if(!this.isPostgres())return null;const input=await this.store.getCatalogEvidenceInputs(id);return input?.catalogItem||null;}
  async inventory(filters={}){if(!this.isPostgres())return[];const internal=this.store.internalStore;const limit=Math.min(Math.max(Number(filters.limit)||100,1),100);const values=[];let where='';if(filters.sellerId){values.push(filters.sellerId);where=`where b.seller_id=$${values.length}`;}if(filters.productId){values.push(filters.productId);where+=`${where?' and':'where'} b.supplier_catalog_item_id=$${values.length}`;}values.push(limit);const result=await internal.pool.query(`select b.seller_id,b.supplier_catalog_item_id,b.on_hand_quantity,b.reserved_quantity,b.available_quantity,b.unit,b.physical_count_verified,b.initialization_source,b.updated_at,b.version from ${internal.table('seller_inventory_balances')} b ${where} order by b.updated_at desc limit $${values.length}`,values);return result.rows.map(safeCamel);}
  async media(filters={}){if(!this.isPostgres())return[];const internal=this.store.internalStore;const limit=Math.min(Math.max(Number(filters.limit)||100,1),100);const values=[];let where='';if(filters.sellerId){values.push(filters.sellerId);where=`where seller_id=$${values.length}`;}if(filters.productId){values.push(filters.productId);where+=`${where?' and':'where'} supplier_catalog_item_id=$${values.length}`;}values.push(limit);const result=await internal.pool.query(`select id,seller_id,supplier_catalog_item_id,media_type,position,source_image_url,source_hostname,source_checksum,managed_asset_url,asset_checksum,mime_type,file_size_bytes,usage_basis,status,observed_at,imported_at from ${internal.table('seller_product_media')} ${where} order by supplier_catalog_item_id,position limit $${values.length}`,values);return result.rows.map(safeCamel);}
  async coverageResults(filters={}){if(!this.isPostgres())return this.coverage();const internal=this.store.internalStore;const limit=Math.min(Math.max(Number(filters.limit)||100,1),100);const values=[];let where='';if(filters.matchRunId){values.push(filters.matchRunId);where=`where match_run_id=$${values.length}`;}values.push(limit);const result=await internal.pool.query(`select * from ${internal.table('sourcing_supplier_coverage_results')} ${where} order by coverage_ratio desc,supplier_id limit $${values.length}`,values);return result.rows.map(safeCamel);}
  async readiness(){const sellers=await this.persistedSellers({limit:100});return sellers.map((seller)=>({sellerId:seller.id||seller.canonicalKey,canonicalKey:seller.canonicalKey,catalogReady:Number(seller.productCount||seller.catalogProductCount||0)>0,comparisonReady:Number(seller.productCount||seller.catalogProductCount||0)>0,authorizationStatus:seller.authorizationStatus,sourceVerificationStatus:seller.sourceVerificationStatus||seller.captureStatus||'unknown'}));}
  async catalogGaps(){const readiness=await this.readiness();return readiness.filter((item)=>!item.catalogReady).map((item)=>({...item,gap:'public_catalog_not_captured'}));}
  async wave1Activation(){
    const fallback=WAVE1_SELLERS.map((seller)=>({sellerId:seller.canonicalKey,canonicalKey:seller.canonicalKey,canonicalName:seller.canonicalName,activationOrder:seller.activationOrder,pipelineScore:seller.pipelineScore,pipelinePriority:seller.pipelinePriority,sourceVerificationStatus:seller.sourceStatus,captureStatus:seller.captureStatus,productCount:seller.catalogProductCount,publicPriceCount:seller.catalogProductCount,imageCount:0,managedMediaCount:0,inventoryProductCount:seller.catalogProductCount,physicalCountVerifiedCount:0,catalogReady:seller.catalogProductCount>0,comparisonReady:seller.catalogProductCount>0,blocker:seller.catalogProductCount?null:'public_catalog_not_captured'}));
    if(!this.isPostgres())return{status:'local_registry',sellerCount:14,sellers:fallback,...this.wave1Safety()};
    try{
      const t=this.store.internalStore.table.bind(this.store.internalStore);const keys=WAVE1_SELLERS.map((seller)=>seller.canonicalKey);
      const result=await this.store.internalStore.pool.query(`select p.id,p.canonical_key,p.canonical_name,p.source_verification_status,p.catalog_capture_status,p.product_count,
        count(distinct o.id)::int public_price_count,count(distinct m.id) filter(where m.status in ('source_verified','imported'))::int image_count,
        count(distinct m.supplier_catalog_item_id) filter(where m.status='imported' and m.managed_asset_url is not null)::int managed_media_count,
        count(distinct b.supplier_catalog_item_id)::int inventory_product_count,count(distinct b.supplier_catalog_item_id) filter(where b.physical_count_verified)::int physical_count_verified_count
        from ${t('supplier_profiles')} p left join ${t('supplier_catalog_items')} c on c.supplier_id=p.id and c.active_observation=true
        left join ${t('supplier_offer_snapshots')} o on o.supplier_catalog_item_id=c.id left join ${t('seller_product_media')} m on m.supplier_catalog_item_id=c.id
        left join ${t('seller_inventory_balances')} b on b.supplier_catalog_item_id=c.id where p.canonical_key=any($1::text[])
        group by p.id order by p.canonical_key`,[keys]);
      const byKey=new Map(result.rows.map((row)=>[row.canonical_key,row]));
      const sellers=WAVE1_SELLERS.map((seller)=>{const row=byKey.get(seller.canonicalKey);if(!row)return fallback.find((item)=>item.canonicalKey===seller.canonicalKey);const productCount=Number(row.product_count||0);return{sellerId:row.id,canonicalKey:seller.canonicalKey,canonicalName:seller.canonicalName,activationOrder:seller.activationOrder,pipelineScore:seller.pipelineScore,pipelinePriority:seller.pipelinePriority,sourceVerificationStatus:row.source_verification_status||'unknown',captureStatus:row.catalog_capture_status||'unknown',productCount,publicPriceCount:Number(row.public_price_count||0),imageCount:Number(row.image_count||0),managedMediaCount:Number(row.managed_media_count||0),inventoryProductCount:Number(row.inventory_product_count||0),physicalCountVerifiedCount:Number(row.physical_count_verified_count||0),catalogReady:productCount>0,comparisonReady:productCount>0,blocker:productCount?null:'public_catalog_not_captured'};});
      return{status:'ready',sellerCount:14,sellers,...this.wave1Safety()};
    }catch(_error){return{status:'unavailable',sellerCount:14,sellers:fallback,warnings:['WAVE1_ACTIVATION_QUERY_UNAVAILABLE'],...this.wave1Safety()};}
  }
  wave1Safety(){return{wave1ActivationEnabled:Boolean(this.config.supplyGraphWave1CatalogActivationEnabled),writesBlocked:!this.config.supplyGraphWave1CatalogActivationEnabled,captureRuntimeNetworkCalls:false,externalContactBlocked:true,marketComparisonPerformed:false,marketCompletenessClaim:false,bestSupplierClaim:false,basketOptimizerStatus:'deferred_v1.15'};}
  async catalogHealth(id){const seller=await this.persistedSeller(id);if(!seller)return null;const [items,inventory,media]=await Promise.all([this.sellerCatalog(id,{limit:100}),this.inventory({sellerId:id,limit:100}),this.media({sellerId:id,limit:100})]);return{sellerId:id,canonicalKey:seller.canonicalKey,productCount:Number(seller.productCount||items.length),publicPriceCount:items.filter((item)=>item.latestOffer?.unitPrice!==null&&item.latestOffer?.unitPrice!==undefined).length,mediaCount:media.length,inventoryProductCount:inventory.length,physicalCountVerifiedCount:inventory.filter((item)=>item.physicalCountVerified).length,catalogReady:items.length>0,comparisonReady:items.length>0,stockSource:'cornerops_operational_inventory',physicalCountVerified:false,...this.wave1Safety()};}
  async mediaCoverage(){const activation=await this.wave1Activation();const products=activation.sellers.reduce((sum,seller)=>sum+seller.productCount,0),references=activation.sellers.reduce((sum,seller)=>sum+seller.imageCount,0),managed=activation.sellers.reduce((sum,seller)=>sum+seller.managedMediaCount,0);return{productCount:products,officialImageReferenceCount:references,productsWithManagedMedia:managed,productsWithoutManagedMedia:Math.max(products-managed,0),...this.wave1Safety()};}
  async inventoryInitializationStatus(){const activation=await this.wave1Activation();return{productsWithInitializedInventory:activation.sellers.reduce((sum,seller)=>sum+seller.inventoryProductCount,0),physicallyVerifiedProducts:activation.sellers.reduce((sum,seller)=>sum+seller.physicalCountVerifiedCount,0),initialQuantityPerProduct:LIMITS.initialProductStock,inventorySource:'founder_authorized_initialization',stockSource:'cornerops_operational_inventory',physicalCountVerified:false,...this.wave1Safety()};}
  wave1Recommendations(activation){
    return activation.sellers.flatMap((seller)=>{
      const base={sourceType:'supplygraph_wave1',sourceId:seller.sellerId,priority:seller.pipelinePriority?.startsWith('A')?'high':'medium',approvalRequired:false,safePayload:{internalOnly:true,executed:false,externalActionAllowed:false,supplierContactAllowed:false,customerContactAllowed:false}};const rows=[];
      if(!seller.catalogReady)rows.push({...base,idempotencyKey:`wave1-capture:${seller.canonicalKey}:${seller.captureStatus}`,sourceFlow:'supplygraph_wave1_capture_blocked_flow',actionType:'review_wave1_catalog_capture',title:`Review Wave 1 catalog capture: ${seller.canonicalName}`,evidence:{conditionActive:true,sellerKey:seller.canonicalKey,blocker:seller.blocker||'public_catalog_not_captured'}});
      if(seller.catalogReady&&seller.imageCount<seller.productCount)rows.push({...base,idempotencyKey:`wave1-media:${seller.canonicalKey}:${seller.productCount}:${seller.imageCount}`,sourceFlow:'supplygraph_wave1_media_quality_flow',actionType:'review_wave1_missing_media',title:`Review Wave 1 missing media: ${seller.canonicalName}`,evidence:{conditionActive:true,sellerKey:seller.canonicalKey,productCount:seller.productCount,imageCount:seller.imageCount}});
      if(seller.catalogReady&&seller.inventoryProductCount<seller.productCount)rows.push({...base,idempotencyKey:`wave1-inventory:${seller.canonicalKey}:${seller.productCount}:${seller.inventoryProductCount}`,sourceFlow:'supplygraph_wave1_inventory_flow',actionType:'review_wave1_inventory_initialization',title:`Review Wave 1 inventory initialization: ${seller.canonicalName}`,evidence:{conditionActive:true,sellerKey:seller.canonicalKey,productCount:seller.productCount,inventoryProductCount:seller.inventoryProductCount}});
      return rows;
    });
  }
  async syncWave1WorkQueue(context={}){if(!this.isPostgres())return{items:[],recommendations:this.wave1Recommendations(await this.wave1Activation())};const activation=await this.wave1Activation();return this.store.internalStore.syncRecommendations(this.wave1Recommendations(activation),{...context,sourceType:'supplygraph_wave1',sourceId:'wave1-v1.14'});}
  coverage() { return SELLERS.map((seller)=>({sellerKey:seller.canonicalKey,productCount:seller.catalogProductCount,coverageStatus:seller.catalogProductCount?'catalog_available':'catalog_unavailable',splitSourcingPotential:false,marketComparisonPerformed:false})); }
}
module.exports={AuthorizedSellerNetworkService};
