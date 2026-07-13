const COMMON = Object.freeze({ maxPages: 1, unsupportedBehavior: 'record_blocker_and_continue' });

const menu = (canonicalKey, hostname, sourceUrl, items) => Object.freeze({
  ...COMMON, canonicalKey, allowedHostnames: [hostname], allowedMediaHostnames:[hostname], profileSourceUrl: sourceUrl,
  catalogSourceUrl: sourceUrl, parser: 'verified_html_menu', productDetailParser: 'same_official_menu',
  priceParser: 'aed_menu_text', imageParser: 'official_page_images', pagination: 'none', officialMenuItems: items,
});
const store = (canonicalKey, hostname, profileSourceUrl, catalogSourceUrl, parser) => Object.freeze({
  ...COMMON, canonicalKey, allowedHostnames: [hostname], allowedMediaHostnames:[hostname,'i0.wp.com','cdn.shopify.com'], profileSourceUrl, catalogSourceUrl,
  parser, productDetailParser: 'public_storefront_payload', priceParser: 'public_storefront_price',
  imageParser: 'public_storefront_media', pagination: 'single_bounded_page',
});
const unsupported = (canonicalKey, hostname, sourceUrl, reason) => Object.freeze({
  ...COMMON, canonicalKey, allowedHostnames: hostname ? [hostname] : [], allowedMediaHostnames:hostname?[hostname]:[], profileSourceUrl: sourceUrl,
  catalogSourceUrl: null, parser: 'unsupported', productDetailParser: 'unsupported', priceParser: 'unsupported',
  imageParser: 'unsupported', pagination: 'none', unsupportedReason: reason,
});

const WAVE1_CAPTURE_ADAPTERS = Object.freeze({
  'lila-molino-cafe-lila-taqueria': unsupported('lila-molino-cafe-lila-taqueria','www.lilamolino.com','https://www.lilamolino.com/menu','menu_content_not_machine_readable'),
  'la-tiendita-abu-dhabi': store('la-tiendita-abu-dhabi','latienditashop.com','https://latienditashop.com/','https://latienditashop.com/wp-json/wc/store/v1/products?per_page=100&page=1','woocommerce_store_api'),
  'maria-bonita-taco-shop-grill': unsupported('maria-bonita-taco-shop-grill','mariabonitatacoshop.com','https://mariabonitatacoshop.com/menu','menu_images_require_manual_review'),
  'maiz-tacos-dubai': menu('maiz-tacos-dubai','www.maiztacos.com','https://www.maiztacos.com/menu',[
    ['Guacamole with Chips',50],['Maiz Guacamole with Chips',53],['Elotes (Corn on the Cob)',35],['Queso and Chips',40],['Flautas',45],
    ['Creamy Chipotle Kale Salad',48],['Pollo Crunch Wrap',50],['Pollo Loco',45],['Carne Asada',70],['Birria',60],
  ]),
  'el-mostacho-dubai': unsupported('el-mostacho-dubai','www.instagram.com','https://www.instagram.com/el_mostacho_dubai/','social_source_not_safely_capturable'),
  freshontable: store('freshontable','shop.freshontable.com','https://freshontable.com/','https://shop.freshontable.com/products.json?limit=100','shopify_products_json'),
  'greenheart-organic-farms': store('greenheart-organic-farms','greenheartuae.com','https://greenheartuae.com/','https://greenheartuae.com/wp-json/wc/store/v1/products?per_page=100&page=1','woocommerce_store_api'),
  'emirates-bio-farm': store('emirates-bio-farm','emiratesbiofarm.com','https://emiratesbiofarm.com/','https://emiratesbiofarm.com/products.json?limit=100','shopify_products_json'),
  'taqado-mexican-kitchen': unsupported('taqado-mexican-kitchen','www.taqado.com','https://www.taqado.com/','official_source_unavailable'),
  'burro-blanco-dubai': menu('burro-blanco-dubai','burroblanco.ae','https://burroblanco.ae/menu',[
    ['Burrito',49],['Trio Tacos',49],['Bowl',49],['Burrito Salad Bowl',46],['Loaded Quesadilla',45],
    ['Socal',50],['El Chili Burrito',50],["Justin's Fire",50],['The Late Night Burrito',50],['Del Sur Tacos',50],
  ]),
  'fresh-express-uae': unsupported('fresh-express-uae','www.freshexpressint.com','https://www.freshexpressint.com/','public_catalog_not_exposed'),
  'chalcos-cantina': unsupported('chalcos-cantina','chalcoscantina.ae','https://chalcoscantina.ae/','official_source_unavailable'),
  'nrtc-fresh': unsupported('nrtc-fresh','nrtcgroup.com','https://nrtcgroup.com/','public_catalog_not_exposed'),
});

module.exports = { WAVE1_CAPTURE_ADAPTERS };
