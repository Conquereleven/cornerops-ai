const { BusinessDataContractRegistry } = require('../../../src/core/data-contracts/BusinessDataContractRegistry');
const { SchemaDiscoveryService } = require('../../../src/integrations/database/SchemaDiscoveryService');
const { piiGuessForColumn } = require('../../../src/integrations/database/schemaDiscoveryTypes');

describe('v0.4 schema discovery and contracts', () => {
  const adapter = {
    config: { schema: 'mock' },
    health: async () => ({ mode: 'mock', provider: 'mock', readOnlyVerified: true, warnings: [] }),
    select: async ({ table }) => ({
      rows: [{
        id: `${table}-1`,
        companyName: 'Company',
        quoteNumber: 'Q-1',
        orderNumber: 'O-1',
        status: 'new',
        paymentStatus: 'pending',
        paymentMethod: 'manual',
        currency: 'AED',
        total: 10,
        createdAt: '2026-06-19T00:00:00.000Z',
        email: 'masked@example.com',
        eventType: 'database_read',
        actionType: 'review',
      }],
    }),
  };

  test('generates a verified mock discovery report and PII guesses', async () => {
    const events = [];
    const service = new SchemaDiscoveryService({
      adapter,
      auditLogService: { record: async (event) => events.push(event) },
    });
    const report = await service.discover();
    expect(report).toMatchObject({ provider: 'mock', readOnlyVerified: true });
    expect(report.tables).toHaveLength(5);
    expect(report.tables[0].columns.find((column) => column.name === 'email').piiGuess).toBe('high');
    expect(piiGuessForColumn('customerName')).toBe('high');
    expect(events[0]).toMatchObject({ eventType: 'schema_discovery' });
  });

  test('maps lead, quote and order contracts with confidence and warnings', async () => {
    const report = await new SchemaDiscoveryService({ adapter, auditLogService: { record: async () => null } }).discover();
    const registry = new BusinessDataContractRegistry();
    const mappings = registry.mapSchema(report);
    expect(mappings.map((mapping) => mapping.entity)).toEqual(['lead', 'quote', 'order', 'audit_log', 'approval']);
    expect(registry.getMapping('lead').confidence).toBe('high');
    expect(registry.getMapping('quote').confidence).toBe('high');
    expect(registry.getMapping('order').confidence).toBe('high');
    expect(registry.getMapping('audit_log').confidence).toBe('high');
    expect(registry.getMapping('approval').confidence).toBe('high');
  });

  test('reports low confidence and missing fields', () => {
    const registry = new BusinessDataContractRegistry();
    registry.mapSchema({ tables: [{ tableName: 'leads', columns: [{ name: 'id' }] }] });
    expect(registry.getMapping('lead')).toMatchObject({ confidence: 'low' });
    expect(registry.getMapping('lead').missingRequiredFields).toEqual(expect.arrayContaining(['companyName', 'status', 'createdAt']));
    expect(registry.getMapping('quote').warnings[0]).toContain('was not discovered');
  });
});
