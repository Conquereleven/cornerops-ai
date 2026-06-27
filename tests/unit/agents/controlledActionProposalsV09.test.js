const { createHarness } = require('./testAgentHarness');

const input = (text, channel = 'internal') => ({
  messageId: `message-${Math.random()}`,
  conversationId: 'conversation-v09',
  requestId: `request-${Math.random()}`,
  userId: 'founder',
  channel,
  text,
});

describe('v0.9 controlled-action agent proposals', () => {
  test('dev agent proposes GitHub issue creation behind approval', async () => {
    const { orchestrator } = createHarness();
    const output = await orchestrator.handleMessage(input('Create a GitHub issue for the manual payment audit bug'));
    expect(output).toMatchObject({ agentId: 'dev-codex-github-agent', status: 'needs_approval' });
    expect(output.proposedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ controlledActionId: 'github.issue.create', requiresApproval: true }),
    ]));
  });

  test('sales and quotes agents propose only local note/task actions', async () => {
    const sales = await createHarness().orchestrator.handleMessage(input('Create an internal task for stale B2B leads'));
    expect(sales.proposedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ controlledActionId: 'cornerops.task.create', dryRunOnly: true }),
    ]));
    const quotes = await createHarness().orchestrator.handleMessage(input('Create an internal note for this quote follow-up'));
    expect(quotes.proposedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ controlledActionId: 'cornerops.note.create', dryRunOnly: true }),
    ]));
    expect(quotes.proposedActions.some((action) => action.controlledActionId === 'github.issue.create')).toBe(false);
  });

  test('security agent can propose a task but order/payment mutation stays non-executable', async () => {
    const security = await createHarness().orchestrator.handleMessage(input('Security audit: create a task for rejected actions'));
    expect(security.proposedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ controlledActionId: 'cornerops.task.create', requiresApproval: true }),
    ]));
    const payment = await createHarness().orchestrator.handleMessage(input('Mark order 123 as paid'));
    expect(payment.agentId).toBe('quotes-orders-agent');
    expect(payment.proposedActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'mark_order_paid', dryRunOnly: true }),
    ]));
    expect(payment.proposedActions.some((action) => action.controlledActionId)).toBe(false);
  });
});
