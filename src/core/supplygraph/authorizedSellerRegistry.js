const { sha256, normalizeKey } = require('./supplyGraphTypes');
const { stable } = require('./supplyGraphMatchRules');
const { RULESETS } = require('./authorizedSellerRules');

const pipeline = [
  ['lila-molino-cafe-lila-taqueria','Lila Molino + Cafe / Lila Taqueria',87,'A+','Wave 1','Mexican kitchen brand','Kitchen Brand + Fulfilled by CornerMex','HORECA and B2C','Dubai','https://www.lilamolino.com/'],
  ['la-tiendita-abu-dhabi','La Tiendita',87,'A+','Wave 1','specialized Latin grocery','Marketplace Seller + Cross-docking','B2C, small HORECA and corporate','Abu Dhabi','https://latienditashop.com/welcome/'],
  ['intermex-uae','Intermex UAE',85,'A+','Wave 1','Mexican importer and store','wholesale supplier + strategic seller','HORECA, retail and B2C','UAE','https://intermexuae.com/'],
  ['maria-bonita-taco-shop-grill','Maria Bonita Taco Shop & Grill',83,'A','Wave 1','Mexican restaurant','Kitchen Brand + made-to-order production','B2C and boutique HORECA','Dubai','https://mariabonitatacoshop.com/'],
  ['taqado-mexican-kitchen','Taqado Mexican Kitchen',77,'A','Wave 1','Mexican QSR chain','Kitchen Brand / Corporate Bundles','offices, catering and B2C','Dubai','https://www.taqado.com/'],
  ['el-mostacho-dubai','El Mostacho',82,'A','Wave 1','independent Mexican restaurant','Kitchen Brand + Marketplace Seller','B2C and small restaurants','Dubai','https://www.instagram.com/el_mostacho_dubai/'],
  ['chalcos-cantina',"Chalco's Cantina",76,'A','Wave 1','Tex-Mex restaurant','Kitchen Brand + Marketplace Seller','B2C, events and offices','Dubai','https://chalcoscantina.ae/'],
  ['maiz-tacos-dubai','Maiz Tacos',83,'A','Wave 1','taqueria and local brand','Kitchen Brand + Fulfilled by CornerMex','B2C and HORECA','Dubai','https://www.maiztacos.com/'],
  ['burro-blanco-dubai','Burro Blanco',77,'A','Wave 1','casual Mexican restaurant','Kitchen Brand / Corporate Catering','offices, B2C and catering','Dubai','https://burroblanco.ae/'],
  ['tortilla-mexican-grill-uae-eathos','Tortilla Mexican Grill UAE / Eathos',70,'B','Wave 2','regional QSR chain/operator','Strategic Brand Partner','corporate, events and GCC','Dubai','https://www.tortilla.co.uk/'],
  ['fusion-ceviche-dubai','Fusion Ceviche',73,'B','Wave 2','independent Peruvian restaurant','Kitchen Brand + Marketplace Seller','B2C and boutique HORECA','Dubai','https://jlt.ae/directory/fusion-ceviche'],
  ['coya-uae','COYA Dubai / Abu Dhabi',67,'B','Wave 2','premium Peruvian restaurant group','Co-branded Premium Seller','hotels, corporate and gifting','Dubai and Abu Dhabi','https://www.coyarestaurant.com/dubai/'],
  ['tamoka-dubai','Tamoka Dubai',65,'B','Wave 2','Latin American and Caribbean restaurant','Co-branded Kitchen Brand','premium B2C, hotels and events','Dubai','https://www.tamokadubai.com/'],
  ['la-mar-gaston-acurio-dubai','La Mar by Gaston Acurio Dubai',67,'B','Wave 2','premium Peruvian restaurant','Premium Collaboration','hotels, gifting and premium HORECA','Dubai','https://www.atlantis.com/atlantis-the-royal/dining/la-mar-by-gaston-acurio'],
  ['senor-pico-dubai','Senor Pico Dubai',73,'B','Wave 2','Mexican / Tex-Mex restaurant','Kitchen Brand + Event Bundles','B2C, events and corporate','Dubai','https://senorpico.com/thepalm/eat/'],
  ['greenheart-organic-farms','Greenheart Organic Farms',79,'A','Wave 1','local agricultural producer','Supplier Seller + Contract Growing','HORECA and B2C','Sharjah / Dubai','https://greenheartuae.com/'],
  ['emirates-bio-farm','Emirates Bio Farm',79,'A','Wave 1','organic farm and ecommerce','Supplier Seller + Fulfillment Integration','HORECA and B2C','Abu Dhabi','https://emiratesbiofarm.com/'],
  ['ripe-organic','Ripe Organic',65,'B','Wave 2','organic retailer and market','Marketplace Seller / Curated Partner','premium B2C and gifting','Dubai','https://ripeme.com/'],
  ['freshontable','FreshOnTable',81,'A','Wave 1','farm-to-table platform','Catalog Integration / Supply Partner','HORECA','UAE','https://freshontable.com/'],
  ['nrtc-fresh','NRTC Fresh',76,'A','Wave 1','produce importer and distributor','Wholesale Supplier Seller','HORECA and B2C','UAE','https://nrtcgroup.com/'],
  ['barakat-fresh','Barakat Fresh',70,'B','Wave 2','fresh-food producer and distributor','Wholesale Seller / Fulfilled Catalog','HORECA, offices and B2C','Dubai','https://www.barakatfresh.ae/'],
  ['kibsons','Kibsons',65,'B','Wave 2','grocery importer and ecommerce','Supplier / Catalog Partner','HORECA and B2C','UAE','https://www.kibsons.com/en'],
  ['casinetto-uae','Casinetto',73,'B','Wave 2','gourmet HORECA distributor','Catalog Partner / Drop-ship','premium HORECA and B2C','Dubai','https://casinetto.com/'],
  ['fresh-express-uae','Fresh Express',77,'A','Wave 1','premium importer and distributor','Wholesale Supplier Seller','hotels, restaurants and catering','UAE','https://www.freshexpressint.com/'],
  ['organic-foods-cafe-uae','Organic Foods & Cafe',69,'B','Wave 2','specialized organic retailer','Marketplace Seller / Retail Partnership','premium B2C and boutique HORECA','Dubai and Abu Dhabi','https://organicfoodsandcafe.com/'],
];
const extension = [
  ['bidfood-middle-east-uae','Bidfood Middle East UAE','foodservice_distributor','horeca_distribution','https://www.bidfoodme.com/'],
  ['nesto-uae','Nesto UAE','retailer','hypermarket','https://nestogroup.com/'],
  ['almaya-uae','Al Maya UAE','retailer','supermarket_ecommerce','https://www.almayaonline.com/'],
  ['union-coop-uae','Union Coop UAE','retailer','cooperative_retailer','https://www.unioncoop.ae/'],
  ['spinneys-uae','Spinneys UAE','retailer','premium_supermarket','https://www.spinneys.com/en-ae/'],
  ['waitrose-uae','Waitrose UAE','retailer','premium_supermarket','https://www.waitrose.ae/en/'],
  ['lulu-hypermarket-uae','LuLu Hypermarket UAE','retailer','hypermarket_ecommerce','https://gcc.luluhypermarket.com/en-ae/'],
];
const NON_REACHABLE_SOURCE_STATUS=Object.freeze({
  'almaya-uae':'unavailable','la-mar-gaston-acurio-dubai':'unavailable','chalcos-cantina':'unavailable','taqado-mexican-kitchen':'unavailable','nesto-uae':'unavailable',
  'casinetto-uae':'blocked_access','lulu-hypermarket-uae':'blocked_access','kibsons':'blocked_access',
});
const makePipeline = (row) => ({ canonicalKey:row[0], canonicalName:row[1], pipelineScore:row[2], pipelinePriority:row[3], pipelineWave:row[4], sellerSegment:row[5], onboardingModel:row[6], targetChannel:row[7], geography:row[8], officialSourceUrl:row[9], pipelineSource:'founder_commercial_pipeline' });
const makeExtension = (row) => ({ canonicalKey:row[0], canonicalName:row[1], pipelineScore:null, pipelinePriority:null, pipelineWave:null, sellerSegment:row[2], onboardingModel:'authorized market seller review', targetChannel:row[3], geography:'UAE', officialSourceUrl:row[4], pipelineSource:'authorized_market_extension' });
const SELLERS = Object.freeze([...pipeline.map(makePipeline), ...extension.map(makeExtension)].map((seller) => Object.freeze({
  ...seller, authorizationBasis:'founder_attestation', authorizationStatus:'founder_attested', sellerType:seller.sellerSegment,
  sourceStatus:NON_REACHABLE_SOURCE_STATUS[seller.canonicalKey]||'reachable_official_source',
  sourceMode:seller.canonicalKey==='intermex-uae'?'existing_verified_catalog':seller.officialSourceUrl?'official_public_source':'catalog_capture_blocked',
  captureStatus:seller.canonicalKey==='intermex-uae'?'reused_verified_catalog':seller.officialSourceUrl?'official_source_pending_bounded_capture':'blocked_official_source_unresolved',
  catalogProductCount:seller.canonicalKey==='intermex-uae'?190:0,
  warnings:NON_REACHABLE_SOURCE_STATUS[seller.canonicalKey]?[`OFFICIAL_SOURCE_${NON_REACHABLE_SOURCE_STATUS[seller.canonicalKey].toUpperCase()}`]:seller.officialSourceUrl?[]:['OFFICIAL_SOURCE_REQUIRED_BEFORE_CATALOG_CAPTURE'],
})));
const keys = SELLERS.map((seller) => seller.canonicalKey);
if (SELLERS.length !== 32 || new Set(keys).size !== 32 || keys.some((key) => normalizeKey(key) !== key)) throw new Error('Authorized seller registry invariant failed.');
const REGISTRY_CHECKSUM = sha256(stable({ sellers:SELLERS, ruleset:RULESETS.registry }));
module.exports = { REGISTRY_CHECKSUM, SELLERS };
