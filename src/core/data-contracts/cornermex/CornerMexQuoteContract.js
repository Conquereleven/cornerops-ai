const { makeContract } = require('./contractFactory');

const createCornerMexQuoteContract = (options = {}) => makeContract({
  entity: 'quote',
  canonicalFields: ['id', 'leadId', 'status', 'items', 'totalAED', 'createdAt'],
  requiredFields: ['id', 'status', 'items'],
  optionalFields: ['leadId', 'totalAED', 'createdAt', 'expiresAt', 'notes'],
  piiClassification: 'medium',
  ...options,
});

module.exports = { createCornerMexQuoteContract };
