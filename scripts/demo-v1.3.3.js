const { run: bridgeDemo } = require('./demo-control-tower-backend-bridge');
const { run: apiCheck } = require('./control-tower-frontend-api-check');

async function run() {
  const bridge = await bridgeDemo();
  const api = await apiCheck();
  const summary = {
    status: 'v1.3.3_demo_complete',
    bridge,
    apiCheck: api,
    safety: {
      productionWritesEnabled: false,
      whatsappSendsEnabled: false,
      emailSendsEnabled: false,
      customerChannelsEnabled: false,
      openClawStarted: false,
      supabaseServiceRoleUsed: false,
    },
    founderNextSteps: [
      'Generate an operator token locally.',
      'Run npm run control-tower:frontend-token-hash and place only the hash in .env.',
      'Configure CONTROL_TOWER_FRONTEND_ALLOWED_ORIGINS for the Lovable preview/deploy origin.',
      'Enable CONTROL_TOWER_FRONTEND_API_ENABLED=true when ready.',
    ],
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

if (require.main === module) {
  run().catch((error) => {
    process.stderr.write(`v1.3.3 demo failed safely: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { run };
