const { OperatorChatResponseFormatter } = require('../../../src/core/operator/OperatorChatResponseFormatter');

describe('OperatorChatResponseFormatter v0.6', () => {
  test('shows status, source, approval and audit while masking PII', () => {
    const formatter = new OperatorChatResponseFormatter({ maxMessageChars: 12000 });
    const text = formatter.format({
      status: 'needs_approval',
      answerText: 'Contact founder@example.com or +971500001234.',
      sourceMode: 'read_only',
      approvals: { required: true },
      auditId: 'audit-test',
    });
    expect(text).toContain('Status: needs_approval');
    expect(text).toContain('Source: read_only');
    expect(text).toContain('Approval: required');
    expect(text).toContain('Audit: audit-test');
    expect(text).not.toContain('founder@example.com');
    expect(text).not.toContain('+971500001234');
  });

  test('truncates oversized chat output with a safe handoff', () => {
    const formatter = new OperatorChatResponseFormatter({ maxMessageChars: 1000 });
    const text = formatter.format({ answerText: 'x'.repeat(3000), status: 'success' });
    expect(text.length).toBeLessThanOrEqual(1000);
    expect(text).toContain('Use the CLI or Control Tower');
  });
});
