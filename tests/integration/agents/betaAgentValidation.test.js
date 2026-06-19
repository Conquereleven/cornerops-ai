const { agentOrchestrator } = require('../../../src/core/agents');

const run = (text) => agentOrchestrator.handleMessage({
  conversationId: 'beta-validation',
  userId: 'beta-operator',
  channel: 'internal',
  text,
});

describe('internal beta agent validation', () => {
  test.each([
    ['Give me today\'s operational briefing.', 'daily-briefing-agent'],
    ['Find leads that need follow-up and prepare draft messages.', 'b2b-sales-agent'],
    ['Which orders require action?', 'quotes-orders-agent'],
    ['Review open GitHub issues and propose next engineering tasks.', 'dev-codex-github-agent'],
    ['Review denied actions and high-risk tool attempts.', 'security-audit-agent'],
  ])('runs %s safely in mock/read-only mode', async (text, expectedAgent) => {
    const result = await run(text);
    expect(result.agentId).toBe(expectedAgent);
    expect(['dry_run', 'needs_approval']).toContain(result.status);
    expect(result.dataSnapshot?.metrics).toBeDefined();
    expect(result.responseText).toMatch(/Datos consultados:/);
  });

  test('GitHub engineering agent creates no issue in read-only mode', async () => {
    const result = await run('Create a real GitHub issue for this bug.');
    expect(result.agentId).toBe('dev-codex-github-agent');
    expect(result.status).toBe('needs_approval');
    expect(result.proposedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'create_issue', requiresApproval: true }),
    ]));
  });
});
