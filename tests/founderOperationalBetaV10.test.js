const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const request = require('supertest');
const { FounderSetupValidator } = require('../src/core/setup/FounderSetupValidator');
const { FounderFirstRunService } = require('../src/core/setup/FounderFirstRunService');
const { LocalStateBackupService } = require('../src/core/persistence/LocalStateBackupService');
const { ControlTowerV10ReportService } = require('../src/core/control-tower/ControlTowerV10ReportService');

const repoRoot = path.resolve(__dirname, '..');
const ORIGINAL_ENV = { ...process.env };

const makeTempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'cornerops-v10-'));

const safeConfig = (overrides = {}) => ({
  bindHost: '127.0.0.1',
  corneropsWebConsoleEnabled: true,
  corneropsWebConsoleRequireAuth: true,
  corneropsWebConsoleAuthToken: 'local-test-token-redacted',
  corneropsWebConsoleLocalOnly: true,
  corneropsWebConsoleReadOnly: true,
  corneropsWebConsoleDryRun: true,
  corneropsOperatorReadOnly: true,
  corneropsOperatorDryRun: true,
  corneropsRequireApprovalForWrites: true,
  corneropsTelegramRealMode: false,
  corneropsTelegramDryRun: true,
  telegramOperatorDryRun: true,
  openclawEnabled: false,
  openclawDryRun: true,
  githubEnabled: false,
  githubReadOnly: true,
  githubDryRun: true,
  githubAllowIssueCreation: false,
  corneropsActionGithubIssueCreateEnabled: false,
  corneropsActionGithubIssueCreateDryRun: true,
  corneropsPersistenceRoot: './.cornerops/state',
  ...overrides,
});

const prepareDeps = (root) => {
  fs.mkdirSync(path.join(root, 'node_modules/jest'), { recursive: true });
  fs.mkdirSync(path.join(root, 'frontend/node_modules/vite'), { recursive: true });
  fs.writeFileSync(path.join(root, '.env.founder.local.example'), 'CORNEROPS_BIND_HOST=127.0.0.1\n');
};

