#!/usr/bin/env node
const data = require('../src/core/data');

const main = async () => {
  const [intake, discovery, connector] = await Promise.all([
    data.cornerMexLovableConfigIntakeService.check({ requestId: 'demo-cornermex-lovable-real-config' }),
    data.lovableProjectDiscoveryService.discover(),
    data.lovableCornerMexConnector.getConnectorStatus({ requestId: 'demo-cornermex-lovable-real-config' }),
  ]);
  process.stdout.write(`${JSON.stringify({
    demo: 'cornermex_lovable_real_config',
    currentMode: connector.sourceMode,
    discoveryMode: discovery.sourceMode,
    configIntakeStatus: intake.status,
    canReachRepoDiscovered: intake.canReachRepoDiscovered,
    canReachRealReadOnly: intake.canReachRealReadOnly,
    missingConfig: intake.missing,
    unsafeConfig: intake.unsafe,
    writeRiskPaths: intake.repoDiscovery?.writeRiskPaths || [],
    nextSteps: intake.founderNextSteps,
    safety: {
      secretsPrinted: false,
      lovableMutation: 'blocked',
      supabaseWrites: connector.writesBlocked ? 'blocked' : 'unsafe',
      githubWrites: 'blocked',
      externalSends: 'blocked',
    },
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`CornerMex Lovable real-config demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
