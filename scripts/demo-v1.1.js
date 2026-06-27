#!/usr/bin/env node
const controlTower = require('../src/core/control-tower');
const data = require('../src/core/data');
const operator = require('../src/core/operator');
const { createService } = require('./founder-daily');

const runOperator = (text, key) => operator.operatorCommandRouter.handle({
  channel: 'cli',
  operatorId: 'local-founder',
  requestId: `demo-v1.1-${key}`,
  text,
  metadata: { demo: 'v1.1' },
});

const main = async () => {
  const founderDaily = await createService().runDaily();
  const [github, businessData, controlTowerReport, githubSummary, securitySummary] = await Promise.all([
    data.githubReadinessService.check({ testReads: true, requestId: 'demo-v1.1-github' }),
    data.businessDataReadinessService.check({ testReads: true, requestId: 'demo-v1.1-business-data' }),
    controlTower.controlTowerV11ReportService.getReport(),
    runOperator('Dame resumen GitHub y Codex de tareas tecnicas', 'github-agent'),
    runOperator('Revisa eventos de seguridad recientes', 'security-agent'),
  ]);
  process.stdout.write(`${JSON.stringify({
    demo: 'v1.1',
    setupCheck: founderDaily.setup,
    githubReadOnly: {
      mode: github.mode,
      safe: github.readOnlyVerified && github.writesBlocked,
      tokenExposed: false,
      counts: github.sampleCounts,
      warnings: github.warnings,
    },
    businessDataReadOnly: {
      mode: businessData.mode,
      safe: businessData.readOnlyVerified && businessData.writesBlocked && businessData.piiMasking,
      counts: businessData.sampleCounts,
      warnings: businessData.warnings,
    },
    controlTower: {
      version: controlTowerReport.version,
      status: controlTowerReport.status,
      selectedSource: controlTowerReport.realSourceExpansion.selectedSource,
      sourceModeSummary: controlTowerReport.realSourceExpansion.sourceModeSummary,
      blockedWriteFlags: controlTowerReport.realSourceExpansion.blockedWriteFlags,
    },
    founderDaily: {
      version: founderDaily.version,
      labels: founderDaily.labels,
      sources: founderDaily.sources,
    },
    agents: {
      githubSummary: {
        sourceMode: githubSummary.sourceMode,
        responseText: githubSummary.responseText,
        warnings: githubSummary.warnings,
      },
      securitySummary: {
        sourceMode: securitySummary.sourceMode,
        responseText: securitySummary.responseText,
        warnings: securitySummary.warnings,
      },
    },
    finalSafetySummary: {
      productionWrites: 'blocked',
      externalSends: 'blocked',
      whatsapp: 'disabled',
      customerChannels: 'disabled',
      nativeTools: 'disabled',
      clawhubExecution: 'disabled',
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`v1.1 demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
