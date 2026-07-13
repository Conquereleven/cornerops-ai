const { createSupplyGraphError }=require('./supplyGraphTypes');
const { LIMITS, VERSIONS }=require('./authorizedSellerRules');
class SellerInventoryService{
  constructor({internalStore,config={}}={}){this.store=internalStore;this.config=config;}
  async initialize({sellerId,catalogItemIds=[],approvalId,actorId='founder'}={}){
    if(!this.config.supplyGraphSellerInventoryEnabled)throw createSupplyGraphError('Seller inventory is disabled.','SUPPLYGRAPH_SELLER_INVENTORY_DISABLED',503);
    if(!approvalId)throw createSupplyGraphError('Founder approval is required.','SUPPLYGRAPH_APPROVAL_REQUIRED',409);
    if(!this.store?.withTransaction)throw createSupplyGraphError('Inventory persistence is unavailable.','SUPPLYGRAPH_PERSISTENCE_CONFIGURATION_REQUIRED',503);
    return this.store.withTransaction(async(client)=>{
      const approval=await client.query(`select status from ${this.store.table('approval_requests')} where id=$1`,[approvalId]);if(approval.rows[0]?.status!=='approved')throw createSupplyGraphError('Approved founder decision is required.','SUPPLYGRAPH_APPROVAL_REQUIRED',409);
      let created=0,reused=0;
      for(const catalogItemId of [...new Set(catalogItemIds)].sort()){
        const existingSeed=await client.query(`select id from ${this.store.table('seller_inventory_ledger')} where seller_id=$1 and supplier_catalog_item_id=$2 and movement_type='initial_seed' limit 1`,[sellerId,catalogItemId]);
        if(existingSeed.rows[0]){reused+=1;continue;}
        const key=`${VERSIONS.inventory}:${sellerId}:${catalogItemId}:${LIMITS.initialProductStock}`;
        const ledger=await client.query(`insert into ${this.store.table('seller_inventory_ledger')}(seller_id,supplier_catalog_item_id,movement_type,quantity_delta,unit,source_type,source_reference,idempotency_key,authorization_basis,physical_count_verified,created_by,reason) values($1,$2,'initial_seed',$3,'seller_listing_unit','founder_authorized_initialization',$4,$5,'founder_attestation',false,$6,'v1.14 Wave 1 catalog activation; not a physical count') on conflict(idempotency_key) do nothing returning *`,[sellerId,catalogItemId,LIMITS.initialProductStock,approvalId,key,actorId]);
        if(!ledger.rows[0]){reused+=1;continue;}
        await client.query(`insert into ${this.store.table('seller_inventory_balances')}(seller_id,supplier_catalog_item_id,on_hand_quantity,reserved_quantity,unit,physical_count_verified,initialization_source,last_ledger_event_id) values($1,$2,$3,0,'seller_listing_unit',false,'founder_authorized_initialization',$4) on conflict(seller_id,supplier_catalog_item_id) do nothing`,[sellerId,catalogItemId,LIMITS.initialProductStock,ledger.rows[0].id]);created+=1;
      }
      await this.store.appendAudit(client,{eventType:'supplygraph_inventory_initialized',entityType:'seller_inventory',entityId:sellerId,actorType:'founder',actorId,metadata:{modelVersion:VERSIONS.inventory,created,reused,initialUnits:LIMITS.initialProductStock,physicalCountVerified:false}});
      return{created,reused,initialUnits:LIMITS.initialProductStock,physicalCountVerified:false,executed:false,externalActionsBlocked:true};
    });
  }
}
module.exports={SellerInventoryService};
