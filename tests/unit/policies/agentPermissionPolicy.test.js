process.env.NODE_ENV = 'test';

const { AgentPermissionPolicy } = require('../../../src/core/policies/AgentPermissionPolicy');
const { coreAgentDefinitions } = require('../../../src/core/agents/definitions');

const agent = (id) => coreAgentDefinitions.find((definition) => definition.id === id);
const input = { channel: 'slack', userId: 'U1', userRole: 'operator', metadata: {} };

describe('AgentPermissionPolicy', () => {
  test('applies read-only permissions', () => {
    const policy = new AgentPermissionPolicy({ dryRun: true });
    const result = policy.evaluate({
      agent: agent('security-audit-agent'),
      input,
      proposedActions: [{ type: 'read_audit_logs', toolName: 'read_audit_logs' }],
    });

    expect(result.allowed).toBe(true);
    expect(result.decision).toBe('dry_run');
  });

  test('denies read-only agents attempting mutation', () => {
    const policy = new AgentPermissionPolicy({ dryRun: true });
    const result = policy.evaluate({
      agent: agent('security-audit-agent'),
      input,
      proposedActions: [{ type: 'delete_logs', toolName: 'read_audit_logs', mutates: true }],
    });

    expect(result.allowed).toBe(false);
    expect(result.decision).toBe('denied');
  });

  test('requires approval for order and GitHub mutations', () => {
    const policy = new AgentPermissionPolicy({ dryRun: true, requireApproval: true });
    const orderResult = policy.evaluate({
      agent: agent('quotes-orders-agent'),
      input,
      proposedActions: [{
        type: 'mark_order_paid',
        toolName: 'propose_payment_mark_paid',
        mutates: true,
        requiresApproval: true,
      }],
    });
    const githubResult = policy.evaluate({
      agent: agent('dev-codex-github-agent'),
      input,
      proposedActions: [{
        type: 'create_issue',
        toolName: 'create_issue_pending_approval',
        mutates: true,
        requiresApproval: true,
      }],
    });

    expect(orderResult.requiresApproval).toBe(true);
    expect(githubResult.requiresApproval).toBe(true);
  });
});
