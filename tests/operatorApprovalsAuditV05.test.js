const data = require('../src/core/data');
const openclaw = require('../src/integrations/openclaw');
const { operatorCommandRouter } = require('../src/core/operator');

const run = (text) => operatorCommandRouter.handle({
  operatorId: 'approval-operator',
  channel: 'cli',
  text,
});

describe('Operator approval and audit UX v0.5', () => {
  beforeEach(() => {
    openclaw.humanApprovalService.clearForTests();
    data.auditLogService.repository.clearForTests();
  });

  test('shows pending approvals with required operator fields', async () => {
    const approval = await data.approvalService.requestApproval({
      actionType: 'mark_order_paid',
      toolName: 'propose_payment_mark_paid',
      reason: 'Payment confirmation requires review.',
      payload: { orderId: 'order-1' },
    });
    const output = await run('Show pending approvals');
    expect(output.responseText).toContain(approval.id);
    expect(output.responseText).toContain('risk=high');
    expect(output.responseText).toContain('source=internal');
    expect(output.responseText).toContain('execution=dry_run');
    expect(output.responseText).toContain('Payment confirmation requires review.');
  });

  test('approve and reject update in-memory status without real execution', async () => {
    const first = await data.approvalService.requestApproval({ actionType: 'create_issue', toolName: 'github', payload: {} });
    const approved = await run(`Approve approval ${first.id}`);
    expect(approved.status).toBe('dry_run');
    expect(approved.responseText).toContain('No underlying action was executed');
    expect((await data.approvalService.getApproval(first.id)).status).toBe('approved');

    const second = await data.approvalService.requestApproval({ actionType: 'send_message', toolName: 'whatsapp', payload: {} });
    const rejected = await run(`Reject approval ${second.id}`);
    expect(rejected.status).toBe('dry_run');
    expect((await data.approvalService.getApproval(second.id)).status).toBe('rejected');
  });

  test('audit UX filters denied actions and errors with sanitized output', async () => {
    await data.auditLogService.record({
      eventType: 'secret_attempt',
      dataSource: 'operator_interface',
      policyDecision: 'denied',
      status: 'denied',
      input: { token: 'top-secret', email: 'maria@example.com' },
    });
    await data.auditLogService.record({
      eventType: 'operator_error',
      status: 'error',
      errorCode: 'SAFE_TEST_ERROR',
      errorMessage: 'Failed for maria@example.com',
    });
    const denied = await run('Show denied actions');
    const errors = await run('Show audit errors');
    expect(denied.responseText).toContain('secret_attempt');
    expect(denied.responseText).not.toContain('top-secret');
    expect(errors.responseText).toContain('SAFE_TEST_ERROR');
    expect(errors.responseText).not.toContain('maria@example.com');
  });
});
