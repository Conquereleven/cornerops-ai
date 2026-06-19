const { BusinessDataContractRegistry } = require('./BusinessDataContractRegistry');
const { leadDataContract } = require('./LeadDataContract');
const { orderDataContract } = require('./OrderDataContract');
const { quoteDataContract } = require('./QuoteDataContract');
const { auditLogDataContract } = require('./AuditLogDataContract');
const { approvalDataContract } = require('./ApprovalDataContract');

module.exports = {
  BusinessDataContractRegistry,
  approvalDataContract,
  auditLogDataContract,
  leadDataContract,
  orderDataContract,
  quoteDataContract,
};
