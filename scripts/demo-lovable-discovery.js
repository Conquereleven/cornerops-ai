#!/usr/bin/env node
require('./safe-cli-state-env');
const data = require('../src/core/data');

const main = async () => {
  const discovery = await data.lovableProjectDiscoveryService.discover();
  process.stdout.write(`${JSON.stringify({
    demo: 'lovable_discovery',
    enabled: discovery.enabled,
    discoveryMode: discovery.discoveryMode,
    sourceMode: discovery.sourceMode,
    projectConfigured: discovery.project.configured,
    githubRepoConfigured: discovery.repo.configured,
    supabaseConfigured: discovery.supabase.configured,
    appRoutes: discovery.repo.appRoutes,
    adminRoutes: discovery.repo.adminRoutes,
    entities: discovery.entities,
    flows: discovery.flows,
    warnings: discovery.warnings,
    founderNextSteps: discovery.nextSteps,
    realLovableCalled: false,
  }, null, 2)}\n`);
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`Lovable discovery demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
