const { execFileSync } = require('child_process');
const path = require('path');
const { ControlTowerV11ReportService } = require('../src/core/control-tower/ControlTowerV11ReportService');
const { CornerMexDataContractRegistry } = require('../src/core/data-contracts/cornermex');
const {
  LovableCornerMexConnector,
  LovableProjectDiscoveryService,
  LovableRepoDiscoveryService,
  LovableSupabaseDiscoveryService,
  maskPii,
} = require('../src/integrations/lovable');
const agents = require('../src/core/agents');

const root = path.resolve(__dirname, '..');
const nodeBin = process.execPath;

const makeServices = (config = {}) => {
  const auditEvents = [];
  const auditLogService = {
    record: async (event) => {
      auditEvents.push(event);
      return { id: `audit-${auditEvents.length}`, ...event };
    },
  };
  const repoDiscoveryService = new LovableRepoDiscoveryService({ config });
  const supabaseDiscoveryService = new LovableSupabaseDiscoveryService({ config });
  const discoveryService = new LovableProjectDiscoveryService({
    config,
    repoDiscoveryService,
    supabaseDiscoveryService,
  });
  const contractRegistry = new CornerMexDataContractRegistry();
  const connector = new LovableCornerMexConnector({
    auditLogService,
    config,
    contractRegistry,
    discoveryService,
  });
  return { auditEvents, connector, contractRegistry, discoveryService };
};

const parseLastJson = (output) => {
  const text = String(output);
  const start = text.lastIndexOf('\n{');
  return JSON.parse(text.slice(start >= 0 ? start + 1 : text.indexOf('{')));
};

