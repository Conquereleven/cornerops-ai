const { CornerMexDataContractRegistry } = require('./CornerMexDataContractRegistry');
const { createCornerMexProductContract } = require('./CornerMexProductContract');
const { createCornerMexLeadContract } = require('./CornerMexLeadContract');
const { createCornerMexQuoteContract } = require('./CornerMexQuoteContract');
const { createCornerMexOrderContract } = require('./CornerMexOrderContract');
const { createCornerMexCustomerContract } = require('./CornerMexCustomerContract');
const { createCornerMexPaymentContract } = require('./CornerMexPaymentContract');
const { CornerMexSchemaEvidenceService } = require('./CornerMexSchemaEvidenceService');
const schemaEvidenceTypes = require('./cornerMexSchemaEvidenceTypes');

module.exports = {
  CornerMexDataContractRegistry,
  CornerMexSchemaEvidenceService,
  createCornerMexCustomerContract,
  createCornerMexLeadContract,
  createCornerMexOrderContract,
  createCornerMexPaymentContract,
  createCornerMexProductContract,
  createCornerMexQuoteContract,
  ...schemaEvidenceTypes,
};
