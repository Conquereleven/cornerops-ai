#!/usr/bin/env node
const controlTower = require('../src/core/control-tower');
const data = require('../src/core/data');
const { createService } = require('./founder-daily');

const main = async () => {
  const [migrationDiscovery, supabaseDiscovery, connector, contracts, report, daily] = await Promise.all([
    data.lovableSupabaseMigrationDiscoveryService.discover(),
    data.lovableSupabaseDiscoveryService.discover(),
    data.lovableCornerMexConnector.getConnectorStatus({ requestId: 'demo-v1.1.3' }),
    data.cornerMexDataContractRegistry.getSummary({
      sourceMode: 'schema_discovered',
      sourceReference: 'lovable-repo-supabase-migrations',
      schemaEvidence: (await data.cornerMexSchemaEvidenceService.getEvidence()).schemaEvidence,
    }),
    controlTower.controlTowerV11ReportService.getReport(),
    createService().runDaily(),
  ]);
  process.stdout.write(`${JSON.stringify({
    demo: 'v1.1.3',
    preflight: {
      pr26Merged: true,
      mainIncludesV112: true,
    },
    migrationSchemaDiscovery: {
      mode: migrationDiscovery.mode,
      migrationFileCount: migrationDiscovery.migrationFileCount,
      tables: migrationDiscovery.tables,
      contracts: migrationDiscovery.contracts,
      writeRiskSql: migrationDiscovery.writeRiskSql,
    },
    supabaseReadOnly: {
      sourceMode: supabaseDiscovery.sourceMode,
      configured: supabaseDiscovery.configured,
      writesBlocked: supabaseDiscovery.writesBlocked,
      missingCredentials: !supabaseDiscovery.configured,
    },
    connector: {
      sourceMode: connector.sourceMode,
      schemaDiscovery: connector.schemaDiscovery,
      contractConfidence: connector.contractConfidence,
      nextAction: connector.founderNextSteps?.[0],
    },
    dataContracts: {
      confidence: contracts.confidence,
      contracts: contracts.contracts.map((contract) => ({
        entity: contract.entity,
        confidence: contract.confidence,
        sourceMode: contract.sourceMode,
        mappedSourceTables: contract.mappedSourceTables,
        piiFields: contract.piiFields,
      })),
    },
    controlTower: {
      version: report.cornerMexLovableConnector?.version,
      sourceMode: report.cornerMexLovableConnector?.sourceMode,
      schemaDiscovered: report.cornerMexLovableConnector?.schemaDiscovered,
      exactNextRecommendedAction: report.cornerMexLovableConnector?.exactNextRecommendedAction,
    },
    founderDaily: {
      sources: daily.sources,
      safetySummary: daily.safetySummary,
    },
    finalSafetySummary: {
      writes: 'blocked',
      externalSends: 'blocked',
      lovableProjectMutation: 'blocked',
      productionDbWrites: 'blocked',
      telegramV12: 'not_started',
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`v1.1.3 demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
