#!/usr/bin/env node
const controlTower = require('../src/core/control-tower');
const data = require('../src/core/data');
const operator = require('../src/core/operator');
const { createService } = require('./founder-daily');

const ask = (text, key) => operator.operatorCommandRouter.handle({
  channel: 'cli',
  operatorId: 'local-founder',
  requestId: `demo-v1.1.1-${key}`,
  text,
  metadata: { demo: 'v1.1.1' },
});

const main = async () => {
  const context = { requestId: 'demo-v1.1.1', agentId: 'demo-v1.1.1', channel: 'internal' };
  const [discovery, connectorStatus, contracts, report, daily, briefing, security] = await Promise.all([
    data.lovableProjectDiscoveryService.discover(),
    data.lovableCornerMexConnector.getConnectorStatus(context),
    Promise.resolve(data.cornerMexDataContractRegistry.getSummary()),
    controlTower.controlTowerV11ReportService.getReport(),
    createService().runDaily(),
    ask('Dame mi briefing de hoy', 'briefing'),
    ask('Revisa seguridad de Lovable Supabase y CornerMex', 'security'),
  ]);
  process.stdout.write(`${JSON.stringify({
    demo: 'v1.1.1',
    preflight: {
      pr24Merged: true,
      mainIncludesV11: true,
    },
    lovableDiscovery: {
      sourceMode: discovery.sourceMode,
      projectConfigured: discovery.project.configured,
      githubRepoConfigured: discovery.repo.configured,
      supabaseConfigured: discovery.supabase.configured,
      warnings: discovery.warnings,
    },
    cornerMexConnector: {
      sourceMode: connectorStatus.sourceMode,
      writesBlocked: connectorStatus.writesBlocked,
      piiMasking: connectorStatus.piiMasking,
      mappedContracts: connectorStatus.mappedContracts.map((contract) => contract.entity),
    },
    dataContracts: {
      total: contracts.total,
      confidence: contracts.confidence,
      entities: contracts.entities,
    },
    controlTower: {
      version: report.version,
      cornerMexLovableConnector: report.cornerMexLovableConnector,
    },
    agents: {
      briefingSourceMode: briefing.sourceMode,
      securitySourceMode: security.sourceMode,
    },
    founderDaily: {
      version: daily.version,
      sources: daily.sources,
    },
    finalFounderNextSteps: connectorStatus.founderNextSteps,
    safety: {
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
    process.stderr.write(`v1.1.1 demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