describe('CornerOps Lovable CornerMex Connector v1.1.1', () => {
  test('Lovable discovery degrades safely when configuration is missing', async () => {
    const { discoveryService } = makeServices();
    const result = await discoveryService.discover();

    expect(result.sourceMode).toBe('missing_config');
    expect(result.project.configured).toBe(false);
    expect(result.repo.configured).toBe(false);
    expect(result.supabase.configured).toBe(false);
    expect(result.warnings).toEqual(expect.arrayContaining([
      'Missing CORNERMEX_LOVABLE_PROJECT_URL and CORNERMEX_LOVABLE_PROJECT_NAME.',
      'Missing CORNERMEX_LOVABLE_GITHUB_REPO.',
      'Missing CORNERMEX_SUPABASE_URL and/or CORNERMEX_SUPABASE_ANON_KEY.',
    ]));
    expect(result.risks).toContain('Discovery is using mock/template data until founder configuration is provided.');
  });

  test('CornerMex connector returns mock products, leads, quotes, orders and customers without credentials', async () => {
    const { auditEvents, connector } = makeServices();
    const [products, leads, quotes, orders, customers] = await Promise.all([
      connector.listProducts({ limit: 2 }, { requestId: 'products' }),
      connector.listLeads({ limit: 5 }, { requestId: 'leads' }),
      connector.listQuotes({ limit: 5 }, { requestId: 'quotes' }),
      connector.listOrders({ limit: 5 }, { requestId: 'orders' }),
      connector.listCustomers({ limit: 5 }, { requestId: 'customers' }),
    ]);

    expect(products.meta.source).toBe('mock');
    expect(products.data).toHaveLength(2);
    expect(leads.data[0].email).toBe('masked@example.test');
    expect(quotes.data.some((quote) => quote.status === 'sent_needs_follow_up')).toBe(true);
    expect(orders.data.some((order) => order.paymentMethod === 'Bank Transfer')).toBe(true);
    expect(orders.data.some((order) => order.paymentMethod === 'COD')).toBe(true);
    expect(customers.data[0].name).toMatch(/\*\*\*/);
    expect(auditEvents).toHaveLength(5);
    expect(auditEvents.every((event) => event.eventType === 'cornermex_lovable_read')).toBe(true);
  });

  test('CornerMex connector enforces max rows and does not expose write methods', async () => {
    const { connector } = makeServices({ cornermexSupabaseMaxRows: 1 });
    const products = await connector.listProducts({ limit: 99 });

    expect(products.data).toHaveLength(1);
    expect(products.meta.readOnly).toBe(true);
    expect(connector.createOrder).toBeUndefined();
    expect(connector.updateOrder).toBeUndefined();
    expect(connector.markPaymentPaid).toBeUndefined();
  });

  test('CornerMex connector keeps repo_discovered until real read-only select is verified', async () => {
    const repo = makeServices({ cornermexLovableGithubRepo: 'Conquereleven/corner-mex-uae' });
    expect((await repo.connector.getConnectorStatus()).sourceMode).toBe('repo_discovered');

    const supabase = makeServices({
      cornermexSupabaseEnabled: true,
      cornermexSupabaseUrl: 'https://example.supabase.co',
      cornermexSupabaseAnonKey: 'anon-test-key',
      cornermexSupabaseReadOnly: true,
      cornermexSupabaseAllowWrites: false,
    });
    const status = await supabase.connector.getConnectorStatus();
    expect(status.sourceMode).toBe('repo_discovered');
    expect(status.writesBlocked).toBe(true);
  });

  test('PII masking replaces emails and masks names/phones', () => {
    const masked = maskPii({
      name: 'Sample Customer',
      contactName: 'Ana Example',
      email: 'ana@example.test',
      phone: '+971501234567',
    });

    expect(masked.name).toBe('S***');
    expect(masked.contactName).toBe('A***');
    expect(masked.email).toBe('masked@example.test');
    expect(masked.phone).toMatch(/\*{3,}/);
  });

  test('CornerMex contracts exist and distinguish missing schema from mock templates', () => {
    const registry = new CornerMexDataContractRegistry();
    const missing = registry.getSummary({ sourceMode: 'missing_config' });
    const mock = registry.getSummary({ sourceMode: 'mock' });

    expect(missing.entities).toEqual(expect.arrayContaining(['product', 'lead', 'quote', 'order', 'customer', 'payment']));
    expect(missing.contracts.every((contract) => contract.confidence === 'low')).toBe(true);
    expect(missing.contracts.every((contract) => contract.missingFields.length > 0)).toBe(true);
    expect(mock.contracts.every((contract) => contract.confidence === 'low')).toBe(true);
  });

  test('Control Tower exposes CornerMex Lovable connector section and write blocking', async () => {
    const { connector } = makeServices();
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
      cornerMexConnector: connector,
      githubReadinessService: { check: async () => ({ mode: 'mock', connected: false, warnings: [], writesBlocked: true }) },
      businessDataReadinessService: { check: async () => ({ mode: 'mock', warnings: [], writesBlocked: true }) },
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
    expect(report.cornerMexLovableConnector.sourceMode).toBe('mock');
    expect(report.cornerMexLovableConnector.projectConfigured).toBe(false);
    expect(report.cornerMexLovableConnector.mappedContracts.map((contract) => contract.entity)).toContain('product');
    expect(report.cornerMexLovableConnector.writesBlocked).toBe(true);
  });

  test('agents understand CornerMex Lovable source modes without mutating data', async () => {
    const daily = await agents.agentOrchestrator.handleMessage({
      messageId: 'lovable-daily-test',
      conversationId: 'lovable-daily',
      userId: 'local-founder',
      channel: 'internal',
      text: 'Dame mi briefing de hoy con CornerMex Lovable',
    });
    const quotes = await agents.agentOrchestrator.handleMessage({
      messageId: 'lovable-order-test',
      conversationId: 'lovable-orders',
      userId: 'local-founder',
      channel: 'internal',
      text: 'Marca esta orden como pagada',
    });
    const security = await agents.agentOrchestrator.handleMessage({
      messageId: 'lovable-security-test',
      conversationId: 'lovable-security',
      userId: 'local-founder',
      channel: 'internal',
      text: 'Revisa seguridad de Supabase y Lovable',
    });

    expect(daily.dataSnapshot.sourceModes).toContain('mock');
    expect(daily.dataSnapshot.metrics.cornerMexProducts).toBeGreaterThan(0);
    expect(quotes.status).toBe('needs_approval');
    expect(quotes.proposedActions.some((action) => action.requiresApproval)).toBe(true);
    expect(security.dataSnapshot.metrics.cornerMexWarnings).toBeGreaterThanOrEqual(0);
  });

  test('v1.1.1 demos run without credentials', () => {
    const env = {
      ...process.env,
      CORNERMEX_LOVABLE_ENABLED: 'false',
      CORNERMEX_SUPABASE_ENABLED: 'false',
      CORNEROPS_CORNERMEX_CONNECTOR_ENABLED: 'false',
      CORNERMEX_LOVABLE_PROJECT_URL: '',
      CORNERMEX_LOVABLE_GITHUB_REPO: '',
      CORNERMEX_SUPABASE_URL: '',
      CORNERMEX_SUPABASE_ANON_KEY: '',
    };
    const discovery = parseLastJson(execFileSync(nodeBin, ['scripts/demo-lovable-discovery.js'], { cwd: root, env, encoding: 'utf8' }));
    const connector = parseLastJson(execFileSync(nodeBin, ['scripts/demo-cornermex-connector.js'], { cwd: root, env, encoding: 'utf8' }));
    const combined = parseLastJson(execFileSync(nodeBin, ['scripts/demo-v1.1.1.js'], { cwd: root, env, encoding: 'utf8' }));

    expect(discovery.realLovableCalled).toBe(false);
    expect(['missing_config', 'mock']).toContain(discovery.sourceMode);
    expect(connector.status.sourceMode).toBe('mock');
    expect(connector.writes.products).toBe('blocked');
    expect(combined.safety.telegramV12).toBe('not_started');
  });
});
