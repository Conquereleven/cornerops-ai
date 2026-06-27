const { execFileSync } = require('child_process');
const path = require('path');
const { BusinessDataReadOnlyReadinessService } = require('../src/core/real-source/BusinessDataReadOnlyReadinessService');
const { GitHubReadOnlyReadinessService } = require('../src/core/real-source/GitHubReadOnlyReadinessService');
const { combineSourceModes } = require('../src/core/real-source/sourceMode');
const { ControlTowerV11ReportService } = require('../src/core/control-tower/ControlTowerV11ReportService');

const nodeBin = process.execPath;
const root = path.resolve(__dirname, '..');

const parseLastJson = (output) => {
  const text = String(output);
  const start = text.lastIndexOf('\n{');
  return JSON.parse(text.slice(start >= 0 ? start + 1 : text.indexOf('{')));
};

describe('CornerOps Real Source Expansion v1.1', () => {
  test('GitHub readiness degrades safely without credentials and never exposes token', async () => {
    const service = new GitHubReadOnlyReadinessService({
      client: {
        getStatus: () => ({ warnings: ['mock fallback'] }),
        canUseRealReads: () => false,
      },
      config: {
        githubEnabled: false,
        githubReadOnly: true,
        githubDryRun: true,
        githubAllowIssueCreation: false,
        githubAllowPrWrite: false,
        githubAllowWorkflowTrigger: false,
        corneropsGithubAuditReads: true,
      },
    });
    const result = await service.check();
    expect(result.mode).toBe('mock');
    expect(result.tokenExposed).toBe(false);
    expect(result.writesBlocked).toBe(true);
    expect(result.readOnlyVerified).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/secret-token/);
  });

  test('GitHub write flags fail closed', async () => {
    const service = new GitHubReadOnlyReadinessService({
      client: { getStatus: () => ({}), canUseRealReads: () => false },
      config: {
        githubEnabled: true,
        githubToken: 'secret-token',
        githubOwner: 'Conquereleven',
        githubRepo: 'cornerops-ai',
        githubReadOnly: true,
        githubAllowIssueCreation: true,
        githubAllowPrWrite: false,
        githubAllowWorkflowTrigger: false,
        corneropsGithubAuditReads: true,
      },
    });
    const result = await service.check({ testReads: false });
    expect(result.writesBlocked).toBe(false);
    expect(result.warnings.join(' ')).toMatch(/CRITICAL/);
    expect(JSON.stringify(result)).not.toContain('secret-token');
  });

  test('GitHub real read-only check runs reads and audits through client when configured', async () => {
    const calls = [];
    const service = new GitHubReadOnlyReadinessService({
      client: {
        getStatus: () => ({ warnings: [] }),
        canUseRealReads: () => true,
        getRepositoryMetadata: async (context) => { calls.push(['repo', context.requestId]); return { name: 'cornerops-ai' }; },
        listIssues: async () => [{ number: 1 }],
        listPullRequests: async () => [{ number: 2 }],
        listWorkflowRuns: async () => [{ id: 3 }],
      },
      config: {
        githubEnabled: true,
        githubToken: 'secret-token',
        githubOwner: 'Conquereleven',
        githubRepo: 'cornerops-ai',
        githubReadOnly: true,
        githubAllowIssueCreation: false,
        githubAllowPrWrite: false,
        githubAllowWorkflowTrigger: false,
        corneropsGithubAuditReads: true,
        corneropsGithubRealReadOnlyEnabled: true,
      },
    });
    const result = await service.check({ requestId: 'read-test' });
    expect(result.mode).toBe('real_read_only');
    expect(result.sampleCounts).toEqual({ repository: 1, issues: 1, pullRequests: 1, workflowRuns: 1 });
    expect(calls[0]).toEqual(['repo', 'read-test']);
  });

  test('Business DB readiness keeps writes blocked, schema discovery off, row limits and PII masking on', async () => {
    const adapter = {
      config: { credentialsAvailable: false, maxRows: 100, queryTimeoutMs: 10000 },
      health: async () => ({
        mode: 'mock',
        readOnlyVerified: true,
        configuredProvider: 'mock',
        provider: 'mock',
        warnings: ['mock mode'],
      }),
      select: async ({ table, limit }) => ({
        rows: [{ id: `${table}-1`, customerName: 'A***' }].slice(0, limit),
      }),
    };
    const service = new BusinessDataReadOnlyReadinessService({
      adapter,
      contractRegistry: { listMappings: () => [] },
      config: {
        corneropsBusinessDataEnabled: false,
        corneropsBusinessDataDryRun: true,
        corneropsDbReadOnly: true,
        corneropsDbAllowWrites: false,
        corneropsDbSchemaDiscoveryEnabled: false,
        corneropsDbMaxRows: 100,
        corneropsDbPiiMasking: true,
        corneropsDbAuditReads: true,
      },
    });
    const result = await service.check();
    expect(result.mode).toBe('mock');
    expect(result.writesBlocked).toBe(true);
    expect(result.schemaDiscoveryEnabled).toBe(false);
    expect(result.rowLimit).toBe(100);
    expect(result.piiMasking).toBe(true);
    expect(result.sampleCounts).toEqual({ leads: 1, quotes: 1, orders: 1 });
  });

  test('source mode labels normalize mock, real_read_only, mixed and disabled', () => {
    expect(combineSourceModes([])).toBe('disabled');
    expect(combineSourceModes(['mock'])).toBe('mock');
    expect(combineSourceModes(['read_only'])).toBe('real_read_only');
    expect(combineSourceModes(['real_read_only', 'mock'])).toBe('mixed');
  });

  test('Control Tower v1.1 exposes source readiness and blocked write flags', async () => {
    const service = new ControlTowerV11ReportService({
      baseService: {
        getReport: async () => ({
          status: 'healthy',
          safety: {
            warnings: [],
            externalSendsBlocked: true,
            whatsappDisabled: true,
            nativeToolsDisabled: true,
            clawhubExecutionDisabled: true,
          },
          github: {},
          businessData: {},
          openclaw: { enabled: false, mode: 'disabled' },
        }),
      },
      githubReadinessService: {
        check: async () => ({
          mode: 'mock',
          connected: false,
          warnings: [],
          writesBlocked: true,
        }),
      },
      businessDataReadinessService: {
        check: async () => ({
          mode: 'mock',
          warnings: [],
          writesBlocked: true,
        }),
      },
      config: {
        corneropsDryRun: true,
        githubAllowIssueCreation: false,
        githubAllowPrWrite: false,
        githubAllowWorkflowTrigger: false,
        corneropsDbAllowWrites: false,
        corneropsControlledActionsDryRun: true,
      },
    });
    const report = await service.getReport();
    expect(report.version).toBe('v1.1');
    expect(report.realSourceExpansion.selectedSource).toBe('mock');
    expect(report.realSourceExpansion.blockedWriteFlags.githubIssueCreation).toBe(true);
    expect(report.realSourceExpansion.blockedWriteFlags.businessDbWrites).toBe(true);
  });

  test('v1.1 demos run without credentials', () => {
    const env = {
      ...process.env,
      GITHUB_TOKEN: '',
      GITHUB_ENABLED: 'false',
      CORNEROPS_GITHUB_REAL_READ_ONLY_ENABLED: 'false',
      CORNEROPS_BUSINESS_DATA_ENABLED: 'false',
    };
    const github = execFileSync(nodeBin, ['scripts/demo-github-read-only.js'], { cwd: root, env, encoding: 'utf8' });
    const business = execFileSync(nodeBin, ['scripts/demo-business-data-read-only.js'], { cwd: root, env, encoding: 'utf8' });
    const realSources = execFileSync(nodeBin, ['scripts/demo-real-sources.js'], { cwd: root, env, encoding: 'utf8' });
    expect(parseLastJson(github).writes.createIssue).toBe('blocked');
    expect(parseLastJson(business).writes.migrations).toBe('blocked');
    expect(parseLastJson(realSources).selectedSource).toBe('mock');
    expect(github).not.toMatch(/ghp_|github_pat_|secret-token/);
  });
});
