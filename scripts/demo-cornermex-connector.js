#!/usr/bin/env node
require('./safe-cli-state-env');
const data = require('../src/core/data');

const main = async () => {
  const context = { requestId: 'demo-cornermex-connector', agentId: 'demo-cornermex-connector', channel: 'internal' };
  const [status, products, leads, quotes, orders, customers] = await Promise.all([
    data.lovableCornerMexConnector.getConnectorStatus(context),
    data.lovableCornerMexConnector.listProducts({ limit: 10 }, context),
    data.lovableCornerMexConnector.listLeads({ limit: 10 }, context),
    data.lovableCornerMexConnector.listQuotes({ limit: 10 }, context),
    data.lovableCornerMexConnector.listOrders({ limit: 10 }, context),
    data.lovableCornerMexConnector.listCustomers({ limit: 10 }, context),
  ]);
  process.stdout.write(`${JSON.stringify({
    demo: 'cornermex_connector',
    status: {
      sourceMode: status.sourceMode,
      writesBlocked: status.writesBlocked,
      piiMasking: status.piiMasking,
      contractConfidence: status.contractConfidence,
      warnings: status.warnings,
    },
    counts: {
      products: products.meta.rowCount,
      leads: leads.meta.rowCount,
      quotes: quotes.meta.rowCount,
      orders: orders.meta.rowCount,
      customers: customers.meta.rowCount,
    },
    sample: {
      products: products.data.slice(0, 2),
      leads: leads.data.slice(0, 1),
      orders: orders.data.slice(0, 2),
    },
    writes: {
      products: 'blocked',
      leads: 'blocked',
      quotes: 'blocked',
      orders: 'blocked',
      customers: 'blocked',
      payments: 'blocked',
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex connector demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
