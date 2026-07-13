const fs=require('fs');const path=require('path');
const {SELLERS}=require('../src/core/supplygraph/authorizedSellerRegistry');
const {sha256}=require('../src/core/supplygraph/supplyGraphTypes');
const sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const lastByHost=new Map();
async function inspect(seller){
  if(!seller.officialSourceUrl)return{canonicalKey:seller.canonicalKey,status:'unresolved',httpStatus:null,sourceUrl:null,finalUrl:null,sourceChecksum:null};
  const url=new URL(seller.officialSourceUrl);const elapsed=Date.now()-(lastByHost.get(url.hostname)||0);if(elapsed<1000)await sleep(1000-elapsed);lastByHost.set(url.hostname,Date.now());
  try{
    let response=await fetch(url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(10000),headers:{'user-agent':'CornerOps-SupplyGraph-Research/1.13'}});
    if(response.status===405)response=await fetch(url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(10000),headers:{'user-agent':'CornerOps-SupplyGraph-Research/1.13','range':'bytes=0-8191'}});
    const blocked=[401,403].includes(response.status);return{canonicalKey:seller.canonicalKey,status:blocked?'blocked_access':response.ok?'reachable_official_source':'unavailable',httpStatus:response.status,sourceUrl:seller.officialSourceUrl,finalUrl:response.url,sourceChecksum:sha256(`${seller.officialSourceUrl}|${response.url}|${response.status}`),retried:false};
  }catch(error){return{canonicalKey:seller.canonicalKey,status:'unavailable',httpStatus:null,sourceUrl:seller.officialSourceUrl,finalUrl:null,sourceChecksum:sha256(seller.officialSourceUrl),errorCode:error.name,retried:false};}
}
async function main(){const queue=[...SELLERS];const results=[];await Promise.all(Array.from({length:3},async()=>{while(queue.length){const seller=queue.shift();results.push(await inspect(seller));}}));results.sort((a,b)=>a.canonicalKey.localeCompare(b.canonicalKey));const report={researchVersion:'supplygraph-public-source-research-v1.13.0',observedAt:new Date().toISOString(),sellerCount:32,reachableCount:results.filter((r)=>r.status==='reachable_official_source').length,blockedCount:results.filter((r)=>r.status==='blocked_access').length,unavailableCount:results.filter((r)=>r.status==='unavailable').length,unresolvedCount:results.filter((r)=>r.status==='unresolved').length,runtimeCrawling:false,formsSubmitted:false,messagesSent:false,results};const target=path.resolve(__dirname,'../docs/data/supplygraph-authorized-sellers/research-report.json');fs.writeFileSync(target,`${JSON.stringify(report,null,2)}\n`);console.log(JSON.stringify({sellerCount:32,reachableCount:report.reachableCount,blockedCount:report.blockedCount,unavailableCount:report.unavailableCount,unresolvedCount:report.unresolvedCount}));}
main().catch((error)=>{console.error(JSON.stringify({status:'failed',code:error.code||error.name}));process.exitCode=1;});
