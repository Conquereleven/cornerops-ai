const { GitHubClient } = require('../../../src/integrations/github/GitHubClient');
const { MockDataAdapter } = require('../../../src/integrations/database/adapters/MockDataAdapter');

const realReadConfig = {
  enabled: true,
  readOnly: true,
  dryRun: true,
  realSourceOnboardingEnabled: true,
  firstRealSource: 'github',
  firstRealSourceMode: 'read_only',
  token: 'test-token',
  owner: 'Conquereleven',
  repo: 'cornerops-ai',
};

describe('GitHub first real source read-only', () => {
  test('allows audited reads with mocked GitHub responses', async () => {
    const auditLogService = { record: jest.fn().mockResolvedValue({ id: 'audit-1' }) };
    const fetchImpl = jest.fn().mockResolvedValue(new Response(JSON.stringify([
      { number: 12, title: 'Read-only issue', state: 'open' },
    ]), { status: 200, headers: { 'content-type': 'application/json' } }));
    const client = new GitHubClient({
      adapter: new MockDataAdapter(),
      auditLogService,
      config: realReadConfig,
      fetchImpl,
    });
    const issues = await client.listIssues({ state: 'open' }, { requestId: 'github-read-1' });
    expect(issues).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('/repos/Conquereleven/cornerops-ai/issues'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(auditLogService.record).toHaveBeenCalledWith(expect.objectContaining({
      dataSource: 'github', operation: 'listIssues', policyDecision: 'allowed',
    }));
  });

  test('blocks writes and workflow triggers in read-only mode', async () => {
    const client = new GitHubClient({ adapter: new MockDataAdapter(), config: realReadConfig });
    await expect(client.createIssue({ title: 'Never create' })).resolves.toMatchObject({ status: 'denied' });
    await expect(client.updateIssue()).resolves.toMatchObject({ status: 'denied' });
    await expect(client.mergePullRequest()).resolves.toMatchObject({ status: 'denied' });
    await expect(client.triggerWorkflow()).resolves.toMatchObject({ status: 'denied' });
  });

  test('missing token degrades to fixtures without a network call', async () => {
    const fetchImpl = jest.fn();
    const client = new GitHubClient({
      adapter: new MockDataAdapter(),
      config: { ...realReadConfig, token: '' },
      fetchImpl,
    });
    const issues = await client.listIssues({ state: 'open' });
    expect(issues.length).toBeGreaterThan(0);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(client.getStatus()).toMatchObject({ connected: false, mode: 'mock' });
  });

  test('handles rate limits and 401/403/404 responses', async () => {
    const rateLimited = new GitHubClient({
      adapter: new MockDataAdapter(),
      config: realReadConfig,
      fetchImpl: jest.fn().mockResolvedValue(new Response('{}', {
        status: 403,
        headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '123' },
      })),
    });
    await expect(rateLimited.listIssues()).rejects.toMatchObject({ code: 'GITHUB_RATE_LIMIT' });
    for (const status of [401, 403, 404]) {
      const client = new GitHubClient({
        adapter: new MockDataAdapter(),
        config: realReadConfig,
        fetchImpl: jest.fn().mockResolvedValue(new Response('{}', { status })),
      });
      await expect(client.listIssues()).rejects.toMatchObject({ code: `GITHUB_${status}` });
    }
  });
});
