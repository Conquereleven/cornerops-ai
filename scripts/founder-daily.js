#!/usr/bin/env node
const actions = require('../src/core/actions');
const controlTower = require('../src/core/control-tower');
const operator = require('../src/core/operator');
const { FounderFirstRunService } = require('../src/core/setup/FounderFirstRunService');
const env = require('../src/config/env');
const { createInternalOperationsStore } = require('../src/core/work-queue');
const { CommercialOperationsService, PostgresCommercialOperationsStore, UnavailableCommercialOperationsStore } = require('../src/core/commercial');

const createCommercialService = () => {
  const internalStore = createInternalOperationsStore(env);
  const store = internalStore.pool
    ? new PostgresCommercialOperationsStore({ internalStore })
    : new UnavailableCommercialOperationsStore();
  return new CommercialOperationsService({ config: env, store });
};

const createService = () => new FounderFirstRunService({
  actions,
  backupService: controlTower.localStateBackupService,
  controlTowerReportService: controlTower.controlTowerV11ReportService || controlTower.controlTowerV10ReportService,
  operatorCommandRouter: operator.operatorCommandRouter,
  setupValidator: controlTower.founderSetupValidator,
});

const main = async () => {
  const result = await createService().runDaily();
  result.commercialOperations = await createCommercialService().founderDaily();
  result.commercialOperations.activationStatus = env.corneropsCommercialOperationsEnabled
    ? 'enabled_internal_only' : 'configuration_required';
  result.commercialOperations.externalSendsBlocked = true;
  result.commercialOperations.paymentCaptureBlocked = true;
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
