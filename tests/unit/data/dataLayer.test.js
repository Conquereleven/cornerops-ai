const { DataAccessPolicy, maskEmail, maskPhone, maskPii } = require('../../../src/core/data/DataAccessPolicy');
const { DataNormalizer } = require('../../../src/core/data/DataNormalizer');
const { DataSourceRegistry } = require('../../../src/core/data/DataSourceRegistry');
const { DATA_OPERATIONS } = require('../../../src/core/data/dataTypes');
const { MockDataAdapter } = require('../../../src/integrations/database/adapters/MockDataAdapter');

describe('CornerOps data layer', () => {
  test('DataSourceRegistry registers core sources', () => {
    const registry = new DataSourceRegistry({ config: { dataMode: 'mock' } });
    expect(registry.has('leads')).toBe(true);
    expect(registry.has('orders')).toBe(true);
    expect(registry.has('github')).toBe(true);
    expect(registry.list()).toHaveLength(8);
  });

  test('DataAccessPolicy permits authorized reads and denies unauthorized operations', () => {
    const registry = new DataSourceRegistry({ config: { dataMode: 'mock' } });
    const policy = new DataAccessPolicy({ dryRun: true });
    const readDecision = policy.evaluate({
      agentId: 'daily-briefing-agent',
      channel: 'internal',
      dataSource: registry.get('leads'),
      operation: DATA_OPERATIONS.READ,
      userId: 'operator',
    });
    expect(readDecision.allowed).toBe(true);
    expect(readDecision.decision).toBe('dry_run');

    const denied = policy.evaluate({
      agentId: 'b2b-sales-agent',
      channel: 'internal',
      dataSource: registry.get('orders'),
      operation: DATA_OPERATIONS.READ,
      userId: 'operator',
    });
    expect(denied.allowed).toBe(false);
  });

  test('writes require approval by default', () => {
    const registry = new DataSourceRegistry({ config: { dataMode: 'mock' } });
    const policy = new DataAccessPolicy({ dryRun: true, requireApproval: true });
    const decision = policy.evaluate({
      agentId: 'quotes-orders-agent',
      channel: 'internal',
      dataSource: registry.get('orders'),
      operation: DATA_OPERATIONS.WRITE,
      userId: 'operator',
    });
    expect(decision.requiresApproval).toBe(true);
    expect(decision.decision).toBe('approval_required');
  });

  test('PII masking protects emails, phones and secrets', () => {
    expect(maskEmail('jose@example.com')).toBe('jo***@example.com');
    expect(maskPhone('+529999991234')).toBe('+52******1234');
    expect(maskPii({ email: 'jose@example.com', token: 'secret' })).toEqual({
      email: 'jo***@example.com',
      token: '[REDACTED]',
    });
  });

  test('DataNormalizer converts external data to canonical shapes', () => {
    const normalizer = new DataNormalizer();
    expect(normalizer.normalizeLead({ id: '1', businessName: 'Cafe', productsOfInterest: ['Tajin'] })).toMatchObject({
      id: '1',
      companyName: 'Cafe',
      interestedProducts: ['Tajin'],
    });
    expect(normalizer.normalizeOrder({ orderNumber: 'O-1', payment_status: 'pending' }).orderNumber).toBe('O-1');
  });

  test('MockDataAdapter returns realistic fixtures', () => {
    const adapter = new MockDataAdapter();
    expect(adapter.listLeads().length).toBeGreaterThan(0);
    expect(adapter.listQuotes().some((quote) => quote.status === 'follow_up_needed')).toBe(true);
    expect(adapter.listOrders().some((order) => order.paymentMethod === 'bank_transfer')).toBe(true);
  });
});
