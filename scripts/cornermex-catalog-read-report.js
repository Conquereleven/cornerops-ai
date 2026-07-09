#!/usr/bin/env node
require('./safe-cli-state-env');
const data = require('../src/core/data');

const main = async () => {
  const report = await data.cornerMexCatalogReadModelReportService.buildReport({
    requestId: `cornermex-catalog-read-report-${Date.now()}`,
    agentId: 'catalog-read-model-reconciliation-v1.6.2',
    channel: 'cli',
    userId: 'local-founder',
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex catalog read report failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
