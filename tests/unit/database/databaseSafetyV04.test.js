const { DatabaseSafetyPolicy } = require('../../../src/integrations/database/DatabaseSafetyPolicy');
const { ReadOnlyDatabaseAdapter, withTimeout } = require('../../../src/integrations/database/ReadOnlyDatabaseAdapter');
const { MockDataAdapter } = require('../../../src/integrations/database/adapters/MockDataAdapter');

describe('v0.4 database safety', () => {
  const policy = new DatabaseSafetyPolicy();

  test.each([
    'INSERT INTO leads VALUES (1)',
    'UPDATE leads SET status = \'won\'',
    'DELETE FROM leads',
    'DROP TABLE leads',
    'ALTER TABLE leads ADD secret text',
    'VACUUM leads',
  ])('denies mutation query: %s', (query) => {
    expect(policy.evaluate(query)).toMatchObject({ allowed: false, readOnly: true });
  });

  test('allows one explicit SELECT and denies unknown or locking queries', () => {
    expect(policy.evaluate('SELECT id FROM leads LIMIT 10')).toMatchObject({ allowed: true, readOnly: true });
    expect(policy.evaluate('SOMETHING leads')).toMatchObject({ allowed: false, code: 'DB_QUERY_NOT_SELECT' });
    expect(policy.evaluate('SELECT * FROM leads FOR UPDATE')).toMatchObject({ allowed: false });
  });

  test('handles query timeout', async () => {
    await expect(withTimeout(() => new Promise(() => {}), 10)).rejects.toMatchObject({ code: 'DB_QUERY_TIMEOUT' });
  });

  test('uses mock safely, masks PII and audits every read', async () => {
    const events = [];
    const adapter = new ReadOnlyDatabaseAdapter({
      auditLogService: { record: async (event) => events.push(event) },
      config: { auditReads: true, maxRows: 2, piiMasking: true, readOnly: true },
      mockAdapter: new MockDataAdapter(),
    });
    const result = await adapter.select({ table: 'leads', limit: 20 }, { userId: 'operator' });
    expect(result).toMatchObject({ source: 'mock', readOnly: true, truncated: true });
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].email).toContain('***@');
    expect(result.rows[0].phone).toContain('******');
    expect(result.rows[0].contactName).toBe('O***');
    expect(result.rows[0].notes).toBe('[REDACTED_PII]');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ eventType: 'database_read', operation: 'select' });
  });

  test('fails closed when read audit service is unavailable', async () => {
    const adapter = new ReadOnlyDatabaseAdapter({
      config: { auditReads: true, readOnly: true },
      mockAdapter: new MockDataAdapter(),
    });
    await expect(adapter.select({ table: 'leads' })).rejects.toMatchObject({ code: 'DB_AUDIT_REQUIRED' });
  });

  test('missing real credentials degrades to audited mock mode', async () => {
    const adapter = new ReadOnlyDatabaseAdapter({
      auditLogService: { record: async () => null },
      config: { businessDataEnabled: true, credentialsAvailable: false, provider: 'supabase', readOnly: true },
      mockAdapter: new MockDataAdapter(),
    });
    await expect(adapter.health()).resolves.toMatchObject({ mode: 'mock', readOnlyVerified: true });
    expect((await adapter.health()).warnings).toContain('Read-only database credentials are missing.');
  });
});
