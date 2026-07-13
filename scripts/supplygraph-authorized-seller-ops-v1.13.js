const fs=require('fs');const path=require('path');
const {SELLERS,REGISTRY_CHECKSUM,LIMITS,VERSIONS}=require('../src/core/supplygraph');
const mode=process.argv[2]||'report';const root=path.join(__dirname,'../docs/data/supplygraph-authorized-sellers');
const researchPath=path.join(root,'research-report.json');
const research=fs.existsSync(researchPath)?JSON.parse(fs.readFileSync(researchPath,'utf8')):null;
const fail=(message)=>{process.stderr.write(`${message}\n`);process.exitCode=1;};
const base={mode,registryVersion:VERSIONS.registry,registryChecksum:REGISTRY_CHECKSUM,sellerCount:SELLERS.length,intermexCount:SELLERS.filter((seller)=>seller.canonicalKey==='intermex-uae').length,casinettoCount:SELLERS.filter((seller)=>seller.canonicalKey==='casinetto-uae').length,catalogSellerCount:SELLERS.filter((seller)=>seller.catalogProductCount>0).length,catalogProductCount:SELLERS.reduce((sum,seller)=>sum+seller.catalogProductCount,0),runtimeCrawling:false,externalContact:false,writes:false};
if(!['capture','validate','media','report'].includes(mode))fail('Unknown authorized seller operation.');
else if(mode==='validate'){
  const valid=base.sellerCount===LIMITS.maxSellers&&base.intermexCount===1&&base.casinettoCount===1&&base.catalogProductCount===190&&SELLERS.slice(25).every((seller)=>seller.pipelineScore===null);
  process.stdout.write(`${JSON.stringify({...base,status:valid?'valid':'invalid'},null,2)}\n`);if(!valid)process.exitCode=1;
}else if(mode==='capture'){
  process.stdout.write(`${JSON.stringify({...base,status:'offline_artifacts_only',researchArtifactPresent:Boolean(research),captureEnabled:false,instructions:'Run the bounded research generator explicitly; runtime API crawling remains prohibited.'},null,2)}\n`);
}else if(mode==='media'){
  process.stdout.write(`${JSON.stringify({...base,status:'disabled',mediaImportEnabled:false,storageWrites:false,instructions:'Media import requires reviewed snapshot evidence, approval and SUPPLYGRAPH_SELLER_MEDIA_ENABLED.'},null,2)}\n`);
}else process.stdout.write(`${JSON.stringify({...base,status:'partial_catalogs',sourceChecks:research?.summary||null,initialStockPerImportedProduct:LIMITS.initialProductStock,physicalStockVerified:false,marketComparisonPerformed:false,bestSupplierClaim:false,basketOptimizationStatus:'not_implemented'},null,2)}\n`);
