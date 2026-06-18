process.env.OPENCLAW_ECOSYSTEM_ENABLED = 'true';
process.env.OCTOPOOL_ENABLED = 'true';
process.env.CLAWHUB_ENABLED = 'true';
process.env.LOBSTER_ENABLED = 'true';

const { agentOrchestrator } = require('../src/core/agents');
const dataCore = require('../src/core/data');

const runAgent = async (text) => agentOrchestrator.handleMessage({
  conversationId: 'demo-control-tower',
  userId: 'demo-operator',
  channel: 'internal',
  text,
});

const run = async () => {
  console.log('CornerOps control tower demo (dry run)');
  const agentPrompts = [
    'Dame mi briefing de hoy',
    'Que leads B2B requieren follow-up',
    'Revisa quotes sin seguimiento',
    'Que ordenes requieren accion',
    'Resume GitHub issues y PRs',
    'Revisa audit logs de acciones rechazadas',
  ];
  for (const prompt of agentPrompts) {
    const result = await runAgent(prompt);
    console.log('\n---');
    console.log(prompt);
    console.log(JSON.stringify({
      agentId: result.agentId,
      status: result.status,
      metrics: result.dataSnapshot?.metrics,
    }, null, 2));
  }
  console.log('\nData health');
  console.log(JSON.stringify(await dataCore.dataHealthService.getReport(), null, 2));
  console.log('\nEcosystem services');
  console.log(JSON.stringify(dataCore.ecosystemRegistry.list(), null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
