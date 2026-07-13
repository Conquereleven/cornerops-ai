const { LIMITS } = require('./authorizedSellerRules');
const { createSupplyGraphError } = require('./supplyGraphTypes');

class SellerCatalogCapturePolicy {
  validateBatch({ sellers=[], products=[], images=[] }={}) {
    if(sellers.length>LIMITS.maxSellers||products.length>LIMITS.maxTotalProducts||images.length>LIMITS.maxImagesTotal)throw createSupplyGraphError('Capture batch exceeds a hard limit.','SUPPLYGRAPH_CAPTURE_LIMIT_EXCEEDED',413);
    const bySeller=new Map();const byProduct=new Map();
    products.forEach((product)=>bySeller.set(product.sellerKey,(bySeller.get(product.sellerKey)||0)+1));
    images.forEach((image)=>{if(!['image/jpeg','image/png','image/webp'].includes(image.mediaType)||Number(image.byteSize)>LIMITS.maxImageBytes)throw createSupplyGraphError('Media violates capture policy.','SUPPLYGRAPH_MEDIA_POLICY_DENIED',415);byProduct.set(image.productKey,(byProduct.get(image.productKey)||0)+1);});
    if([...bySeller.values()].some((count)=>count>LIMITS.maxProductsPerSeller)||[...byProduct.values()].some((count)=>count>LIMITS.maxImagesPerProduct))throw createSupplyGraphError('Per-entity capture limit exceeded.','SUPPLYGRAPH_CAPTURE_LIMIT_EXCEEDED',413);
    return {valid:true,limits:LIMITS};
  }
  classifyHttp(status){if([401,403].includes(Number(status)))return{retry:false,status:'blocked_auth_or_access'};if(Number(status)===429||Number(status)>=500)return{retry:true,maxRetries:LIMITS.retryCount};return{retry:false,status:'terminal'};}
}
module.exports={SellerCatalogCapturePolicy};
