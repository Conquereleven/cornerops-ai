const fs=require('fs');
const path=require('path');
const { Wave1CatalogCaptureService,WAVE1_SELLERS,WAVE1_CAPTURE_ADAPTERS,REGISTRY_CHECKSUM,VERSIONS,LIMITS,sha256 }=require('../src/core/supplygraph');

const root=path.resolve(__dirname,'../docs/data/supplygraph-authorized-sellers');
const enabled=['1','true','yes','on'].includes(String(process.env.SUPPLYGRAPH_SELLER_CAPTURE_ENABLED||'').toLowerCase());
if(!enabled){process.stderr.write('SUPPLYGRAPH_SELLER_CAPTURE_ENABLED must be true for this offline operation.\n');process.exit(2);}

const service=new Wave1CatalogCaptureService();
const sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const safeSnapshot=(seller,result)=>({
  schemaVersion:VERSIONS.snapshot,
  sellerCanonicalKey:seller.canonicalKey,
  products:result.products||[],
  seller:{...seller,catalogProductCount:result.products?.length||seller.catalogProductCount,captureStatus:result.status},
  research:{observedAt:result.observedAt||new Date().toISOString(),officialSourceUrl:seller.officialSourceUrl,officialSourceVerified:result.status==='complete'||seller.canonicalKey==='intermex-uae',sourceChecksum:result.sourceChecksum||sha256(seller.officialSourceUrl||seller.canonicalKey),sourceStatus:result.status},
  catalog:{captureStatus:result.status,products:result.products||[],productCount:result.products?.length||seller.catalogProductCount,priceBasis:result.products?.some((p)=>p.priceType==='public_menu_price')?'public_menu_price':result.products?.length?'public_web_price':null},
  safety:{runtimeCrawling:false,formsSubmitted:false,messagesSent:false,accountsCreated:false,unknownFactsRemainUnknown:true},
});

(async()=>{
  const rows=[];
  for(const seller of WAVE1_SELLERS){
    let result;
    if(seller.canonicalKey==='intermex-uae')result={status:'reused_verified_catalog',products:[],pagesScanned:0,sourceChecksum:sha256(seller.officialSourceUrl),observedAt:new Date().toISOString()};
    else result=await service.capture(seller.canonicalKey);
    const snapshot=safeSnapshot(seller,result);
    if(seller.canonicalKey!=='intermex-uae')fs.writeFileSync(path.join(root,`${seller.canonicalKey}.json`),`${JSON.stringify(snapshot,null,2)}\n`);
    rows.push({canonicalKey:seller.canonicalKey,activationOrder:seller.activationOrder,sourceVerificationState:result.status==='complete'?'source_verified':result.status,captureState:result.status,pagesScanned:result.pagesScanned||0,productsScanned:result.products?.length||0,productsAccepted:result.products?.length||seller.catalogProductCount,publicPricesCaptured:result.products?.filter((p)=>p.publicPrice!==null).length||seller.catalogProductCount,imageReferences:result.products?.filter((p)=>p.primaryImageUrl).length||0,blocker:result.reason||null});
    if(seller.canonicalKey!=='intermex-uae')await sleep(LIMITS.domainDelayMs);
  }
  const summary={generatedAt:new Date().toISOString(),registryChecksum:REGISTRY_CHECKSUM,snapshotSchemaVersion:VERSIONS.snapshot,wave1SellerCount:14,newCatalogReadySellers:rows.filter((row)=>row.canonicalKey!=='intermex-uae'&&row.productsAccepted>0).length,totalCatalogReadySellers:rows.filter((row)=>row.productsAccepted>0).length,pagesScanned:rows.reduce((sum,row)=>sum+row.pagesScanned,0),productsAccepted:rows.reduce((sum,row)=>sum+row.productsAccepted,0),runtimeCrawling:false,externalActions:false,rows};
  const manifestPath=path.join(root,'manifest.json');const manifest=JSON.parse(fs.readFileSync(manifestPath));const byKey=new Map(rows.map((row)=>[row.canonicalKey,row]));
  manifest.registryChecksum=REGISTRY_CHECKSUM;manifest.snapshotSchemaVersion=VERSIONS.snapshot;manifest.generatedAt=summary.generatedAt;manifest.catalogSellerCount=summary.totalCatalogReadySellers;manifest.catalogProductCount=summary.productsAccepted;
  manifest.limits={...manifest.limits,maxTotalProducts:LIMITS.maxTotalProducts};
  manifest.sellers=manifest.sellers.map((entry)=>{const row=byKey.get(entry.canonicalKey);return row?{...entry,sourceStatus:row.sourceVerificationState,captureStatus:row.captureState,productCount:row.productsAccepted}:entry;});
  fs.writeFileSync(manifestPath,`${JSON.stringify(manifest,null,2)}\n`);
  fs.writeFileSync(path.join(root,'capture-report.json'),`${JSON.stringify(summary,null,2)}\n`);
  process.stdout.write(`${JSON.stringify(summary,null,2)}\n`);
})().catch((error)=>{process.stderr.write(`${error.code||error.message}\n`);process.exit(1);});
