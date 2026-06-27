#!/usr/bin/env node
const data = require('../src/core/data');

const main = async () => {
  const result = await data.cornerMexLovableConfigIntakeService.check({
    requestId: 'cornermex-lovable-config-check',
    agentId: 'config-check',
    channel: 'cli',
  });
  process.stdout.write(`${JSON.stringify({
    check: 'cornermex_lovable_config',
    safe: result.unsafe.length === 0,
    status: result.status,
    currentMode: result.currentMode,
    sourceModeCandidate: result.sourceModeCandidate,
    canReachRepoDiscovered: result.canReachRepoDiscovered,
    canReachRealReadOnly: result.canReachRealReadOnly,
    configCompleteness: result.configCompleteness,
    readOnlyFlags: result.readOnlyFlags,
    limits: result.limits,
    missing: result.missing,
    unsafe: result.unsafe,
    secrets: result.secrets,
    founderNextSteps: result.founderNextSteps,
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex Lovable config check failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
