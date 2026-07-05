#!/usr/bin/env node
require('./safe-cli-state-env');
const data = require('../src/core/data');

const main = async () => {
  const discovery = await data.lovableSupabaseMigrationDiscoveryService.discover();
  const evidence = await data.cornerMexSchemaEvidenceService.getEvidence();
  process.stdout.write(`${JSON.stringify({
    demo: 'cornermex_schema_discovery',
    mode: discovery.mode,
    repository: discovery.repository,
    migrationFileCount: discovery.migrationFileCount,
    migrationsExecuted: discovery.migrationsExecuted,
    productionDbConnected: discovery.productionDbConnected,
    tables: discovery.tables,
    contracts: discovery.contracts,
    contractConfidence: evidence.mappedContracts.map((contract) => ({
      contract: contract.contract,
      confidence: contract.confidence,
      sourceTables: contract.sourceTables,
      piiFields: contract.piiFields,
    })),
    safety: {
      writes: 'blocked',
      migrations: 'not_executed',
      liveSupabase: 'not_required',
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex schema discovery demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
