const { execFileSync } = require('child_process');
const path = require('path');
const {
  CornerMexCatalogReadModelReportService,
  CornerMexSupabaseReadOnlyConfig,
} = require('../src/integrations/cornermex');
const { FounderReviewService } = require('../src/core/intelligence');

const root = path.resolve(__dirname, '..');

const safeConfig = {
  cornermexExpectedProductCount: 149,
  cornermexSupabaseEnabled: true,
  cornermexSupabaseUrl: 'https://example.supabase.co',
  cornermexSupabaseAnonKey: 'sb_publishable_fake_key_for_test',
  cornermexSupabaseReadOnly: true,
  cornermexSupabaseAllowWrites: false,
  cornermexSupabaseServiceRoleKeyBlocked: true,
  cornermexSupabaseAuditReads: true,
  cornermexSupabasePiiMasking: true,
  cornermexSupabaseMaskPii: true,
  cornermexSupabaseFailClosed: true,
  cornermexSupabaseMaxRows: 5,
  cornermexSupabaseRequestTimeoutMs: 8000,
};

const createCatalogService = (client, config = safeConfig) => new CornerMexCatalogReadModelReportService({
  auditLogService: { record: jest.fn(async () => ({ id: 'audit-catalog-v162' })) },
  client,
  config,
  configSummary: new CornerMexSupabaseReadOnlyConfig({ config }),
});

const baseOverview = (productsCount = 9) => ({
  status: 'success',
  sourceMode: 'real_read_only',
  dataSource: 'cornermex_supabase',
  readOnly: true,
  dryRun: true,
  writesBlocked: true,
  externalSendsBlocked: true,
  piiMasked: true,
  counts: {
    productsCount,
    activeProducts: productsCount,
    lowStockProducts: 0,
    b2bLeadCount: 0,
    warmLeads: 0,
    quoteCount: 0,
    quoteFollowUpCount: 0,
    orderCount: 0,
    orderAttentionCount: 0,
    customerCount: 0,
    paymentCount: 0,
    fulfillmentCount: 0,
    pendingPaymentReviewCount: 0,
    fulfillmentDelayedCount: 0,
    anomalyCandidateCount: 0,
    trackedAnomalyCaseCount: 0,
  },
  dataFreshness: { tableAvailability: { products: 'available_masked' } },
  topOperationalAlerts: [],
  recommendedFounderActions: [],
  warnings: [],
});

describe('Catalog Read Model Reconciliation v1.6.2', () => {
  test('catalog report flags mismatch without exposing product rows or PII', async () => {
    const client = {
      countRows: jest.fn(async ({ table }) => {
        if (table === 'cornerops_products_v' || table === 'products') return { count: 9 };
        return { error: { code: 'PGRST205', message: `Could not find ${table}` } };
      }),
      selectRows: jest.fn(async ({ table, limit }) => {
        if (table === 'cornerops_products_v' || table === 'products') {
          return {
            data: [
              {
                id: 'prod-1',
                name: 'Tajin should not be printed',
                sku: 'TAJIN-142G',
                price: 14,
                stock: 0,
                image_url: '',
                email: 'customer@example.test',
              },
            ].slice(0, limit),
          };
        }
        return { error: { code: 'PGRST205', message: `Could not find ${table}` } };
      }),
    };
    const report = await createCatalogService(client).buildReport({ requestId: 'catalog-test' });
    expect(report.expectedFounderProductCount).toBe(149);
    expect(report.readableProducts).toBe(9);
    expect(report.productCountMismatch).toBe(true);
    expect(report.productCountMismatchWarning).toContain('149');
    expect(report.sourceSummary.primaryReadModel).toMatchObject({
      table: 'cornerops_products_v',
      exactRowCount: 9,
      available: true,
    });
    expect(report.safety).toMatchObject({
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      serviceRoleUsed: false,
      secretsPrinted: false,
    });
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain('Tajin should not be printed');
    expect(serialized).not.toContain('customer@example.test');
  });

  test('unavailable product-related tables are reported as unavailable, not failures', async () => {
    const client = {
      countRows: jest.fn(async () => ({ error: { code: 'PGRST205', message: 'schema cache missing table' } })),
      selectRows: jest.fn(async () => ({ error: { code: 'PGRST205', message: 'schema cache missing table' } })),
    };
    const report = await createCatalogService(client).buildReport({ requestId: 'missing-products-test' });
    expect(report.status).toBe('success');
    expect(report.readableProducts).toBe(0);
    expect(report.sourceSummary.availableSources).toHaveLength(0);
    expect(report.sourceSummary.unavailableSources.length).toBeGreaterThan(0);
    expect(report.writesBlocked).toBe(true);
  });

  test('expected product count config does not override live readable truth in Founder Review', async () => {
    const service = new FounderReviewService({
      auditLogService: { record: jest.fn(async () => ({ id: 'audit-founder-v162' })) },
      config: {
        operatingStage: 'pre_launch',
        launchDate: '2026-08-17',
        expectedProductCount: 149,
      },
      connector: {
        listProducts: jest.fn(async () => ({
          data: [{ id: 'prod-1', sku: 'SKU-1', price: 10, stock: 2 }],
          meta: { source: 'real_read_only' },
        })),
      },
      intelligenceService: {
        buildState: jest.fn(async () => ({
          overview: baseOverview(9),
          signals: [],
          anomalies: [],
          cases: [],
          flowAnalysis: { summary: { flowsWithData: [], flowsMissingData: [] }, warnings: [] },
        })),
      },
    });
    const review = await service.buildFounderReview({ now: '2026-07-09T12:00:00.000Z' });
    expect(review.catalogReadiness.productCount).toBe(9);
    expect(review.catalogReadiness.readableProductCount).toBe(9);
    expect(review.catalogReadiness.expectedFounderProductCount).toBe(149);
    expect(review.catalogReadiness.productCountMismatch).toBe(true);
    expect(review.catalogReadiness.catalogReadModelStatus).toBe('partial');
    expect(review.launchRisks.map((risk) => risk.id)).toContain('catalog_count_mismatch');
    expect(review.executiveSummary).toContain('Catalog read model is partial');
  });

  test('catalog read report CLI runs without credentials and does not expose secrets', () => {
    const env = {
      ...process.env,
      CORNERMEX_SUPABASE_ENABLED: 'false',
      CORNERMEX_SUPABASE_URL: '',
      CORNERMEX_SUPABASE_ANON_KEY: '',
      CORNERMEX_EXPECTED_PRODUCT_COUNT: '149',
    };
    const output = execFileSync(process.execPath, ['scripts/cornermex-catalog-read-report.js'], {
      cwd: root,
      encoding: 'utf8',
      env,
      maxBuffer: 8 * 1024 * 1024,
    });
    const parsed = JSON.parse(output);
    expect(parsed.report).toBe('cornermex_catalog_read_model_v1.6.2');
    expect(parsed.expectedFounderProductCount).toBe(149);
    expect(parsed.safety).toMatchObject({
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      serviceRoleUsed: false,
      secretsPrinted: false,
    });
    expect(output).not.toMatch(/service[-_]role|sb[_-]secret|Bearer\s+[A-Za-z0-9._-]+|eyJ[A-Za-z0-9._-]+/i);
  });
});
