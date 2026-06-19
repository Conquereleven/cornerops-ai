const data = require('../../../src/core/data');

describe('v0.4 read-only business repositories', () => {
  beforeEach(() => {
    data.businessDataService.resetForTests();
    data.auditLogService.repository.clearForTests();
  });

  test('reads leads, quotes and orders with source metadata and max rows', async () => {
    const context = { requestId: 'repo-v04', userId: 'operator', agentId: 'daily-briefing-agent' };
    const leads = await data.businessDataService.listLeads({}, context);
    const quotes = await data.businessDataService.findQuotesNeedingFollowUp(context);
    const orders = await data.businessDataService.findOrdersRequiringAction(context);
    expect(leads.meta).toMatchObject({ source: 'mock', readOnly: true, rowCount: 5 });
    expect(quotes.meta).toMatchObject({ source: 'mock', readOnly: true, rowCount: 2 });
    expect(orders.meta).toMatchObject({ source: 'mock', readOnly: true, rowCount: 3 });
    expect(leads.data[0].email).toContain('***@');
    expect(leads.data.length).toBeLessThanOrEqual(100);
  });

  test('supports detail, related quote and manual payment reads without mutation APIs', async () => {
    const context = { requestId: 'repo-detail-v04', userId: 'operator' };
    const lead = await data.businessDataService.getLeadById('lead-restaurante-tajin-001', context);
    const related = await data.businessDataService.findQuotesByLeadId('lead-restaurante-tajin-001', context);
    const payments = await data.businessDataService.findManualPaymentOrders(context);
    expect(lead.meta.rowCount).toBe(1);
    expect(related.meta.rowCount).toBe(1);
    expect(payments.meta.rowCount).toBe(3);
    expect(data.businessDataService).not.toHaveProperty('updateOrder');
    expect(data.businessDataService).not.toHaveProperty('markPaymentPaid');
  });

  test('audits schema and business reads', async () => {
    await data.businessDataService.listLeads({}, { requestId: 'audit-v04', userId: 'operator' });
    const logs = await data.auditLogService.list({ limit: 100 });
    expect(logs.some((event) => event.eventType === 'database_read')).toBe(true);
    expect(logs.some((event) => event.eventType === 'business_data_read')).toBe(true);
    expect(logs.some((event) => event.eventType === 'schema_discovery')).toBe(true);
  });
});
