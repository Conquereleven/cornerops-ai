const { createCornerMexProductContract } = require('./CornerMexProductContract');
const { createCornerMexLeadContract } = require('./CornerMexLeadContract');
const { createCornerMexQuoteContract } = require('./CornerMexQuoteContract');
const { createCornerMexOrderContract } = require('./CornerMexOrderContract');
const { createCornerMexCustomerContract } = require('./CornerMexCustomerContract');
const { createCornerMexPaymentContract } = require('./CornerMexPaymentContract');

class CornerMexDataContractRegistry {
  constructor({ sourceMode = 'missing_config', sourceReference = 'mock/template' } = {}) {
    this.sourceMode = sourceMode;
    this.sourceReference = sourceReference;
  }

  listContracts({ sourceMode = this.sourceMode, sourceReference = this.sourceReference } = {}) {
    const options = { sourceMode, sourceReference };
    return [
      createCornerMexProductContract(options),
      createCornerMexLeadContract(options),
      createCornerMexQuoteContract(options),
      createCornerMexOrderContract(options),
      createCornerMexCustomerContract(options),
      createCornerMexPaymentContract(options),
    ];
  }

  getContract(entity, options = {}) {
    return this.listContracts(options).find((contract) => contract.entity === entity) || null;
  }

  getSummary(options = {}) {
    const contracts = this.listContracts(options);
    return {
      total: contracts.length,
      entities: contracts.map((contract) => contract.entity),
      confidence: contracts.reduce((acc, contract) => {
        acc[contract.confidence] = (acc[contract.confidence] || 0) + 1;
        return acc;
      }, {}),
      contracts,
    };
  }
}

module.exports = { CornerMexDataContractRegistry };
