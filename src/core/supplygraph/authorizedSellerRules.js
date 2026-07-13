const { sha256 } = require('./supplyGraphTypes');
const { stable } = require('./supplyGraphMatchRules');

const VERSIONS = Object.freeze({
  onboarding: 'supplygraph-seller-onboarding-v1.14.0',
  registry: 'supplygraph-seller-registry-v1.13.0',
  snapshot: 'supplygraph-seller-snapshot-v1.14.0',
  media: 'supplygraph-product-media-v1.14.0',
  inventory: 'supplygraph-inventory-v1.14.0',
  match: 'supplygraph-match-v1.13.0',
  comparison: 'supplygraph-comparison-v1.13.0',
});
const LIMITS = Object.freeze({ maxSellers: 32, maxProductsPerSeller: 250, maxTotalProducts: 1500,
  maxImagesPerProduct: 3, maxImageBytes: 5 * 1024 * 1024, maxImagesTotal: 3000,
  captureConcurrency: 3, domainDelayMs: 1000, retryCount: 1, initialProductStock: 100 });
const AUTHORIZATION_STATUSES = Object.freeze(['founder_attested', 'documented', 'suspended', 'revoked']);
const SOURCE_MODES = Object.freeze(['official_public_source', 'reviewed_seller_source', 'existing_verified_catalog', 'catalog_capture_blocked']);
const RULESETS = Object.freeze(Object.fromEntries(Object.entries(VERSIONS).map(([key, version]) => [key,
  Object.freeze({ version, checksum: sha256(stable({ version, limits: LIMITS, authorizationBasis: 'founder_attestation' })) })])));

module.exports = { AUTHORIZATION_STATUSES, LIMITS, RULESETS, SOURCE_MODES, VERSIONS };
