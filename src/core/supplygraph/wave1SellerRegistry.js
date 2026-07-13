const { SELLERS } = require('./authorizedSellerRegistry');

const WAVE1_ACTIVATION_ORDER = Object.freeze([
  'lila-molino-cafe-lila-taqueria',
  'la-tiendita-abu-dhabi',
  'intermex-uae',
  'maria-bonita-taco-shop-grill',
  'maiz-tacos-dubai',
  'el-mostacho-dubai',
  'freshontable',
  'greenheart-organic-farms',
  'emirates-bio-farm',
  'taqado-mexican-kitchen',
  'burro-blanco-dubai',
  'fresh-express-uae',
  'chalcos-cantina',
  'nrtc-fresh',
]);

const WAVE1_SELLERS = Object.freeze(WAVE1_ACTIVATION_ORDER.map((canonicalKey, index) => {
  const seller = SELLERS.find((entry) => entry.canonicalKey === canonicalKey);
  if (!seller || seller.pipelineWave !== 'Wave 1') throw new Error(`Wave 1 registry invariant failed for ${canonicalKey}.`);
  return Object.freeze({ ...seller, activationOrder: index + 1 });
}));

if (WAVE1_SELLERS.length !== 14 || new Set(WAVE1_ACTIVATION_ORDER).size !== 14) {
  throw new Error('Wave 1 must contain exactly 14 unique authorized sellers.');
}

module.exports = { WAVE1_ACTIVATION_ORDER, WAVE1_SELLERS };
