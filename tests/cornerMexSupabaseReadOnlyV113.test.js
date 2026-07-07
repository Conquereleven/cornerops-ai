const { execFileSync } = require('child_process');
const path = require('path');
const { ControlTowerV11ReportService } = require('../src/core/control-tower/ControlTowerV11ReportService');
const { CornerMexDataContractRegistry, CornerMexSchemaEvidenceService } = require('../src/core/data-contracts/cornermex');
const { FounderFirstRunService } = require('../src/core/setup/FounderFirstRunService');
const {
  LovableCornerMexConnector,
  CornerMexSupabaseReadOnlyActivationService,
  CornerMexSupabaseReadOnlyConfigValidator,
  LovableProjectDiscoveryService,
  LovableRepoDiscoveryService,
  LovableSupabaseDiscoveryService,
  LovableSupabaseMigrationDiscoveryService,
  LovableSupabaseSchemaMapper,
} = require('../src/integrations/lovable');
const {
  CornerMexSupabaseReadOnlyClient,
  CornerMexSupabaseReadOnlyConfig,
  CornerMexSupabaseReadOnlyRepository,
} = require('../src/integrations/cornermex');

const root = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

const makeStack = (config = {}) => {
  const mergedConfig = {
    cornermexLovableProjectUrl: 'https://lovable.dev/projects/d9495376-339d-44dd-9c8a-db0f7b451f96',
    cornermexLovableProjectName: 'CornerMex',
    cornermexLovableGithubRepo: 'Conquereleven/corner-mex-uae',
    cornermexSupabaseReadOnly: true,
    cornermexSupabaseAllowWrites: false,
    cornermexSupabaseBlockMutations: true,
    corneropsCornermexConnectorAuditReads: true,
    corneropsCornermexConnectorPiiMasking: true,
    ...config,
  };
  const repoDiscoveryService = new LovableRepoDiscoveryService({ config: mergedConfig });
  const schemaMapper = new LovableSupabaseSchemaMapper();
  const migrationDiscoveryService = new LovableSupabaseMigrationDiscoveryService({
    config: mergedConfig,
    repoDiscoveryService,
    schemaMapper,
  });
  const supabaseDiscoveryService = new LovableSupabaseDiscoveryService({
    config: mergedConfig,
    migrationDiscoveryService,
  });
  const discoveryService = new LovableProjectDiscoveryService({
    config: mergedConfig,
    repoDiscoveryService,
    supabaseDiscoveryService,
  });
  const contractRegistry = new CornerMexDataContractRegistry();
  const connector = new LovableCornerMexConnector({
    auditLogService: { record: async (event) => ({ id: 'audit-v113', ...event }) },
    config: mergedConfig,
    contractRegistry,
    discoveryService,
  });
  const schemaEvidenceService = new CornerMexSchemaEvidenceService({ migrationDiscoveryService });
  return {
    config: mergedConfig,
    connector,
    contractRegistry,
    discoveryService,
    migrationDiscoveryService,
    schemaEvidenceService,
    supabaseDiscoveryService,
  };
};

const parseLastJson = (output) => {
  const text = String(output);
  const start = text.lastIndexOf('\n{');
  return JSON.parse(text.slice(start >= 0 ? start + 1 : text.indexOf('{')));
};

