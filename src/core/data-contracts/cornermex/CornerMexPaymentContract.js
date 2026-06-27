const { makeContract } = require('./contractFactory');

const createCornerMexPaymentContract = (options = {}) => makeContract({
  entity: 'payment',
  canonicalFields: ['orderId', 'paymentMethod', 'paymentStatus', 'amountAED', 'manualVerificationStatus'],
  requiredFields: ['orderId', 'paymentStatus'],
  optionalFields: ['paymentMethod', 'amountAED', 'manualVerificationStatus', 'bankTransferReference'],
  piiClassification: 'medium',
  ...options,
});

module.exports = { createCornerMexPaymentContract };
