#!/usr/bin/env node
const controlTower = require('../src/core/control-tower');
const data = require('../src/core/data');
const { combineSourceModes } = require('../src/core/real-source');

const main = async () => {
  const [github, businessData, report] = await Promise.all([
    data.githubReadinessService.check({ testReads: false }),
    data.businessDataReadinessService.check({ testReads: false }),
    controlTower.controlTowerV11ReportService.getReport(),
  ]);
  process.stdout.write(`${JSON.stringify({
    demo: 'real_sources',
    selectedSource: report.realSourceExpansion.selectedSource,
    selectedSourceMode: report.realSourceExpansion.selectedSourceMode,
    sourceModeSummary: combineSourceModes([github.mode, businessData.mode]),
    github: {
      mode: github.mode,
      enabled: github.enabled,
      credentialsPresent: github.credentialsPresent,
      writesBlocked: github.writesBlocked,
    },
    businessData: {
      mode: businessData.mode,
      enabled: businessData.enabled,
      credentialsPresent: businessData.credentialsPresent,
      writesBlocked: businessData.writesBlocked,
      piiMasking: businessData.piiMasking,
    },
    controlTower: {
      version: report.version,
      status: report.status,
      warnings: report.realSourceExpansion.warnings,
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Real sources demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