describe('CornerMex Supabase Schema Discovery and Read-Only Onboarding v1.1.3', () => {
  test('migration discovery detects files and never executes migrations', async () => {
    const { migrationDiscoveryService } = makeStack();
    const result = await migrationDiscoveryService.discover();
    expect(result.mode).toBe('schema_discovered');
    expect(result.migrationFileCount).toBeGreaterThan(0);
    expect(result.tables).toEqual(expect.arrayContaining(['products', 'b2b_leads', 'orders']));
    expect(result.migrationsExecuted).toBe(false);
    expect(result.productionDbConnected).toBe(false);
    expect(result.writeRiskSql.join(' ')).toMatch(/admin_update_order_state/);
  });

  test('missing migrations degrade safely', async () => {
    const { migrationDiscoveryService } = makeStack({ cornermexLovableGithubRepo: '' });
    const result = await migrationDiscoveryService.discover();
    expect(result.mode).toBe('mock');
    expect(result.migrationFileCount).toBe(0);
    expect(result.warnings.join(' ')).toMatch(/Missing CORNERMEX_LOVABLE_GITHUB_REPO/);
  });

  test('schema evidence classifies PII and unknowns without inventing live schema', async () => {
    const { schemaEvidenceService } = makeStack();
    const result = await schemaEvidenceService.getEvidence();
    const lead = result.schemaEvidence.find((item) => item.tableName === 'b2b_leads');
    expect(lead.columns.find((column) => column.name === 'email').piiClassification).toBe('pii_candidate');
    expect(lead.columns.some((column) => column.nullable === 'unknown')).toBe(false);
    expect(result.mappedContracts.find((item) => item.contract === 'lead').confidence).toBe('medium');
  });

  test('contract confidence follows mock, schema, live and unsafe modes', async () => {
    const { contractRegistry, schemaEvidenceService } = makeStack();
    const evidence = (await schemaEvidenceService.getEvidence()).schemaEvidence;
    expect(contractRegistry.getSummary({ sourceMode: 'mock' }).confidence).toEqual({ low: 6 });
    expect(contractRegistry.getSummary({ sourceMode: 'schema_discovered', schemaEvidence: evidence }).confidence).toEqual({ medium: 6 });
    expect(contractRegistry.getSummary({ sourceMode: 'real_read_only', schemaEvidence: evidence }).confidence).toEqual({ high: 6 });
    expect(contractRegistry.getSummary({ sourceMode: 'blocked_unsafe_config', schemaEvidence: evidence }).confidence).toEqual({ blocked: 6 });
  });

  test('Supabase discovery reports schema_discovered without live credentials', async () => {
    const { supabaseDiscoveryService } = makeStack();
    const result = await supabaseDiscoveryService.discover();
    expect(result.configured).toBe(false);
    expect(result.sourceMode).toBe('schema_discovered');
    expect(result.tablesDiscovered).toContain('orders');
    expect(result.writesBlocked).toBe(true);
  });

  test('unsafe write flags block readiness', async () => {
    const { connector, supabaseDiscoveryService } = makeStack({ cornermexSupabaseAllowWrites: true });
    expect((await supabaseDiscoveryService.discover()).sourceMode).toBe('blocked_unsafe_config');
    expect((await connector.getConnectorStatus()).sourceMode).toBe('blocked_unsafe_config');
  });

  test('Control Tower shows schema discovery and next founder action', async () => {
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
      cornerMexConfigIntakeService: { check: async () => ({ status: 'missing_config', warnings: [], missing: ['CORNERMEX_SUPABASE_URL'], founderNextSteps: [] }) },
      cornerMexConnector: stack.connector,
      githubReadinessService: { check: async () => ({ mode: 'mock', connected: false, warnings: [], writesBlocked: true }) },
      config: { corneropsDryRun: true, corneropsControlledActionsDryRun: true },
    });
    const report = await service.getReport();
    expect(report.cornerMexLovableConnector.version).toBe('v1.1.3');
    expect(report.cornerMexLovableConnector.schemaDiscovered).toBe(true);
    expect(report.cornerMexLovableConnector.exactNextRecommendedAction).toMatch(/CORNERMEX_SUPABASE_URL/);
  });

  test('founder daily labels repo_discovered with schema status without implying live data', async () => {
    const service = new FounderFirstRunService({
      actions: { controlledActionExecutor: { status: () => ({ enabled: false, dryRun: true, realExecutionAllowed: false, actions: [], idempotency: { healthy: true } }) } },
      backupService: { getLatestBackupSummary: () => ({ exists: false }) },
      controlTowerReportService: {
        getReport: async () => ({
          status: 'healthy',
          mode: 'mock',
          founderBetaReadiness: { ready: true },
          safety: { warnings: [], externalSendsBlocked: true, writesBlocked: true },
          cornerMexLovableConnector: {
            sourceMode: 'repo_discovered',
            projectConfigured: true,
            githubRepoConfigured: true,
            supabaseConfigured: false,
            schemaDiscovery: { status: 'schema_discovered', tables: ['products', 'orders'] },
            contractConfidence: { medium: 6 },
            configIntakeStatus: 'missing_config',
            configCompleteness: { repo: true, supabase: false },
            exactNextRecommendedAction: 'Add CORNERMEX_SUPABASE_URL.',
          },
          businessData: { mode: 'mock' },
          github: { mode: 'mock' },
          firstRealSource: { mode: 'mock' },
          realSourceExpansion: { sourceModeSummary: 'mixed' },
          openclaw: { mode: 'dry_run' },
          approvals: {},
          audit: {},
        }),
      },
      operatorCommandRouter: { handle: async () => ({ status: 'dry_run', sourceMode: 'mock', responseText: 'mock only' }) },
      setupValidator: { run: () => ({ status: 'ok', counts: { ok: 2, warning: 0, blocked: 0 } }) },
    });
    const result = await service.runDaily();
    expect(result.sources.cornerMexLovableMode).toBe('repo_discovered');
    expect(result.sources.cornerMexSupabaseConfigured).toBe(false);
    expect(result.sources.cornerMexSchemaDiscoveryStatus).toBe('schema_discovered');
  });

  test('connector reaches real_read_only with safe mock Supabase config', async () => {
    const auditEvents = [];
    const mockSupabaseClient = {
      from: (table) => ({
        select: () => ({
          limit: async () => ({
            data: table === 'products'
              ? [{ id: 'prod-real-1', name_en: 'Tajin', email: 'should-mask@example.test' }]
              : [],
            error: null,
          }),
        }),
      }),
    };
    const stack = makeStack({
      cornermexSupabaseEnabled: true,
      cornermexSupabaseUrl: 'https://example.supabase.co',
      cornermexSupabaseAnonKey: 'anon-public-test-key',
      cornermexSupabasePiiMasking: true,
      cornermexSupabaseAuditReads: true,
    });
    const validator = new CornerMexSupabaseReadOnlyConfigValidator({ config: stack.config });
    const activation = new CornerMexSupabaseReadOnlyActivationService({
      auditLogService: { record: async (event) => { auditEvents.push(event); return { id: 'audit-real-read', ...event }; } },
      config: stack.config,
      migrationDiscoveryService: stack.migrationDiscoveryService,
      repository: new CornerMexSupabaseReadOnlyRepository({
        auditLogService: { record: async (event) => { auditEvents.push(event); return { id: 'audit-real-read', ...event }; } },
        client: new CornerMexSupabaseReadOnlyClient({ supabaseClient: mockSupabaseClient }),
        configSummary: new CornerMexSupabaseReadOnlyConfig({ config: stack.config }),
      }),
      supabaseClient: mockSupabaseClient,
      validator,
    });
    const connector = new LovableCornerMexConnector({
      auditLogService: { record: async (event) => { auditEvents.push(event); return { id: 'audit-connector', ...event }; } },
      config: stack.config,
      contractRegistry: stack.contractRegistry,
      discoveryService: stack.discoveryService,
      supabaseReadOnlyActivationService: activation,
    });
    const status = await connector.getConnectorStatus({ requestId: 'real-read-test' });
    const products = await connector.listProducts({ limit: 1 }, { requestId: 'real-read-test' });
    expect(status.sourceMode).toBe('real_read_only');
    expect(products.meta.source).toBe('real_read_only');
    expect(products.meta.rowCount).toBe(1);
    expect(products.data[0].email).toBe('masked@example.test');
    expect(auditEvents.some((event) => event.eventType === 'cornermex_supabase_read')).toBe(true);
    expect(typeof connector.createProduct).toBe('undefined');
  });

  test('v1.1.3 scripts run without Supabase credentials and never print secrets', () => {
    const env = {
      ...process.env,
      CORNERMEX_LOVABLE_PROJECT_URL: 'https://lovable.dev/projects/d9495376-339d-44dd-9c8a-db0f7b451f96',
      CORNERMEX_LOVABLE_PROJECT_NAME: 'CornerMex',
      CORNERMEX_LOVABLE_GITHUB_REPO: 'Conquereleven/corner-mex-uae',
      CORNERMEX_SUPABASE_ENABLED: 'false',
      CORNERMEX_SUPABASE_URL: '',
      CORNERMEX_SUPABASE_ANON_KEY: '',
      CORNERMEX_SUPABASE_ALLOW_WRITES: 'false',
      CORNERMEX_SUPABASE_BLOCK_MUTATIONS: 'true',
    };
    const check = parseLastJson(execFileSync(nodeBin, ['scripts/cornermex-supabase-read-only-check.js'], { cwd: root, env, encoding: 'utf8' }));
    const schemaDemo = parseLastJson(execFileSync(nodeBin, ['scripts/demo-cornermex-schema-discovery.js'], { cwd: root, env, encoding: 'utf8' }));
    const v113 = parseLastJson(execFileSync(nodeBin, ['scripts/demo-v1.1.3.js'], { cwd: root, env, encoding: 'utf8' }));
    expect(check.mode).toBe('blocked_by_missing_supabase_readonly_config');
    expect(check.credentials.anonKeyPrinted).toBe(false);
    expect(schemaDemo.safety.migrations).toBe('not_executed');
    expect(v113.finalSafetySummary.telegramV12).toBe('not_started');
  });
});
