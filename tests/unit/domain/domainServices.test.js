const dataCore = require('../../../src/core/data');

describe('CornerOps domain services', () => {
  beforeEach(() => {
    dataCore.auditLogService.repository.clearForTests();
  });

  test('LeadService lists leads and detects follow-ups', async () => {
    const leads = await dataCore.leadService.listLeads();
    const followUps = await dataCore.leadService.findLeadsNeedingFollowUp();
    expect(leads.length).toBeGreaterThan(0);
    expect(followUps.length).toBeGreaterThan(0);
  });

  test('QuoteService detects quotes needing follow-up', async () => {
    const quotes = await dataCore.quoteService.findQuotesNeedingFollowUp();
    expect(quotes.map((quote) => quote.status)).toContain('follow_up_needed');
  });

  test('OrderService detects requiring-action and manual payment orders', async () => {
    const requiringAction = await dataCore.orderService.findOrdersRequiringAction();
    const manualPayments = await dataCore.orderService.findManualPaymentOrders();
    expect(requiringAction.length).toBeGreaterThan(0);
    expect(manualPayments.some((order) => order.paymentMethod === 'bank_transfer')).toBe(true);
    expect(manualPayments.some((order) => order.paymentMethod === 'cod')).toBe(true);
  });

  test('AuditLogService creates sanitized logs', async () => {
    const log = await dataCore.auditLogService.record({
      eventType: 'data_read',
      dataSource: 'leads',
      input: { email: 'jose@example.com', token: 'abc' },
    });
    expect(log.sanitizedInput.email).toBe('jo***@example.com');
    expect(log.sanitizedInput.token).toBe('[REDACTED]');
  });

  test('ApprovalService creates pending approvals', async () => {
    const approval = await dataCore.approvalService.requestApproval({
      actionType: 'create_github_issue',
      createdBy: 'operator',
      payload: { title: 'Bug' },
    });
    expect(approval.status).toBe('pending');
  });
});
