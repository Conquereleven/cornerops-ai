#!/usr/bin/env node
const actions = require('../src/core/actions');
const controlTower = require('../src/core/control-tower');
const operator = require('../src/core/operator');
const { FounderFirstRunService } = require('../src/core/setup/FounderFirstRunService');

const createService = () => new FounderFirstRunService({
  actions,
  backupService: controlTower.localStateBackupService,
  controlTowerReportService: controlTower.controlTowerV10ReportService,
  operatorCommandRouter: operator.operatorCommandRouter,
  setupValidator: controlTower.founderSetupValidator,
});

const main = async () => {
  const result = await createService().runDaily();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.setup.status === 'blocked') process.exitCode = 1;
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Founder daily failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { createService, main };
