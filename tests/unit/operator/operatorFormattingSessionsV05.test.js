const { OperatorResponseFormatter } = require('../../../src/core/operator/OperatorResponseFormatter');
const { OperatorSessionService } = require('../../../src/core/operator/OperatorSessionService');

describe('Operator formatter and sessions v0.5', () => {
  test('shows source, approval, warnings and audit id while masking PII', () => {
    const formatter = new OperatorResponseFormatter();
    const text = formatter.format({
      answerText: 'Contact maria@example.com or +971500001234',
      sourceMode: 'mock',
      approvals: { required: true, approvalIds: ['approval-1'] },
      auditId: 'audit-1',
      warnings: ['Mock source only.'],
    });
    expect(text).toContain('## Source Mode\nmock');
    expect(text).toContain('## Requires Approval\nYes');
    expect(text).toContain('approvalIds: approval-1');
    expect(text).toContain('auditId: audit-1');
    expect(text).toContain('ma***@example.com');
    expect(text).not.toContain('+971500001234');
  });

  test('infers mock, read-only, mixed and disabled modes', () => {
    const formatter = new OperatorResponseFormatter();
    expect(formatter.inferSourceMode(['mock'])).toBe('mock');
    expect(formatter.inferSourceMode(['real_read_only'])).toBe('real_read_only');
    expect(formatter.inferSourceMode(['mock', 'read_only'])).toBe('mixed');
    expect(formatter.inferSourceMode(['internal'])).toBe('disabled');
  });

  test('sessions preserve intent but redact private metadata and raw text', () => {
    const service = new OperatorSessionService();
    const session = service.create({
      operatorId: 'founder',
      channel: 'cli',
      metadata: { text: 'private conversation', email: 'maria@example.com' },
    });
    expect(session.metadata.text).toBe('[REDACTED_PRIVATE_CONTENT]');
    expect(session.metadata.email).toContain('***@');
    const updated = service.touch(session.id, { lastIntent: 'briefing' });
    expect(updated.lastIntent).toBe('briefing');
    expect(updated).not.toHaveProperty('messages');
  });
});
