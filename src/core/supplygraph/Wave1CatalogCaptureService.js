const { sha256, normalizeKey } = require('./supplyGraphTypes');
const { LIMITS, VERSIONS } = require('./authorizedSellerRules');
const { WAVE1_CAPTURE_ADAPTERS } = require('./wave1CaptureAdapters');

const stripHtml = (value='') => String(value).replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#8217;/g,"'").replace(/\s+/g,' ').trim();
const absoluteUrl = (value, base) => { try { return new URL(value, base).toString(); } catch { return null; } };
const cents = (value) => { const number=Number(value); return Number.isFinite(number)?number/100:null; };
const productTypeFor = (name, fallback='grocery_product') => /honey|oil|rice|flour|sauce|paste|beans|milk|tea|granola|pickle|tortilla|chips/i.test(name)?'packaged_food':fallback;

class Wave1CatalogCaptureService {
  constructor({ fetchImpl=global.fetch, now=()=>new Date() }={}) { this.fetchImpl=fetchImpl;this.now=now; }
  assertOfficial(adapter, url) {
    const parsed=new URL(url);
    if(/(^|\.)google\./i.test(parsed.hostname)||!adapter.allowedHostnames.includes(parsed.hostname)) throw new Error('SUPPLYGRAPH_OFFICIAL_SOURCE_REQUIRED');
  }
  async fetchOfficial(adapter) {
    if(adapter.parser==='unsupported') return {status:'blocked',reason:adapter.unsupportedReason,products:[],pagesScanned:0};
    this.assertOfficial(adapter,adapter.catalogSourceUrl);
    const response=await this.fetchImpl(adapter.catalogSourceUrl,{headers:{accept:adapter.parser==='verified_html_menu'?'text/html':'application/json'}});
    if(!response.ok) return {status:[401,403].includes(response.status)?'blocked_by_public_access':'unavailable',reason:`HTTP_${response.status}`,products:[],pagesScanned:1};
    const source=await response.text();const observedAt=this.now().toISOString();const sourceChecksum=sha256(source);
    let products=[];
    if(adapter.parser==='woocommerce_store_api')products=this.parseWoo(source,adapter,observedAt,sourceChecksum);
    if(adapter.parser==='shopify_products_json')products=this.parseShopify(source,adapter,observedAt,sourceChecksum);
    if(adapter.parser==='verified_html_menu')products=this.parseVerifiedMenu(source,adapter,observedAt,sourceChecksum);
    return {status:products.length?'complete':'validation_failed',products:products.slice(0,LIMITS.maxProductsPerSeller),pagesScanned:1,sourceChecksum,observedAt};
  }
  baseProduct(adapter,{name,url,price,currency='AED',priceType='public_web_price',image=null,packSize=null,description=null,productType='grocery_product',externalProductId=null,sku=null}){
    const sourceUrl=absoluteUrl(url,adapter.catalogSourceUrl||adapter.profileSourceUrl);this.assertOfficial(adapter,sourceUrl);
    const resolvedImage=image&&absoluteUrl(image,adapter.catalogSourceUrl||adapter.profileSourceUrl);const imageHostname=resolvedImage?new URL(resolvedImage).hostname:null;
    return {productType,externalProductId,supplierSku:sku,displayName:stripHtml(name),normalizedName:normalizeKey(stripHtml(name)).replace(/-/g,' '),description:stripHtml(description)||null,brand:null,category:null,packSize,unitOfMeasure:packSize||'seller_listing_unit',publicPrice:price,currency:price===null?null:currency,priceType:price===null?null:priceType,publicAvailabilityLabel:null,productPageUrl:sourceUrl,primaryImageUrl:imageHostname&&adapter.allowedMediaHostnames.includes(imageHostname)?resolvedImage:null,galleryImageUrls:[],observedAt:null,sourceChecksum:null};
  }
  finish(product,observedAt,sourceChecksum){return{...product,observedAt,sourceChecksum};}
  parseWoo(source,adapter,observedAt,sourceChecksum){const rows=JSON.parse(source);return rows.filter((row)=>row?.name&&row?.permalink&&!/^delivery charge/i.test(row.name)).map((row)=>{const price=cents(row.prices?.price);const pack=(row.name.match(/\b\d+(?:\.\d+)?\s*(?:kg|g|gm|ml|l|ltr|pcs?|pc)\b/i)||[])[0]||null;return this.finish(this.baseProduct(adapter,{name:row.name,url:row.permalink,price,currency:row.prices?.currency_code||'AED',image:row.images?.[0]?.src||null,packSize:pack,description:row.short_description||row.description,productType:productTypeFor(row.name,'fresh_produce'),externalProductId:String(row.id||'')}),observedAt,sourceChecksum);});}
  parseShopify(source,adapter,observedAt,sourceChecksum){const rows=JSON.parse(source).products||[];return rows.filter((row)=>row?.title&&row?.handle).map((row)=>{const variant=row.variants?.[0]||{};const price=variant.price===undefined?null:Number(variant.price);const pack=(row.title.match(/\b\d+(?:\.\d+)?\s*(?:kg|g|gm|ml|l|ltr|pcs?|pc)\b/i)||[])[0]||null;return this.finish(this.baseProduct(adapter,{name:row.title,url:`/products/${row.handle}`,price:Number.isFinite(price)?price:null,image:row.images?.[0]?.src||null,packSize:pack,description:row.body_html,productType:productTypeFor(row.title,'fresh_produce'),externalProductId:String(row.id||''),sku:variant.sku||null}),observedAt,sourceChecksum);});}
  parseVerifiedMenu(source,adapter,observedAt,sourceChecksum){const text=stripHtml(source).toLowerCase();return adapter.officialMenuItems.filter(([name,price])=>text.includes(name.toLowerCase())&&text.includes(String(price))).map(([name,price],index)=>this.finish(this.baseProduct(adapter,{name,url:`${adapter.catalogSourceUrl}#${normalizeKey(name)}`,price,priceType:'public_menu_price',productType:'restaurant_menu_item',externalProductId:`menu-${index+1}`}),observedAt,sourceChecksum));}
  async capture(canonicalKey){const adapter=WAVE1_CAPTURE_ADAPTERS[canonicalKey];if(!adapter)throw new Error('SUPPLYGRAPH_WAVE1_ADAPTER_NOT_FOUND');const result=await this.fetchOfficial(adapter);return{schemaVersion:VERSIONS.snapshot,sellerCanonicalKey:canonicalKey,...result};}
}

module.exports={Wave1CatalogCaptureService};
