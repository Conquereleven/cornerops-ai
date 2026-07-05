#!/usr/bin/env node
require('./safe-cli-state-env');
const data = require('../src/core/data');

const main = async () => {
  const context = {
    requestId: 'demo-cornermex-real-readonly-v1.4',
    agentId: 'demo-v1.4',
    channel: 'cli',
  };
  const [status, products, leads, quotes, orders, customers] = await Promise.all([
    data.lovableCornerMexConnector.getConnectorStatus(context),
    data.lovableCornerMexConnector.listProducts({ limit: 3 }, context),
    data.lovableCornerMexConnector.listLeads({ limit: 3 }, context),
    data.lovableCornerMexConnector.listQuotes({ limit: 3 }, context),
    data.lovableCornerMexConnector.listOrders({ limit: 3 }, context),
    data.lovableCornerMexConnector.listCustomers({ limit: 3 }, context),
  ]);
  const summarize = (result) => ({
    sourceMode: result.meta?.source,
    dataSource: result.meta?.dataSource,
    supabaseStatus: result.meta?.supabaseStatus,
    tableAvailability: result.meta?.tableAvailability,
    rowCount: result.meta?.rowCount,
    readOnly: result.meta?.readOnly === true,
    writesBlocked: result.meta?.writesBlocked === true,
    externalSendsBlocked: result.meta?.externalSendsBlocked === true,
    maskingApplied: result.meta?.maskingApplied !== false,
    auditId: result.meta?.auditId,
    sample: (Array.isArray(result.data) ? result.data : []).slice(0, 1),
    warnings: result.meta?.warnings || [],
  });
  process.stdout.write(`${JSON.stringify({
    demo: 'cornermex_real_readonly_v1.4',
    connector: {
      sourceMode: status.sourceMode,
      dataSource: status.dataSource,
      supabaseStatus: status.supabaseStatus,
      tableAvailability: status.tableAvailability,
      maskingApplied: status.maskingApplied,
      writesBlocked: status.writesBlocked !== false,
      auditId: status.auditId,
      warnings: status.warnings,
    },
    collections: {
      products: summarize(products),
      leads: summarize(leads),
      quotes: summarize(quotes),
      orders: summarize(orders),
      customers: summarize(customers),
    },
    safety: {
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      noSecretsPrinted: true,
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex real read-only demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
