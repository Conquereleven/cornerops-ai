const { createHash }=require('crypto');
const { createSupplyGraphError }=require('./supplyGraphTypes');
const { LIMITS,VERSIONS }=require('./authorizedSellerRules');
const { WAVE1_CAPTURE_ADAPTERS }=require('./wave1CaptureAdapters');

const DEFAULT_MEDIA_HOSTNAMES=new Set(Object.values(WAVE1_CAPTURE_ADAPTERS).flatMap((adapter)=>adapter.allowedMediaHostnames||[]));

const mimeFromBytes=(buffer)=>{
  if(buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)return'image/jpeg';
  if(buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return'image/png';
  if(buffer.length>=12&&buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP')return'image/webp';
  return null;
};
const extensionFor=(mime)=>({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[mime];

class SellerMediaImportService{
  constructor({internalStore,storage,fetchImpl=global.fetch,config={},bucket='seller-product-assets',publicAssets=false,allowedMediaHostnames=DEFAULT_MEDIA_HOSTNAMES}={}){this.store=internalStore;this.storage=storage;this.fetchImpl=fetchImpl;this.config=config;this.bucket=bucket;this.publicAssets=publicAssets;this.allowedMediaHostnames=new Set(allowedMediaHostnames);}
  validate(buffer,declaredMime){if(!buffer.length||buffer.length>LIMITS.maxImageBytes)throw createSupplyGraphError('Media size violates policy.','SUPPLYGRAPH_MEDIA_POLICY_DENIED',415);const detected=mimeFromBytes(buffer);if(!detected||detected!==String(declaredMime||'').split(';')[0].toLowerCase())throw createSupplyGraphError('Media MIME or magic bytes are invalid.','SUPPLYGRAPH_MEDIA_POLICY_DENIED',415);return detected;}
  async importRow(row,{actorId='founder'}={}){
    if(!this.config.supplyGraphSellerMediaEnabled)throw createSupplyGraphError('Seller media import is disabled.','SUPPLYGRAPH_SELLER_MEDIA_DISABLED',503);
    if(!this.storage||!this.store?.withTransaction)throw createSupplyGraphError('Managed media persistence is unavailable.','SUPPLYGRAPH_MEDIA_PERSISTENCE_REQUIRED',503);
    const url=new URL(row.sourceImageUrl);if(url.protocol!=='https:'||url.hostname!==row.sourceHostname||!this.allowedMediaHostnames.has(url.hostname))throw createSupplyGraphError('Media source hostname mismatch.','SUPPLYGRAPH_MEDIA_SOURCE_DENIED',422);
    const response=await this.fetchImpl(url,{headers:{accept:'image/jpeg,image/png,image/webp'},signal:AbortSignal.timeout(10000)});if(!response.ok)throw createSupplyGraphError('Media source request failed.','SUPPLYGRAPH_MEDIA_SOURCE_UNAVAILABLE',424);
    const finalUrl=new URL(response.url||url);if(finalUrl.protocol!=='https:'||!this.allowedMediaHostnames.has(finalUrl.hostname))throw createSupplyGraphError('Media redirect left the approved hostname allowlist.','SUPPLYGRAPH_MEDIA_SOURCE_DENIED',422);
    const buffer=Buffer.from(await response.arrayBuffer());const mime=this.validate(buffer,response.headers.get('content-type'));const checksum=createHash('sha256').update(buffer).digest('hex');const storagePath=`${row.sellerId}/${row.supplierCatalogItemId}/${checksum}.${extensionFor(mime)}`;
    const bucket=this.storage.from(this.bucket);const upload=await bucket.upload(storagePath,buffer,{contentType:mime,upsert:false,cacheControl:'31536000'});if(upload.error&&!/already exists|duplicate/i.test(upload.error.message||''))throw createSupplyGraphError('Managed media upload failed.','SUPPLYGRAPH_MEDIA_UPLOAD_FAILED',502);const publicUrl=this.publicAssets?bucket.getPublicUrl(storagePath).data.publicUrl:null;
    return this.store.withTransaction(async(client)=>{const updated=await client.query(`update ${this.store.table('seller_product_media')} set managed_storage_path=$2,managed_asset_url=$3,asset_checksum=$4,mime_type=$5,file_size_bytes=$6,status='imported',imported_at=now() where id=$1 and status='source_verified' returning *`,[row.id,storagePath,publicUrl,checksum,mime,buffer.length]);if(!updated.rows[0])return{reused:true,mediaId:row.id,storagePath,publicUrl};await this.store.appendAudit(client,{eventType:'supplygraph_seller_media_imported',entityType:'seller_product_media',entityId:row.id,actorType:'founder',actorId,metadata:{modelVersion:VERSIONS.media,assetChecksum:checksum,mimeType:mime,fileSizeBytes:buffer.length,storagePath}});return{reused:Boolean(upload.error),mediaId:row.id,storagePath,publicUrl,assetChecksum:checksum,mimeType:mime,fileSizeBytes:buffer.length};});
  }
}
module.exports={SellerMediaImportService,mimeFromBytes};
