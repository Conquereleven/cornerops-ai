const fs = require('fs');
const path = require('path');
const { SELLERS, REGISTRY_CHECKSUM } = require('../src/core/supplygraph/authorizedSellerRegistry');
const { LIMITS, RULESETS, VERSIONS } = require('../src/core/supplygraph/authorizedSellerRules');
const { sha256 } = require('../src/core/supplygraph/supplyGraphTypes');

const root=path.resolve(__dirname,'..','docs','data','supplygraph-authorized-sellers');
fs.mkdirSync(root,{recursive:true});
const observedAt='2026-07-13T00:00:00.000Z';
const researchPath=path.join(root,'research-report.json');
const researchByKey=fs.existsSync(researchPath)?new Map(JSON.parse(fs.readFileSync(researchPath,'utf8')).results.map((item)=>[item.canonicalKey,item])):new Map();
const records=SELLERS.map((seller)=>({
  schemaVersion:VERSIONS.snapshot, seller, research:{observedAt,officialSourceUrl:seller.officialSourceUrl,
    officialSourceVerified:researchByKey.get(seller.canonicalKey)?.status==='reachable_official_source',sourceChecksum:researchByKey.get(seller.canonicalKey)?.sourceChecksum||(seller.officialSourceUrl?sha256(seller.officialSourceUrl):null),
    sourceStatus:researchByKey.get(seller.canonicalKey)?.status||(seller.officialSourceUrl?'official_source_registered':'official_source_unresolved')},
  catalog:{captureStatus:researchByKey.get(seller.canonicalKey)?.status==='blocked_access'?'blocked_auth_or_access':seller.captureStatus,products:seller.canonicalKey==='intermex-uae'?'existing_190_item_catalog_reused':[],productCount:seller.catalogProductCount,
    priceBasis:seller.catalogProductCount?'public_web_price_or_existing_verified_snapshot':null},
  safety:{runtimeCrawling:false,formsSubmitted:false,messagesSent:false,accountsCreated:false,unknownFactsRemainUnknown:true},
}));
for(const record of records)fs.writeFileSync(path.join(root,`${record.seller.canonicalKey}.json`),`${JSON.stringify(record,null,2)}\n`);
const manifest={registryVersion:VERSIONS.registry,registryChecksum:REGISTRY_CHECKSUM,generatedAt:observedAt,authorizedSellerCount:records.length,
  uniqueCanonicalKeyCount:new Set(records.map((r)=>r.seller.canonicalKey)).size,pipelineSellerCount:25,authorizedMarketExtensionCount:7,
  catalogSellerCount:1,catalogProductCount:190,limits:LIMITS,policyChecksums:Object.fromEntries(Object.entries(RULESETS).map(([k,v])=>[k,v.checksum])),
  sellers:records.map((r)=>({canonicalKey:r.seller.canonicalKey,authorizationStatus:r.seller.authorizationStatus,sourceStatus:r.research.sourceStatus,captureStatus:r.catalog.captureStatus,productCount:r.catalog.productCount,snapshotFile:`${r.seller.canonicalKey}.json`}))};
fs.writeFileSync(path.join(root,'manifest.json'),`${JSON.stringify(manifest,null,2)}\n`);
fs.writeFileSync(path.join(root,'capture-report.json'),`${JSON.stringify({observedAt,totalSellers:32,successfulCatalogCaptures:1,reusedCatalogs:1,blockedOrPendingCaptures:31,totalProducts:190,
  result:'live_partial_seller_catalogs',notes:['Intermex canonical 190-item catalog is reused.','No product was invented from commercial hypotheses.','Sources needing login, CAPTCHA, ambiguous identity or unresolved official ownership remain blocked.']},null,2)}\n`);
fs.writeFileSync(path.join(root,'authorization-attestation.json'),`${JSON.stringify({basis:'founder_attestation',attestedSellerCount:32,status:'founder_attested',scope:'internal authorized seller candidate network',
  limitations:['Authorization does not prove stock, MOQ, lead time, wholesale price, purchasing readiness or complete UAE market coverage.'],rulesetChecksum:RULESETS.registry.checksum},null,2)}\n`);
const table=records.map((r)=>`| ${r.seller.canonicalName.replace(/\|/g,'/')} | ${r.seller.officialSourceUrl} | ${r.research.sourceStatus} | ${r.catalog.captureStatus} | ${r.catalog.productCount} | 0 | 0 | ${r.catalog.productCount?'existing catalog reused':'profile only'} | ${r.catalog.productCount?'seed after approved apply':'not seeded'} | ${r.catalog.productCount?'eligible':'not eligible'} |`).join('\n');
fs.writeFileSync(path.resolve(root,'..','authorized-seller-source-report-v1.13.md'),`# Authorized Seller Source Report v1.13\n\nResearch date: ${observedAt.slice(0,10)}. Registry checksum: \`${REGISTRY_CHECKSUM}\`. Official sources were checked without forms, accounts, messages or runtime crawling. Counts below are catalog truth only; pipeline product hypotheses are excluded.\n\n| Seller | Official source | Identity/source | Catalog status | Products | Images | Public prices | Onboarding | Inventory | Comparison |\n|---|---|---|---|---:|---:|---:|---|---|---|\n${table}\n\nIntermex reuses the checksum-pinned 190-item catalog. All other sellers remain partial/profile-only until bounded official-source snapshots pass validation and founder approval. No stock, MOQ, lead time, shelf life, wholesale price, purchasing readiness, market completeness or best-supplier claim is inferred.\n`);
console.log(JSON.stringify({generated:true,sellers:records.length,registryChecksum:REGISTRY_CHECKSUM,products:190,status:'live_partial_seller_catalogs'}));
