const { ReadOnlyDatabaseAdapter } = require('../../../src/integrations/database/ReadOnlyDatabaseAdapter');

describe('business DB first real source v0.7', () => {
  test('allows audited real read-only SELECTs while dry-run safeguards stay enabled', async () => {
    const auditLogService = { record: jest.fn(async () => ({ id: 'audit-db-read' })) };
    const postgresQuery = jest.fn(async () => ({ rows: [{
      id: 'lead-1',
      email: 'maria@example.com',
      phone: '+971500001234',
      contactName: 'Maria',
      notes: 'private note',
    }] }));
    const adapter = new ReadOnlyDatabaseAdapter({
      auditLogService,
      config: {
        auditReads: true,
        businessDataEnabled: true,
        credentialsAvailable: true,
        dryRun: true,
        maxRows: 10,
        mode: 'read_only',
        piiMasking: true,
        provider: 'postgres',
        readOnly: true,
        allowWrites: false,
      },
      postgresQuery,
    });
    await expect(adapter.health()).resolves.toMatchObject({
      mode: 'real_read_only',
      readOnlyVerified: true,
    });
    const result = await adapter.select({ table: 'leads', limit: 10 }, { requestId: 'db-v07' });
    expect(result).toMatchObject({ source: 'real_read_only', readOnly: true });
    expect(result.rows[0]).toMatchObject({
      email: 'ma***@example.com',
      contactName: 'M***',
      notes: '[REDACTED_PII]',
    });
    expect(result.rows[0].phone).not.toBe('+971500001234');
    expect(postgresQuery).toHaveBeenCalledWith(
      expect.stringMatching(/^SELECT /),
      [],
      expect.objectContaining({ readOnly: true }),
    );
    expect(auditLogService.record).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'database_read',
      policyDecision: 'allowed',
    }));
  });
});
