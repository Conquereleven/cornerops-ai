const crypto=require('crypto');
const {AuthorizedSellerNetworkService,SellerSnapshotValidator,Wave1CatalogCaptureService,WAVE1_ACTIVATION_ORDER,WAVE1_CAPTURE_ADAPTERS,WAVE1_SELLERS,VERSIONS}=require('../src/core/supplygraph');

const response=(body,status=200)=>({ok:status>=200&&status<300,status,text:async()=>typeof body==='string'?body:JSON.stringify(body)});

describe('SupplyGraph Wave 1 v1.14',()=>{
  test('registry contains exactly 14 deterministic Wave 1 sellers and preserves Intermex once',()=>{
    expect(WAVE1_SELLERS).toHaveLength(14);expect(new Set(WAVE1_ACTIVATION_ORDER).size).toBe(14);
    expect(WAVE1_ACTIVATION_ORDER.filter((key)=>key==='intermex-uae')).toHaveLength(1);
    expect(WAVE1_SELLERS.map((seller)=>seller.activationOrder)).toEqual([...Array(14)].map((_,index)=>index+1));
    expect(WAVE1_SELLERS.find((seller)=>seller.canonicalKey==='intermex-uae').pipelineScore).toBe(85);
  });
  test('all 13 non-Intermex sellers have bounded adapters',()=>{
    expect(Object.keys(WAVE1_CAPTURE_ADAPTERS)).toHaveLength(13);
    for(const adapter of Object.values(WAVE1_CAPTURE_ADAPTERS)){expect(adapter.maxPages).toBe(1);expect(adapter.unsupportedBehavior).toBe('record_blocker_and_continue');}
  });
  test('official WooCommerce products preserve public web price and source checksum',async()=>{
    const payload=[{id:42,name:'Organic Tomato 500g',permalink:'https://greenheartuae.com/product/tomato/',prices:{price:'1250',currency_code:'AED'},images:[]}];
    const service=new Wave1CatalogCaptureService({fetchImpl:async()=>response(payload),now:()=>new Date('2026-07-13T00:00:00Z')});
    const result=await service.capture('greenheart-organic-farms');expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({displayName:'Organic Tomato 500g',publicPrice:12.5,priceType:'public_web_price',productType:'fresh_produce'});
    expect(result.products[0].sourceChecksum).toMatch(/^[a-f0-9]{64}$/);
  });
  test('official menu items remain restaurant menu items with public menu prices',async()=>{
    const html='<h2>Guacamole with Chips</h2><span>50 AED</span><h2>Queso and Chips</h2><span>40 AED</span>';
    const service=new Wave1CatalogCaptureService({fetchImpl:async()=>response(html),now:()=>new Date('2026-07-13T00:00:00Z')});
    const result=await service.capture('maiz-tacos-dubai');expect(result.products).toHaveLength(2);
    expect(result.products[0]).toMatchObject({productType:'restaurant_menu_item',priceType:'public_menu_price'});
  });
  test('search pages are rejected and unavailable sources never create products',async()=>{
    const service=new Wave1CatalogCaptureService({fetchImpl:async()=>response('')});
    expect(()=>service.assertOfficial({allowedHostnames:['seller.example']},'https://google.com/search?q=seller')).toThrow('SUPPLYGRAPH_OFFICIAL_SOURCE_REQUIRED');
    const blocked=await service.capture('taqado-mexican-kitchen');expect(blocked.products).toEqual([]);expect(blocked.status).toBe('blocked');
  });
  test('snapshot accepts menu prices and strongest seller-specific identity',()=>{
    const checksum=crypto.createHash('sha256').update('official-menu').digest('hex');const validator=new SellerSnapshotValidator();
    const snapshot=validator.snapshot({schemaVersion:VERSIONS.snapshot,sellerCanonicalKey:'maiz-tacos-dubai',products:[{productType:'restaurant_menu_item',externalProductId:'1',displayName:'Taco',productPageUrl:'https://www.maiztacos.com/menu#taco-a',publicPrice:20,currency:'AED',priceType:'public_menu_price',observedAt:'2026-07-13T00:00:00Z',sourceChecksum:checksum},{productType:'restaurant_menu_item',externalProductId:'2',displayName:'Taco',productPageUrl:'https://www.maiztacos.com/menu#taco-b',publicPrice:25,currency:'AED',priceType:'public_menu_price',observedAt:'2026-07-13T00:00:00Z',sourceChecksum:checksum}]});
    expect(snapshot.products).toHaveLength(2);
  });
  test('work recommendations aggregate blocked capture, missing media and inventory by seller',()=>{
    const service=new AuthorizedSellerNetworkService({config:{supplyGraphWave1CatalogActivationEnabled:true}});const recommendations=service.wave1Recommendations({sellers:[{sellerId:'a',canonicalKey:'blocked',canonicalName:'Blocked',pipelinePriority:'A',captureStatus:'blocked',catalogReady:false,productCount:0,imageCount:0,inventoryProductCount:0},{sellerId:'b',canonicalKey:'ready',canonicalName:'Ready',pipelinePriority:'A',captureStatus:'complete',catalogReady:true,productCount:5,imageCount:2,inventoryProductCount:4}]});
    expect(recommendations.map((item)=>item.actionType)).toEqual(['review_wave1_catalog_capture','review_wave1_missing_media','review_wave1_inventory_initialization']);
    expect(recommendations.every((item)=>item.safePayload.externalActionAllowed===false)).toBe(true);
  });
  test('Wave 1 application kill switch blocks extension apply but leaves reads available',async()=>{
    const service=new AuthorizedSellerNetworkService({config:{supplyGraphAuthorizedSellersEnabled:true,supplyGraphSellerOnboardingEnabled:true,supplyGraphSellerOnboardingApplicationEnabled:true,supplyGraphWave1CatalogActivationEnabled:false}});
    const checksum=crypto.createHash('sha256').update('official').digest('hex');const created=await service.createFromSnapshot({schemaVersion:VERSIONS.snapshot,sellerCanonicalKey:'maiz-tacos-dubai',products:[{productType:'restaurant_menu_item',displayName:'Taco',productPageUrl:'https://www.maiztacos.com/menu#taco',publicPrice:20,currency:'AED',priceType:'public_menu_price',observedAt:'2026-07-13T00:00:00Z',sourceChecksum:checksum}]});
    await expect(service.apply(created.package.id,{approvalId:'approved',version:1})).rejects.toMatchObject({code:'SUPPLYGRAPH_WAVE1_CATALOG_ACTIVATION_DISABLED'});
    expect((await service.wave1Activation()).sellerCount).toBe(14);
  });
});
