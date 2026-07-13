const { boundedString, createSupplyGraphError, normalizeKey }=require('./supplyGraphTypes');
const { LIMITS, VERSIONS }=require('./authorizedSellerRules');
const PRODUCT_TYPES=new Set(['grocery_product','fresh_produce','prepared_food','meal_kit','catering_product','beverage','bakery_product','frozen_product','packaged_food','restaurant_menu_item','service_bundle']);
const fail=(message,code)=>{throw createSupplyGraphError(message,code,422);};
class SellerSnapshotValidator{
  product(input={}){
    const displayName=boundedString(input.displayName,300);const productPageUrl=boundedString(input.productPageUrl,1000);
    if(!displayName||!productPageUrl)fail('Publicly offered product requires displayName and productPageUrl.','SUPPLYGRAPH_SELLER_PRODUCT_REQUIRED');
    try{if(new URL(productPageUrl).protocol!=='https:')fail('Product source URL must use HTTPS.','SUPPLYGRAPH_SOURCE_URL_INVALID');}catch(error){if(error.code)throw error;fail('Product source URL is invalid.','SUPPLYGRAPH_SOURCE_URL_INVALID');}
    if(!PRODUCT_TYPES.has(input.productType))fail('Product type is not allowed.','SUPPLYGRAPH_SELLER_PRODUCT_TYPE_INVALID');
    const images=[input.primaryImageUrl,...(Array.isArray(input.galleryImageUrls)?input.galleryImageUrls:[])].filter(Boolean);
    if(images.length>LIMITS.maxImagesPerProduct)fail('Product image reference limit exceeded.','SUPPLYGRAPH_CAPTURE_LIMIT_EXCEEDED');
    const publicPrice=input.publicPrice===null||input.publicPrice===undefined?null:Number(input.publicPrice);
    if(publicPrice!==null&&(!Number.isFinite(publicPrice)||publicPrice<0))fail('Public price is invalid.','SUPPLYGRAPH_PUBLIC_PRICE_INVALID');
    const allowedPriceTypes=new Set(['public_web_price','public_menu_price']);
    if(publicPrice!==null&&!allowedPriceTypes.has(input.priceType))fail('Public prices must use an allowed public evidence label.','SUPPLYGRAPH_PRICE_TYPE_INVALID');
    if(publicPrice!==null&&!/^[A-Z]{3}$/.test(String(input.currency||'')))fail('Public price requires ISO currency.','SUPPLYGRAPH_PRICE_CURRENCY_REQUIRED');
    const observedAt=new Date(input.observedAt);if(Number.isNaN(observedAt.getTime()))fail('Product observation timestamp is invalid.','SUPPLYGRAPH_OBSERVED_AT_INVALID');
    const sourceChecksum=String(input.sourceChecksum||'').toLowerCase();if(!/^[a-f0-9]{64}$/.test(sourceChecksum))fail('Product source checksum is invalid.','SUPPLYGRAPH_SOURCE_CHECKSUM_INVALID');
    return{productType:input.productType,externalProductId:boundedString(input.externalProductId,160)||null,supplierSku:boundedString(input.supplierSku,160)||null,
      displayName,normalizedName:boundedString(input.normalizedName,300)||normalizeKey(displayName).replace(/-/g,' '),description:boundedString(input.description,2000)||null,
      brand:boundedString(input.brand,160)||null,category:boundedString(input.category,160)||null,packSize:boundedString(input.packSize,120)||null,unitOfMeasure:boundedString(input.unitOfMeasure,80)||null,
      publicPrice,currency:publicPrice===null?null:String(input.currency),priceType:publicPrice===null?null:input.priceType,publicAvailabilityLabel:boundedString(input.publicAvailabilityLabel,120)||null,
      productPageUrl,primaryImageUrl:boundedString(input.primaryImageUrl,1000)||null,galleryImageUrls:images.filter((url)=>url!==input.primaryImageUrl).slice(0,2).map((url)=>boundedString(url,1000)),
      observedAt:observedAt.toISOString(),sourceChecksum};
  }
  snapshot(input={}){
    if(input.schemaVersion!==VERSIONS.snapshot)fail('Snapshot schema version is invalid.','SUPPLYGRAPH_SNAPSHOT_VERSION_INVALID');
    const products=Array.isArray(input.products)?input.products:[];if(products.length>LIMITS.maxProductsPerSeller)fail('Seller product limit exceeded.','SUPPLYGRAPH_CAPTURE_LIMIT_EXCEEDED');
    const normalized=products.map((item)=>this.product(item));const identities=normalized.map((item)=>item.externalProductId?`external:${item.externalProductId}`:item.supplierSku?`sku:${item.supplierSku}`:item.productPageUrl?`url:${item.productPageUrl}`:normalizeKey(`${item.displayName}-${item.brand||''}-${item.packSize||''}`));
    if(new Set(identities).size!==identities.length)fail('Snapshot contains duplicate product identities.','SUPPLYGRAPH_SELLER_PRODUCT_DUPLICATE');
    return{schemaVersion:input.schemaVersion,sellerCanonicalKey:normalizeKey(input.sellerCanonicalKey),products:normalized};
  }
}
module.exports={PRODUCT_TYPES,SellerSnapshotValidator};
