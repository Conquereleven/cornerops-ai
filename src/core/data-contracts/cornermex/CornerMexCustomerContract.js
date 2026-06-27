const { makeContract } = require('./contractFactory');

const createCornerMexCustomerContract = (options = {}) => makeContract({
  entity: 'customer',
  canonicalFields: ['id', 'name', 'email', 'phone', 'city'],
  requiredFields: ['id'],
  optionalFields: ['name', 'email', 'phone', 'city', 'address'],
  piiClassification: 'high',
  ...options,
});

module.exports = { createCornerMexCustomerContract };
