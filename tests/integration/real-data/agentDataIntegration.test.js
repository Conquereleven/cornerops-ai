process.env.CORNEROPS_BUSINESS_DATA_ENABLED = 'false';
process.env.CORNERMEX_LOVABLE_ENABLED = 'false';
process.env.CORNERMEX_SUPABASE_ENABLED = 'false';
process.env.CORNEROPS_CORNERMEX_CONNECTOR_ENABLED = 'false';
process.env.GITHUB_ENABLED = 'false';
process.env.CORNEROPS_GITHUB_REAL_READ_ONLY_ENABLED = 'false';
process.env.OPENCLAW_ENABLED = 'false';

const { agentOrchestrator } = require('../../../src/core/agents');

describe('agents use real/mock data tools safely', () => {
  jest.setTimeout(60000);

  test('daily-briefing-agent includes data metrics', async () => {
    const result = await agentOrchestrator.handleMessage({
      userId: 'operator',
      channel: 'internal',
      text: 'Dame mi briefing de hoy con datos mock',
    });
    expect(result.agentId).toBe('daily-briefing-agent');
    expect(result.dataSnapshot.metrics.leads).toBeGreaterThan(0);
    expect(result.dataSnapshot.metrics.quotesFollowUp).toBeGreaterThan(0);
  });

  test('b2b-sales-agent uses leads and produces draft context', async () => {
    const result = await agentOrchestrator.handleMessage({
      userId: 'operator',
      channel: 'internal',
      text: 'Prepara follow-up para un restaurante interesado en Tajin y Pulparindo',
    });
    expect(result.agentId).toBe('b2b-sales-agent');
    expect(result.status).toBe('dry_run');
    expect(result.dataSnapshot.metrics.leadsFollowUp).toBeGreaterThan(0);
  });

  test('quotes-orders-agent requires approval for payment mutation', async () => {
    const result = await agentOrchestrator.handleMessage({
      userId: 'operator',
      channel: 'internal',
      text: 'Marca esta orden como pagada',
      metadata: { orderId: 'order-bank-transfer-001' },
    });
    expect(result.agentId).toBe('quotes-orders-agent');
    expect(result.status).toBe('needs_approval');
    expect(result.dataSnapshot.metrics.manualPayments).toBeGreaterThan(0);
  });

  test('dev-codex-github-agent creates issue draft only', async () => {
    const result = await agentOrchestrator.handleMessage({
      userId: 'operator',
      channel: 'internal',
      text: 'Crea un issue para corregir pagos manuales',
    });
    expect(result.agentId).toBe('dev-codex-github-agent');
    expect(result.status).toBe('needs_approval');
    expect(result.dataSnapshot.raw.issueDraft.status).toBe('draft');
  });

  test('security-audit-agent summarizes audit data without mutation', async () => {
    const result = await agentOrchestrator.handleMessage({
      userId: 'operator',
      channel: 'internal',
      text: 'Revisa logs de acciones rechazadas',
    });
    expect(result.agentId).toBe('security-audit-agent');
    expect(result.status).toBe('dry_run');
    expect(result.dataSnapshot.metrics.auditLogs).toBeGreaterThan(0);
  });
});
