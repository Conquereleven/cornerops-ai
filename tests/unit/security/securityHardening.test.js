const {
  sanitizeAuditPayload,
  sanitizeLogMetadata,
  sanitizeMessage,
  sanitizeValue,
} = require('../../../src/core/security/SecuritySanitizer');
const { DataAccessPolicy } = require('../../../src/core/data/DataAccessPolicy');
const { ContextAccessPolicy } = require('../../../src/core/context/ContextAccessPolicy');
const { ToolExecutionPolicy } = require('../../../src/core/policies/ToolExecutionPolicy');
const { AgentPermissionPolicy } = require('../../../src/core/policies/AgentPermissionPolicy');
const { HumanApprovalService } = require('../../../src/integrations/openclaw/HumanApprovalService');

describe('security hardening v0.3', () => {
  test('masks emails and phone numbers in nested values', () => {
    const sanitized = sanitizeValue({
      email: 'operator@cornermex.example',
      phone: '+971 50 123 4567',
      note: 'Contact buyer@restaurant.example or +52 55 1234 5678',
    });
    expect(sanitized.email).toBe('op***@cornermex.example');
    expect(sanitized.phone).toBe('+97******4567');
    expect(sanitized.note).not.toContain('buyer@restaurant.example');
    expect(sanitized.note).not.toContain('1234 5678');
  });

  test('redacts credentials, cookies and raw private content', () => {
    const sanitized = sanitizeLogMetadata({
      Authorization: 'Bearer secret-token',
      cookie: 'session=secret',
      password: 'secret',
      message: 'private WhatsApp message',
      nested: { service_role_key: 'secret' },
    });
    expect(sanitized.Authorization).toBe('[REDACTED]');
    expect(sanitized.cookie).toBe('[REDACTED]');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.message).toBe('[REDACTED_PRIVATE_CONTENT]');
    expect(sanitized.nested.service_role_key).toBe('[REDACTED]');
    expect(sanitizeMessage('Bearer super-secret-token operator@example.com'))
      .toBe('Bearer [REDACTED] op***@example.com');
  });

  test('truncates oversized audit payloads', () => {
    const sanitized = sanitizeAuditPayload({ safe: 'x'.repeat(2000) }, { maxBytes: 256 });
    expect(sanitized.truncated).toBe(true);
    expect(sanitized.originalBytes).toBeGreaterThan(256);
  });

  test('data and context policies deny unknown sources, modes and operations', () => {
    const dataPolicy = new DataAccessPolicy({ dryRun: true });
    const contextPolicy = new ContextAccessPolicy({ dryRun: true });
    expect(dataPolicy.evaluate({
      dataSource: { id: 'future', enabled: true, mode: 'mystery' },
      operation: 'read',
    }).allowed).toBe(false);
    expect(dataPolicy.evaluate({
      dataSource: { id: 'orders', enabled: true, mode: 'mock' },
      operation: 'erase_everything',
    }).allowed).toBe(false);
    expect(contextPolicy.evaluate({
      source: { id: 'future', enabled: true, mode: 'mystery', piiLevel: 'low' },
      operation: 'search',
    }).allowed).toBe(false);
  });

  test('core tool policy denies unknown action and unknown risk', () => {
    const policy = new ToolExecutionPolicy();
    expect(policy.evaluateAction({ type: 'future_tool_action' }).allowed).toBe(false);
    expect(policy.evaluateAction({ type: 'read_orders', riskLevel: 'mystery' }).allowed).toBe(false);
  });

  test('agent policy denies an unknown agent definition', () => {
    const policy = new AgentPermissionPolicy();
    const result = policy.evaluate({
      agent: {
        id: 'future-unknown-agent', enabled: true, permissionLevel: 'read_only',
        allowedChannels: ['internal'], allowedTools: [], requiresHumanApprovalFor: [],
      },
      input: { channel: 'internal', userId: 'operator' },
      proposedActions: [],
    });
    expect(result.allowed).toBe(false);
  });

  test('unknown approval status cannot become approved', () => {
    const approvals = new HumanApprovalService();
    approvals.clearForTests();
    const approval = approvals.createApproval({ actionType: 'write', payload: {} });
    expect(approvals.updateStatus(approval.id, 'unknown', 'operator')).toBeNull();
    expect(approvals.isApproved(approval.id)).toBe(false);
  });
});
