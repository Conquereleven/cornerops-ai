process.env.CORNEROPS_CONTEXT_LAYER_ENABLED = 'true';
process.env.GITHUB_CONTEXT_ENABLED = 'true';
process.env.SLACK_CONTEXT_ENABLED = 'true';
process.env.WHATSAPP_CONTEXT_ENABLED = 'true';
process.env.TELEGRAM_CONTEXT_ENABLED = 'true';
process.env.NOTION_CONTEXT_ENABLED = 'true';
process.env.CLAWPDF_ENABLED = 'true';

const { agentOrchestrator } = require('../../../src/core/agents');

describe('agents use context layer safely', () => {
  test('daily-briefing-agent uses context tools', async () => {
    const output = await agentOrchestrator.handleMessage({
      userId: 'operator',
      channel: 'internal',
      text: 'Dame mi briefing de hoy con contexto historico',
    });
    expect(output.agentId).toBe('daily-briefing-agent');
    expect(output.dataSnapshot.metrics.contextResults).toBeGreaterThan(0);
  });

  test('b2b-sales-agent finds lead communication history', async () => {
    const output = await agentOrchestrator.handleMessage({
      userId: 'operator',
      channel: 'internal',
      text: 'Busca historial de comunicacion para restaurante interesado en Tajin y Pulparindo',
      metadata: { leadId: 'lead-restaurante-tajin-001' },
    });
    expect(output.agentId).toBe('b2b-sales-agent');
    expect(output.dataSnapshot.metrics.communicationHistory).toBeGreaterThan(0);
  });

  test('dev-codex-github-agent finds related GitHub context', async () => {
    const output = await agentOrchestrator.handleMessage({
      userId: 'operator',
      channel: 'internal',
      text: 'Encuentra issues relacionados con manual payments Bank Transfer',
    });
    expect(output.agentId).toBe('dev-codex-github-agent');
    expect(output.dataSnapshot.metrics.githubContext).toBeGreaterThan(0);
  });

  test('security-audit-agent reports context access risks', async () => {
    const output = await agentOrchestrator.handleMessage({
      userId: 'operator',
      channel: 'internal',
      text: 'Revisa riesgos de contexto high PII y accesos rechazados',
    });
    expect(output.agentId).toBe('security-audit-agent');
    expect(output.dataSnapshot.metrics.contextHealthWarnings).toBeGreaterThan(0);
  });
});
