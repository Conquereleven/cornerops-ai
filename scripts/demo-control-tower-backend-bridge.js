const { run: contractDemo } = require('./demo-control-tower-frontend-contract');

async function run() {
  const payload = await contractDemo();
  const summary = {
    status: 'demo_ok',
    bridgeMode: 'read_only',
    apiVersion: payload.version,
    sections: Object.keys(payload.sections),
    sampleEndpoint: '/api/control-tower/frontend/v1/connection-test',
    sourceMode: payload.sections.status.sourceMode,
    writesBlocked: Object.values(payload.sections).every((section) => section.writesBlocked === true),
    externalSendsBlocked: Object.values(payload.sections).every((section) => section.externalSendsBlocked === true),
    authRequired: true,
    corsAllowlistRequired: true,
    noSecretsPrinted: true,
    warnings: [
      'This demo uses local contract data only; no production backend, Lovable, Supabase or external send is contacted.',
    ],
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(`Control Tower backend bridge demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { run };
