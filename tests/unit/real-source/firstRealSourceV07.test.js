const { FirstRealSourceSelector } = require('../../../src/core/real-source/FirstRealSourceSelector');
const { FirstRealSourceReadinessService } = require('../../../src/core/real-source/FirstRealSourceReadinessService');
const { createAgentTools } = require('../../../src/core/agents/tools');
const { DataSourceRegistry } = require('../../../src/core/data/DataSourceRegistry');
const { GitHubClient } = require('../../../src/integrations/github/GitHubClient');

const ready = (overrides = {}) => ({
  ready: true,
  readOnlyVerified: true,
  credentialsPresent: true,
  warnings: [],
  ...overrides,
});

describe('FirstRealSourceSelector v0.7', () => {
  test('selects business DB first when auto and safely ready', () => {
    const selector = new FirstRealSourceSelector({
      config: { enabled: true, source: 'auto', mode: 'read_only', preferredOrder: ['business_db', 'github'] },
    });
    expect(selector.select({ businessDb: ready(), github: ready() })).toMatchObject({
      selectedSource: 'business_db', mode: 'read_only', readOnlyVerified: true,
    });
  });

  test('selects GitHub when business DB is unavailable', () => {
    const selector = new FirstRealSourceSelector({
      config: { enabled: true, source: 'auto', mode: 'read_only', preferredOrder: ['business_db', 'github'] },
    });
    expect(selector.select({ businessDb: ready({ ready: false }), github: ready() })).toMatchObject({
      selectedSource: 'github', mode: 'read_only',
    });
  });

  test('falls back to mock with warnings when credentials are absent', () => {
    const selector = new FirstRealSourceSelector({
      config: { enabled: true, source: 'auto', mode: 'read_only', preferredOrder: ['business_db', 'github'] },
    });
    const result = selector.select({
      businessDb: ready({ ready: false, credentialsPresent: false }),
      github: ready({ ready: false, credentialsPresent: false }),
    });
    expect(result).toMatchObject({
      selectedSource: 'mock',
      mode: 'mock',
      ready: false,
      readOnlyVerified: false,
      credentialsPresent: false,
    });
    expect(result.warnings[0]).toContain('mock fallback');
  });

  test('never selects an unsafe non-read-only source', () => {
    const selector = new FirstRealSourceSelector({
      config: { enabled: true, source: 'business_db', mode: 'write_enabled', preferredOrder: [] },
    });
    expect(selector.select({ businessDb: ready() })).toMatchObject({ selectedSource: 'mock' });
  });

  test('readiness service reports DB and GitHub evidence', async () => {
    const selector = new FirstRealSourceSelector({
      config: { enabled: true, source: 'auto', mode: 'read_only', preferredOrder: ['business_db', 'github'] },
    });
    const service = new FirstRealSourceReadinessService({
      databaseAdapter: {
        config: { credentialsAvailable: false },
        health: async () => ({ mode: 'mock', readOnlyVerified: true, warnings: ['missing'] }),
      },
      githubClient: {
        config: { token: 'test', owner: 'owner', repo: 'repo' },
        getStatus: () => ({ connected: true, readOnly: true, repo: 'owner/repo', warnings: [] }),
      },
      selector,
    });
    await expect(service.getReport()).resolves.toMatchObject({
      selectedSource: 'github',
      businessDb: { credentialsPresent: false, mode: 'mock' },
      github: { credentialsPresent: true, mode: 'read_only' },
    });
  });

  test('labels verified GitHub reads as real_read_only even while actions stay dry-run', async () => {
    const tools = createAgentTools({
      dataAccessPolicy: { evaluate: () => ({ allowed: true, dryRun: true }) },
      dataSourceRegistry: { get: () => ({ id: 'github', mode: 'read_only' }) },
      githubIssueService: { listIssues: async () => [{ number: 1 }] },
    });
    await expect(tools.readGitHubIssuesTool({ requestId: 'real-github' }, 'dev-codex-github-agent'))
      .resolves.toMatchObject({ source: 'real_read_only', sourceMode: 'real_read_only' });
  });

  test('does not activate GitHub real reads when business_db is the selected first source', () => {
    const client = new GitHubClient({
      config: {
        enabled: true,
        firstRealSourceEnabled: true,
        firstRealSource: 'business_db',
        firstRealSourceMode: 'read_only',
        readOnly: true,
        token: 'test-token',
        owner: 'owner',
        repo: 'repo',
      },
    });
    expect(client.canUseRealReads()).toBe(false);
    const registry = new DataSourceRegistry({
      config: {
        dataMode: 'mock',
        firstRealSourceEnabled: true,
        firstRealSource: 'business_db',
        firstRealSourceMode: 'read_only',
        githubEnabled: true,
        githubReadOnly: true,
        githubCredentialsPresent: true,
      },
    });
    expect(registry.get('github').mode).toBe('mock');
  });
});
