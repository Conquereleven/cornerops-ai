const { agentOrchestrator } = require('../../../src/core/agents');

const run = (text, metadata = {}) => agentOrchestrator.handleMessage({
  conversationId: 'beta-v04',
  userId: 'beta-operator',
  channel: 'internal',
  text,
  metadata,
});

describe('v0.4 agent business-data validation', () => {
  test('daily briefing labels mock/read-only sources and uses business health', async () => {
    const result = await run('Dame mi briefing de hoy');
    expect(result.agentId).toBe('daily-briefing-agent');
    expect(result.dataSnapshot.sourceModes).toEqual(expect.arrayContaining(['mock']));
    expect(result.dataSnapshot.metrics.mappedEntities).toBe(5);
    expect(result.responseText).toContain('Modos de fuente:');
    expect(result.responseText).toContain('Top 3 prioridades:');
  });

  test('B2B produces drafts only from read-only data', async () => {
    const result = await run('Prepara follow-up B2B para este lead', { leadId: 'lead-restaurante-tajin-001' });
    expect(result.agentId).toBe('b2b-sales-agent');
    expect(result.status).toBe('dry_run');
    expect(result.proposedActions.some((action) => action.type === 'draft_message')).toBe(true);
    expect(result.dataSnapshot.sourceModes).toContain('mock');
    expect(result.dataSnapshot.metrics.relatedQuotes).toBe(1);
  });

  test('quotes/orders review never mutates and mutation requests require approval', async () => {
    const review = await run('Revisa quotes y ordenes pendientes');
    expect(review.status).toBe('dry_run');
    expect(review.dataSnapshot.metrics.ordersRequiringAction).toBeGreaterThan(0);
    const mutation = await run('Marca esta orden como pagada', { orderId: 'order-bank-transfer-001' });
    expect(mutation.status).toBe('needs_approval');
  });

  test('GitHub remains draft-only and security reports source risks', async () => {
    const dev = await run('Crea un issue para documentar el beta');
    expect(dev.status).toBe('needs_approval');
    expect(dev.proposedActions.every((action) => action.dryRunOnly)).toBe(true);
    const security = await run('Revisa seguridad, schema discovery y PII');
    expect(security.agentId).toBe('security-audit-agent');
    expect(security.dataSnapshot.metrics).toHaveProperty('schemaWarnings');
    expect(security.dataSnapshot.metrics).toHaveProperty('businessDataWarnings');
  });
});
