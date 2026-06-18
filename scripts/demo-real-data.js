const { agentOrchestrator } = require('../src/core/agents');
const dataCore = require('../src/core/data');

const messages = [
  'Dame mi briefing de hoy con datos reales o mock',
  'Que leads B2B requieren follow-up',
  'Que quotes estan sin seguimiento',
  'Que ordenes Bank Transfer o CoD requieren accion',
  'Crea un draft de issue en GitHub para un bug de pagos manuales',
  'Revisa audit logs y dime si hay acciones rechazadas',
  'Dime el estado de salud de las fuentes de datos',
];

const run = async () => {
  console.log('CornerOps real-data demo (dry run)');
  for (const text of messages) {
    const result = await agentOrchestrator.handleMessage({
      conversationId: 'demo-real-data',
      userId: 'demo-operator',
      channel: 'internal',
      text,
    });
    console.log('\n---');
    console.log(text);
    console.log(JSON.stringify({
      agentId: result.agentId,
      status: result.status,
      metrics: result.dataSnapshot?.metrics,
    }, null, 2));
  }
  console.log('\nData health');
  console.log(JSON.stringify(await dataCore.dataHealthService.getReport(), null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
