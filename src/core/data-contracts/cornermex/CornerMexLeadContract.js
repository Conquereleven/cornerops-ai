const { makeContract } = require('./contractFactory');

const createCornerMexLeadContract = (options = {}) => makeContract({
  entity: 'lead',
  canonicalFields: ['id', 'businessName', 'businessType', 'city', 'productsOfInterest', 'status', 'contactName', 'email', 'whatsapp'],
  requiredFields: ['id', 'businessName', 'status'],
  optionalFields: ['businessType', 'city', 'productsOfInterest', 'contactName', 'email', 'whatsapp'],
  piiClassification: 'high',
  ...options,
});

module.exports = { createCornerMexLeadContract };
