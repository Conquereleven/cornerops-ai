process.env.NODE_ENV = 'test';

const { ToolExecutionPolicy } = require('../src/integrations/openclaw/ToolExecutionPolicy');

describe('ToolExecutionPolicy', () => {
  test('classifies read-only, draft, confirmation, admin and forbidden actions', () => {
    const policy = new ToolExecutionPolicy({ requireApproval: true });

    expect(policy.evaluate({ actionType: 'read_orders' }).policyDecision)
      .toBe('allowed');
    expect(policy.evaluate({ actionType: 'draft_email' }).policyDecision)
      .toBe('draft_only');
    expect(policy.evaluate({ actionType: 'send_email' }).policyDecision)
      .toBe('requires_confirmation');
    expect(policy.evaluate({ actionType: 'deploy' }).policyDecision)
      .toBe('denied');
    expect(policy.evaluate({
      actionType: 'deploy',
      userRole: 'admin',
    }).policyDecision).toBe('requires_confirmation');
    expect(policy.evaluate({ actionType: 'delete_database' }).policyDecision)
      .toBe('denied');
  });

  test('denies tools outside allowlist', () => {
    const policy = new ToolExecutionPolicy({
      requireApproval: true,
      allowedTools: ['github.openIssue'],
    });

    expect(policy.evaluate({
      actionType: 'read_orders',
      toolName: 'shell.exec',
    }).policyDecision).toBe('denied');
  });
});
