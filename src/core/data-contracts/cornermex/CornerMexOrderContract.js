const { makeContract } = require('./contractFactory');

const createCornerMexOrderContract = (options = {}) => makeContract({
  entity: 'order',
  canonicalFields: ['id', 'customerId', 'status', 'paymentMethod', 'paymentStatus', 'items', 'totalAED'],
  requiredFields: ['id', 'status', 'paymentStatus', 'items'],
  optionalFields: ['customerId', 'paymentMethod', 'totalAED', 'deliveryStatus', 'internalNotes'],
  piiClassification: 'medium',
  ...options,
});

module.exports = { createCornerMexOrderContract };
