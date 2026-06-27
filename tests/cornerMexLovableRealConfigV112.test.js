const { execFileSync } = require('child_process');
const path = require('path');
const { ControlTowerV11ReportService } = require('../src/core/control-tower/ControlTowerV11ReportService');
const { CornerMexDataContractRegistry } = require('../src/core/data-contracts/cornermex');
const { FounderFirstRunService } = require('../src/core/setup/FounderFirstRunService');
const {
  CornerMexLovableConfigIntakeService,
  CornerMexLovableConfigValidator,
  LovableCornerMexConnector,
  LovableProjectDiscoveryService,
  LovableRepoDiscoveryService,
  LovableSupabaseDiscoveryService,
} = require('../src/integrations/lovable');

const root = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

const makeStack = (config = {}) => {
  const repoDiscoveryService = new LovableRepoDiscoveryService({ config });
  const supabaseDiscoveryService = new LovableSupabaseDiscoveryService({ config });
  const discoveryService = new LovableProjectDiscoveryService({ config, repoDiscoveryService, supabaseDiscoveryService });
  const contractRegistry = new CornerMexDataContractRegistry();
  const connector = new LovableCornerMexConnector({
    auditLogService: { record: async (event) => ({ id: 'audit-test', ...event }) },
    config,
    contractRegistry,
    discoveryService,
  });
  const validator = new CornerMexLovableConfigValidator({ config });
  const intake = new CornerMexLovableConfigIntakeService({ config, discoveryService, validator });
  return { connector, contractRegistry, discoveryService, intake, validator };
};

const parseLastJson = (output) => {
  const text = String(output);
  const start = text.lastIndexOf('\n{');
  return JSON.parse(text.slice(start >= 0 ? start + 1 : text.indexOf('{')));
};

