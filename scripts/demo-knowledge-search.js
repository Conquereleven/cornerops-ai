process.env.CORNEROPS_CONTEXT_LAYER_ENABLED = 'true';
process.env.GITHUB_CONTEXT_ENABLED = 'true';
process.env.SLACK_CONTEXT_ENABLED = 'true';
process.env.WHATSAPP_CONTEXT_ENABLED = 'true';
process.env.TELEGRAM_CONTEXT_ENABLED = 'true';
process.env.NOTION_CONTEXT_ENABLED = 'true';
process.env.CLAWPDF_ENABLED = 'true';

const { agentOrchestrator } = require('../src/core/agents');

const prompts = [
  'Dame mi briefing de hoy con contexto historico',
  'Busca historial de comunicacion para restaurante interesado en Tajin y Pulparindo',
  'Encuentra issues relacionados con manual payments Bank Transfer',
  'Revisa riesgos de contexto high PII y accesos rechazados',
];

const run = async () => {
  console.log('CornerOps knowledge-search demo (mock/dry-run)');
  for (const text of prompts) {
    const output = await agentOrchestrator.handleMessage({
      conversationId: 'demo-knowledge-search',
      userId: 'demo-operator',
      channel: 'internal',
      text,
    });
    console.log('\n---');
    console.log(text);
    console.log(JSON.stringify({
      agentId: output.agentId,
      status: output.status,
      metrics: output.dataSnapshot?.metrics,
    }, null, 2));
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
