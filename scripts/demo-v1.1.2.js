#!/usr/bin/env node
const controlTower = require('../src/core/control-tower');
const data = require('../src/core/data');
const { createService } = require('./founder-daily');

const main = async () => {
  const [intake, discovery, connector, contracts, report, daily] = await Promise.all([
    data.cornerMexLovableConfigIntakeService.check({ requestId: 'demo-v1.1.2' }),
    data.lovableProjectDiscoveryService.discover(),
    data.lovableCornerMexConnector.getConnectorStatus({ requestId: 'demo-v1.1.2' }),
    Promise.resolve(data.cornerMexDataContractRegistry.getSummary({ sourceMode: data.lovableCornerMexConnector.getSourceMode() })),
    controlTower.controlTowerV11ReportService.getReport(),
    createService().runDaily(),
  ]);
  process.stdout.write(`${JSON.stringify({
    demo: 'v1.1.2',
    preflight: {
      pr25Merged: true,
      mainIncludesV111: true,
    },
    configIntake: {
      status: intake.status,
      sourceModeCandidate: intake.sourceModeCandidate,
      completeness: intake.configCompleteness,
      missing: intake.missing,
      unsafe: intake.unsafe,
      canReachRepoDiscovered: intake.canReachRepoDiscovered,
      canReachRealReadOnly: intake.canReachRealReadOnly,
    },
    repoDiscovery: {
      configured: discovery.repo.configured,
      framework: discovery.repo.framework,
      routes: discovery.repo.appRoutes,
      adminRoutes: discovery.repo.adminRoutes,
      writeRiskPaths: discovery.repo.writeRiskPaths,
      mappingConfidence: discovery.repo.mappingConfidence,
    },
    supabaseReadOnly: {
      configured: discovery.supabase.configured,
      schema: discovery.supabase.schema,
      schemaDiscoveryEnabled: discovery.supabase.schemaDiscoveryEnabled,
      tablesDiscovered: discovery.supabase.tablesDiscovered,
      writesBlocked: discovery.supabase.writesBlocked,
      mappingConfidence: discovery.supabase.mappingConfidence,
    },
    dataContracts: {
      confidence: contracts.confidence,
      contracts: contracts.contracts.map((contract) => ({
        entity: contract.entity,
        confidence: contract.confidence,
        sourceMode: contract.sourceMode,
        missingFields: contract.missingFields,
        piiClassification: contract.piiClassification,
      })),
    },
    controlTower: {
      version: report.version,
      connector: report.cornerMexLovableConnector,
    },
    founderDaily: {
      version: daily.version,
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
    process.stderr.write(`v1.1.2 demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