describe('CornerMex Lovable Real Config Onboarding v1.1.2', () => {
  test('config validator reports missing_config without secrets', () => {
    const result = makeStack().validator.validate();
    expect(result.status).toBe('missing_config');
    expect(result.sourceModeCandidate).toBe('missing_config');
    expect(result.missing).toEqual(expect.arrayContaining(['CORNERMEX_LOVABLE_GITHUB_REPO', 'CORNERMEX_SUPABASE_URL']));
    expect(result.secrets.supabaseAnonKeyPrinted).toBe(false);
  });

  test('repo config can reach repo_discovered candidate', () => {
    const result = makeStack({
      cornermexLovableProjectName: 'CornerMex',
      cornermexLovableGithubRepo: 'Conquereleven/Cornermex-Marketplace',
      cornermexLovableReadOnly: true,
      cornermexLovableDryRun: true,
      cornermexSupabaseReadOnly: true,
      cornermexSupabaseAllowWrites: false,
    }).validator.validate();
    expect(result.canReachRepoDiscovered).toBe(true);
    expect(result.sourceModeCandidate).toBe('repo_discovered');
  });

  test('Supabase anon/read-only config can reach real_read_only candidate', () => {
    const result = makeStack({
      cornermexLovableProjectName: 'CornerMex',
      cornermexLovableGithubRepo: 'Conquereleven/Cornermex-Marketplace',
      cornermexSupabaseEnabled: true,
      cornermexSupabaseUrl: 'https://example.supabase.co',
      cornermexSupabaseAnonKey: 'anon-test-key',
      cornermexSupabaseReadOnly: true,
      cornermexSupabaseAllowWrites: false,
    }).validator.validate();
    expect(result.canReachRealReadOnly).toBe(true);
    expect(result.sourceModeCandidate).toBe('real_read_only');
  });

  test('unsafe write flags and service-role-like keys block readiness', () => {
    const result = makeStack({
      cornermexSupabaseEnabled: true,
      cornermexSupabaseUrl: 'https://example.supabase.co',
      cornermexSupabaseAnonKey: 'fake_service_role_marker',
      cornermexSupabaseReadOnly: false,
      cornermexSupabaseAllowWrites: true,
    }).validator.validate();
    expect(result.status).toBe('blocked');
    expect(result.canReachRealReadOnly).toBe(false);
    expect(result.unsafe.join(' ')).toMatch(/service-role|ALLOW_WRITES|READ_ONLY/);
  });

  test('repo discovery documents env references and write-risk paths only', async () => {
    const { discoveryService } = makeStack({ cornermexLovableGithubRepo: 'Conquereleven/Cornermex-Marketplace' });
    const result = await discoveryService.discover();
    expect(result.repo.sourceMode).toBe('repo_discovered');
    expect(result.repo.supabaseReferences).toContain('createClient');
    expect(result.repo.writeRiskPaths.map((item) => item.pattern)).toEqual(expect.arrayContaining(['.insert(', '.update(', '.delete(']));
    expect(result.repo.modified).toBe(false);
    expect(result.repo.issuesCreated).toBe(false);
  });

  test('Supabase readiness degrades safely and reports read-only controls', async () => {
    const missing = await makeStack().discoveryService.discover();
    expect(missing.supabase.configured).toBe(false);
    expect(missing.supabase.writesBlocked).toBe(true);
    expect(missing.supabase.schemaDiscoveryEnabled).toBe(false);

    const configured = await makeStack({
      cornermexSupabaseEnabled: true,
      cornermexSupabaseUrl: 'https://example.supabase.co',
      cornermexSupabaseAnonKey: 'anon-test-key',
      cornermexSupabaseReadOnly: true,
      cornermexSupabaseAllowWrites: false,
      cornermexSupabaseSchemaDiscoveryEnabled: true,
      cornermexSupabaseMaxRows: 50,
    }).discoveryService.discover();
    expect(configured.supabase.sourceMode).toBe('real_read_only');
    expect(configured.supabase.tablesDiscovered).toContain('products');
    expect(configured.supabase.maxRows).toBe(50);
    expect(configured.supabase.mappingConfidence).toBe('high');
  });

  test('data contracts confidence follows discovery level', () => {
    const registry = new CornerMexDataContractRegistry();
    expect(registry.getSummary({ sourceMode: 'mock' }).confidence).toEqual({ low: 6 });
    expect(registry.getSummary({ sourceMode: 'repo_discovered' }).confidence).toEqual({ medium: 6 });
    expect(registry.getSummary({ sourceMode: 'real_read_only' }).confidence).toEqual({ high: 6 });
    expect(registry.getSummary({ sourceMode: 'missing_config' }).contracts[0].missingFields.length).toBeGreaterThan(0);
  });

  test('Control Tower exposes v1.1.2 config intake and write-risk paths', async () => {
    const stack = makeStack();
    const service = new ControlTowerV11ReportService({
      baseService: {
        getReport: async () => ({
          status: 'healthy',
          safety: { warnings: [], externalSendsBlocked: true, whatsappDisabled: true, nativeToolsDisabled: true, clawhubExecutionDisabled: true },
          github: {},
          businessData: {},
          openclaw: { enabled: false, mode: 'disabled' },
        }),
      },
      businessDataReadinessService: { check: async () => ({ mode: 'mock', warnings: [], writesBlocked: true }) },
      cornerMexConfigIntakeService: stack.intake,
      cornerMexConnector: stack.connector,
      githubReadinessService: { check: async () => ({ mode: 'mock', connected: false, warnings: [], writesBlocked: true }) },
      config: { corneropsDryRun: true, corneropsControlledActionsDryRun: true },
    });
    const report = await service.getReport();
    expect(report.cornerMexLovableConnector.version).toBe('v1.1.2');
    expect(report.cornerMexLovableConnector.configIntakeStatus).toBe('missing_config');
    expect(report.cornerMexLovableConnector.missingFounderConfig).toContain('CORNERMEX_LOVABLE_GITHUB_REPO');
    expect(report.cornerMexLovableConnector.discoveredWriteRiskPaths.length).toBeGreaterThan(0);
  });

  test('founder daily reports connector mode and next action without implying real data', async () => {
    const stack = makeStack();
    const service = new FounderFirstRunService({
      actions: { controlledActionExecutor: { status: () => ({ enabled: false, dryRun: true, realExecutionAllowed: false, actions: [], idempotency: { healthy: true } }) } },
      backupService: { getLatestBackupSummary: () => ({ exists: false }) },
      controlTowerReportService: {
        getReport: async () => ({
          status: 'degraded',
          mode: 'mock',
          founderBetaReadiness: { ready: true },
          safety: { warnings: [], externalSendsBlocked: true, writesBlocked: true },
          cornerMexLovableConnector: {
            sourceMode: 'mock',
            projectConfigured: false,
            githubRepoConfigured: false,
            supabaseConfigured: false,
            configIntakeStatus: 'missing_config',
            configCompleteness: { repo: false, supabase: false },
            exactNextRecommendedAction: 'Set CORNERMEX_LOVABLE_GITHUB_REPO to reach repo_discovered mode.',
          },
          businessData: { mode: 'mock' },
          github: { mode: 'mock' },
          firstRealSource: { mode: 'mock' },
          realSourceExpansion: { sourceModeSummary: 'mock' },
          openclaw: { mode: 'dry_run' },
          approvals: {},
          audit: {},
        }),
      },
      operatorCommandRouter: { handle: async () => ({ status: 'dry_run', sourceMode: 'mock', responseText: 'mock only' }) },
      setupValidator: { run: () => ({ status: 'warning', counts: { ok: 1, warning: 1, blocked: 0 } }) },
    });
    const result = await service.runDaily();
    expect(result.sources.cornerMexLovableMode).toBe('mock');
    expect(result.sources.cornerMexConfigIntakeStatus).toBe('missing_config');
    expect(result.sources.cornerMexNextAction).toMatch(/CORNERMEX_LOVABLE_GITHUB_REPO/);
  });

  test('v1.1.2 demos run without credentials', () => {
    const env = {
      ...process.env,
      CORNERMEX_LOVABLE_GITHUB_REPO: '',
      CORNERMEX_SUPABASE_ENABLED: 'false',
      CORNERMEX_SUPABASE_URL: '',
      CORNERMEX_SUPABASE_ANON_KEY: '',
    };
    const check = parseLastJson(execFileSync(nodeBin, ['scripts/cornermex-lovable-config-check.js'], { cwd: root, env, encoding: 'utf8' }));
    const demo = parseLastJson(execFileSync(nodeBin, ['scripts/demo-cornermex-lovable-real-config.js'], { cwd: root, env, encoding: 'utf8' }));
    const combined = parseLastJson(execFileSync(nodeBin, ['scripts/demo-v1.1.2.js'], { cwd: root, env, encoding: 'utf8' }));
    expect(check.status).toBe('missing_config');
    expect(check.secrets.supabaseAnonKeyPrinted).toBe(false);
    expect(demo.safety.supabaseWrites).toBe('blocked');
    expect(combined.finalSafetySummary.telegramV12).toBe('not_started');
  });
});
