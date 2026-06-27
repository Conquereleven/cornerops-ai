const { makeContract } = require('./contractFactory');

const createCornerMexProductContract = (options = {}) => makeContract({
  entity: 'product',
  canonicalFields: ['id', 'sku', 'name', 'category', 'priceAED', 'stock', 'b2bAvailable'],
  requiredFields: ['id', 'sku', 'name'],
  optionalFields: ['category', 'priceAED', 'stock', 'description', 'b2bAvailable'],
  piiClassification: 'none',
  ...options,
});

module.exports = { createCornerMexProductContract };