describe('Founder Operational Beta v1.0', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  test('setup validator detects missing env template without printing secrets', () => {
    const root = makeTempRoot();
    fs.mkdirSync(path.join(root, 'node_modules/jest'), { recursive: true });
    fs.mkdirSync(path.join(root, 'frontend/node_modules/vite'), { recursive: true });
    const report = new FounderSetupValidator({ config: safeConfig(), cwd: root }).run();
    expect(report.status).toBe('blocked');
    expect(JSON.stringify(report)).not.toContain('local-test-token-redacted');
    expect(report.checks.find((check) => check.id === 'env-file').status).toBe('blocked');
  });

  test('setup validator accepts safe defaults and rejects unsafe settings', () => {
    const root = makeTempRoot();
    prepareDeps(root);
    const safe = new FounderSetupValidator({ config: safeConfig(), cwd: root }).run();
    expect(safe.counts.blocked).toBe(0);
    const unsafe = new FounderSetupValidator({ config: safeConfig({ bindHost: '0.0.0.0', corneropsWebConsoleAuthToken: '' }), cwd: root }).run();
    expect(unsafe.status).toBe('blocked');
    expect(unsafe.checks.some((check) => check.id === 'bind-host' && check.status === 'blocked')).toBe(true);
    expect(unsafe.checks.some((check) => check.id === 'web-console-auth' && check.status === 'blocked')).toBe(true);
  });

  test('backup and export summary are local, sanitized and production-free', () => {
    const root = makeTempRoot();
    const stateDir = path.join(root, '.cornerops/state');
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(path.join(stateDir, 'audit-log.json'), JSON.stringify({
      version: 1,
      records: [{ id: 'audit-1', eventType: 'test', token: 'secret-token', message: 'email founder@example.com' }],
    }));
    const service = new LocalStateBackupService({ cwd: root, now: () => new Date('2026-06-27T00:00:00.000Z') });
    const backup = service.createBackup();
    const summary = service.exportSummary();
    const backupBody = fs.readFileSync(path.join(root, backup.path), 'utf8');
    expect(backup.path).toContain('.cornerops/backups/');
    expect(backupBody).not.toContain('secret-token');
    expect(backupBody).not.toContain('founder@example.com');
    expect(summary.productionDbIncluded).toBe(false);
    expect(summary.rawTokensIncluded).toBe(false);
  });

  test('founder daily workflow runs without credentials and labels safe modes', async () => {
    const setupValidator = { run: () => ({ status: 'ok', counts: { ok: 10, warning: 0, blocked: 0 } }) };
    const service = new FounderFirstRunService({
      actions: { controlledActionExecutor: { status: () => ({ enabled: true, dryRun: true, realExecutionAllowed: false, actions: [{ id: 'github.issue.create' }], idempotency: { healthy: true } }) } },
      backupService: { getLatestBackupSummary: () => ({ exists: false, latestAt: null, warnings: [] }) },
      controlTowerReportService: { getReport: async () => ({
        status: 'degraded',
        mode: 'mock',
        founderBetaReadiness: { ready: true },
        businessData: { mode: 'mock' },
        firstRealSource: { mode: 'mock' },
        openclaw: { mode: 'disabled' },
        approvals: { pending: 0 },
        audit: { eventsLast24h: 0, deniedLast24h: 0 },
        safety: { warnings: [], externalSendsBlocked: true, writesBlocked: true },
      }) },
      operatorCommandRouter: { handle: async (input) => ({ requestId: input.requestId, status: 'dry_run', sourceMode: 'mock' }) },
      setupValidator,
    });
    const result = await service.runDaily();
    expect(result.labels).toEqual(expect.arrayContaining(['mock', 'read-only', 'dry-run', 'disabled', 'local_internal']));
    expect(result.security.externalSendsBlocked).toBe(true);
    expect(result.security.writesBlocked).toBe(true);
  });

  test('Control Tower v1.0 exposes founder readiness and disabled real execution', async () => {
    const report = await new ControlTowerV10ReportService({
      backupService: { getLatestBackupSummary: () => ({ exists: false, latestAt: null, warnings: ['No backup yet.'] }) },
      setupValidator: { run: () => ({ status: 'ok', counts: { ok: 10, warning: 0, blocked: 0 }, checks: [{ id: 'env-file', label: 'env', status: 'ok' }, { id: 'persistence-root', label: 'persistence', status: 'ok' }] }) },
      baseService: { getReport: async () => ({
        version: 'v0.9',
        generatedAt: '2026-06-27T00:00:00.000Z',
        safety: { warnings: [], externalSendsBlocked: true, writesBlocked: true },
        webConsole: { authConfigured: true, localOnly: true },
        controlledActions: { dryRun: true, githubIssueCreationEnabled: false },
        operatorChannel: { realMode: false },
      }) },
    }).getReport();
    expect(report.version).toBe('v1.0');
    expect(report.founderBetaReadiness.setupStatus).toBe('ok');
    expect(report.founderBetaReadiness.githubIssueRealCreationStatus).toBe('disabled');
    expect(report.founderBetaReadiness.externalSendsStatus).toBe('blocked');
  });

  test('visual acceptance docs and UI include required founder sections', () => {
    const doc = fs.readFileSync(path.join(repoRoot, 'docs/acceptance/visual-acceptance-v1.0.md'), 'utf8');
    const ui = fs.readFileSync(path.join(repoRoot, 'frontend/src/routes/ControlTower.tsx'), 'utf8');
    expect(doc).toContain('Founder Beta Readiness');
    expect(doc).toContain('Approval Center');
    expect(doc).toContain('Operator Ask');
    expect(ui).toContain('Founder Beta Readiness');
  });

  test('Control Tower v1.0 API is local-console protected and sanitized', async () => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'test',
      CORNEROPS_WEB_CONSOLE_ENABLED: 'true',
      CORNEROPS_WEB_CONSOLE_REQUIRE_AUTH: 'true',
      CORNEROPS_WEB_CONSOLE_AUTH_TOKEN: 'v10-local-token',
      CORNEROPS_WEB_CONSOLE_LOCAL_ONLY: 'true',
      CORNEROPS_WEB_CONSOLE_READ_ONLY: 'true',
      CORNEROPS_WEB_CONSOLE_DRY_RUN: 'true',
      CORNEROPS_CONTROLLED_ACTIONS_ENABLED: 'true',
      CORNEROPS_CONTROLLED_ACTIONS_DRY_RUN: 'true',
      GITHUB_ALLOW_ISSUE_CREATION: 'false',
      GITHUB_READ_ONLY: 'true',
      GITHUB_DRY_RUN: 'true',
    };
    const app = require('../src/app');
    await request(app).get('/api/control-tower/v1.0/status').expect(401);
    const response = await request(app).get('/api/control-tower/v1.0/status')
      .set('x-cornerops-console-token', 'v10-local-token').expect(200);
    expect(response.body).toMatchObject({
      version: 'v1.0',
      founderBetaReadiness: {
        githubIssueRealCreationStatus: 'disabled',
        externalSendsStatus: 'blocked',
        writesStatus: 'blocked',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('v10-local-token');
  });

  test('visual/local acceptance script verifies v1.0 dashboard assets', () => {
    const output = execFileSync(process.execPath, ['scripts/visual-local-acceptance-v1.js'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    const parsed = JSON.parse(output);
    expect(parsed.status).toBe('ok');
    expect(parsed.checks.v10EndpointUsed).toBe(true);
    expect(parsed.checks.secretsFound).toBe(0);
  });

  test('demo:v1.0 runs without credentials', () => {
    const output = execFileSync(process.execPath, ['scripts/demo-v1.0.js'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_TOKEN: '', OPENAI_API_KEY: '' },
    });
    const parsed = JSON.parse(output.slice(output.lastIndexOf('\n{') + 1));
    expect(parsed.version).toBe('v1.0');
    expect(parsed.safety.externalSends).toBe('blocked');
    expect(parsed.exportSummary.productionDbIncluded).toBe(false);
  });
});
