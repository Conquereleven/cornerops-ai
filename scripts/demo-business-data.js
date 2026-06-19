process.env.CORNEROPS_BUSINESS_DATA_ENABLED = 'false';
process.env.CORNEROPS_BUSINESS_DATA_DRY_RUN = 'true';
process.env.CORNEROPS_DB_ALLOW_WRITES = 'false';
process.env.CORNEROPS_DB_READ_ONLY = 'true';

const data = require('../src/core/data');

const run = async () => {
  const context = { agentId: 'demo-business-data', userId: 'beta-operator', channel: 'internal' };
  const health = await data.businessDataService.getHealth(context);
  const schema = data.businessDataService.getSchemaReport();
  const contracts = data.businessDataService.getDataContracts();
  const leads = await data.businessDataService.findLeadsNeedingFollowUp(context);
  const quotes = await data.businessDataService.findQuotesNeedingFollowUp(context);
  const orders = await data.businessDataService.findOrdersRequiringAction(context);
  const manualPayments = await data.businessDataService.findManualPaymentOrders(context);
  console.log(JSON.stringify({
    demo: 'business-data-v0.4',
    safeMode: { dryRun: true, readOnly: true, writesAllowed: false },
    health,
    schema,
    contracts,
    results: {
      leads: leads.meta,
      quotes: quotes.meta,
      orders: orders.meta,
      manualPayments: manualPayments.meta,
    },
  }, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
