const {
  ActionEngineService,
  CatalogCohortService,
  CapabilityMatrixService,
  EnvironmentDoctorService,
  LiveControlTowerStatusService,
  OperatingStageEngine,
  ProductActivationEngine,
} = require('../src/core/intelligence');

const productRows = [
  ...Array.from({ length: 9 }, (_, index) => ({
    id: `active-${index + 1}`,
    sku: `ACTIVE-${index + 1}`,
    name: `Active Product ${index + 1}`,
    category: 'existing',
    price_aed: 10 + index,
    stock: 5,
    status: 'active',
  })),
  ...Array.from({ length: 190 }, (_, index) => ({
    id: `draft-${index + 1}`,
    sku: `CMX-${index + 1}`,
    name: `Intermex Draft ${index + 1}`,
    category: index % 10 === 0 ? '' : 'snacks',
    price_aed: 20 + index,
    stock: 50,
    status: 'inactive',
  })),
];

const createClient = () => ({
  countRows: jest.fn(async ({ table }) => ({ count: table === 'cornerops_products_v' ? 199 : 0 })),
  selectRows: jest.fn(async ({ table, limit }) => ({
    data: table === 'cornerops_products_v' ? productRows.slice(0, limit) : [],
  })),
});

const connector = {
  getConnectorStatus: jest.fn(async () => ({
    sourceMode: 'real_read_only',
    dataSource: 'cornermex_supabase',
    warnings: [],
    rowCounts: { products: 199 },
  })),
};

const auditLogService = {
  record: jest.fn(async () => ({ id: 'audit-v18' })),
};

const createCatalog = () => new CatalogCohortService({
  auditLogService,
  client: createClient(),
  config: { cornermexExpectedProductCount: 190 },
  connector,
});

const createActionEngine = (catalogCohortService = createCatalog()) => new ActionEngineService({
  auditLogService,
  catalogCohortService,
  flowEngine: {
    analyzeFlows: jest.fn(async () => ({
      sourceMode: 'real_read_only',
      dataSource: 'cornermex_supabase',
      flows: [
        { id: 'b2b_lead_flow', records: [] },
        { id: 'quote_follow_up_flow', records: [] },
        { id: 'order_attention_flow', records: [] },
        { id: 'manual_payment_review_flow', records: [] },
        { id: 'product_quality_flow', records: [] },
        { id: 'customer_follow_up_flow', records: [] },
        { id: 'fulfillment_review_flow', records: [] },
      ],
      warnings: [],
    })),
  },
  founderReviewService: {
    buildFounderReview: jest.fn(async () => ({
      launchReadinessStatus: 'needs_work',
      launchReadinessScore: 57,
      operatingStage: 'pre_launch',
      launchDate: '2026-08-17',
      daysToLaunch: 39,
      launchRisks: [{ id: 'catalog_gaps', severity: 'medium', title: 'Catalog fields need launch review.' }],
      launchActions: [{ title: 'Select first launch-ready products.' }],
      warnings: [],
      auditId: 'audit-founder-v18',
    })),
  },
});

describe('Live Control Tower + Action Engine v1.8', () => {
  test('catalog cohort reconciles 190 imported drafts plus 9 existing active products', async () => {
    const cohort = await createCatalog().buildCohort({ requestId: 'test-catalog-v18' });
    expect(cohort.sourceMode).toBe('real_read_only');
    expect(cohort.totalReadableProducts).toBe(199);
    expect(cohort.importedIntermexDraftProducts).toBe(190);
    expect(cohort.existingActiveProducts).toBe(9);
    expect(cohort.expectedImportedProductCount).toBe(190);
    expect(cohort.importedCatalogReconciled).toBe(true);
    expect(cohort.productsWithPrice).toBe(199);
    expect(cohort.productsWithStock50).toBe(190);
    expect(cohort.duplicateSkuCount).toBe(0);
    expect(cohort.missingImageCount).toBeNull();
    expect(cohort.warnings.join(' ')).toContain('image fields are not exposed');
    expect(cohort.safety.writesBlocked).toBe(true);
  });

  test('catalog cohort deduplicates concurrent reads and times out safely', async () => {
    const selectRows = jest.fn(() => new Promise(() => {}));
    const countRows = jest.fn(() => new Promise(() => {}));
    const catalog = new CatalogCohortService({
      auditLogService,
      client: { countRows, selectRows },
      config: {
        cornermexExpectedProductCount: 190,
        cornermexSupabaseRequestTimeoutMs: 25,
      },
      connector,
    });
    const startedAt = Date.now();
    const [first, second, third] = await Promise.all([
      catalog.buildCohort({ requestId: 'timeout-a' }),
      catalog.buildCohort({ requestId: 'timeout-b' }),
      catalog.buildCohort({ requestId: 'timeout-c' }),
    ]);
    expect(Date.now() - startedAt).toBeLessThan(500);
    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(selectRows).toHaveBeenCalledTimes(2);
    expect(countRows).toHaveBeenCalledTimes(2);
    expect(first.totalReadableProducts).toBe(199);
    expect(first.warnings.join(' ')).toContain('timed out safely');
    expect(first.safety.writesBlocked).toBe(true);
  });

  test('action engine activates product quality and treats unavailable flows as no_data_yet', async () => {
    const actionEngine = await createActionEngine().build({ requestId: 'test-action-v18' });
    const productFlow = actionEngine.flows.find((flow) => flow.id === 'product_quality_flow');
    const orderFlow = actionEngine.flows.find((flow) => flow.id === 'order_attention_flow');
    const customerFlow = actionEngine.flows.find((flow) => flow.id === 'customer_follow_up_flow');
    expect(actionEngine.sourceMode).toBe('real_read_only');
    expect(productFlow.status).toBe('has_data');
    expect(productFlow.capabilityState).toBe('internal_draft_enabled');
    expect(productFlow.counts.importedIntermexDraftProducts).toBe(190);
    expect(orderFlow.status).toBe('no_data_yet');
    expect(orderFlow.reason).toBe('No orders requiring founder attention yet.');
    expect(customerFlow.reason).toContain('consent');
    expect(actionEngine.safety.productionWritesBlocked).toBe(true);
    expect(actionEngine.recommendedActions.map((action) => action.id)).toContain('catalog_validate_190_imported_drafts');
  });

  test('draft generation returns internal drafts only and never enables sends', async () => {
    const result = await createActionEngine().createDrafts({ requestId: 'test-drafts-v18' });
    expect(result.status).toBe('success');
    expect(result.persistence).toBe('not_configured');
    expect(result.drafts.length).toBeGreaterThan(0);
    expect(result.drafts.every((draft) => draft.sendStatus === 'DRAFT_NOT_SENT')).toBe(true);
    expect(result.safety.externalSendsBlocked).toBe(true);
  });

  test('live status exposes capability matrix without treating safety blocks as failures', async () => {
    const catalog = createCatalog();
    const actionEngine = createActionEngine(catalog);
    const live = await new LiveControlTowerStatusService({
      actionEngine,
      capabilityMatrixService: new CapabilityMatrixService(),
      catalogCohortService: catalog,
      environmentDoctorService: new EnvironmentDoctorService({
        config: {
          nodeEnv: 'test',
          cornermexSupabaseUrl: 'https://example.supabase.co',
          cornermexSupabaseAnonKey: 'publishable-key-present',
          cornermexSupabaseReadOnly: true,
          cornermexSupabaseAllowWrites: false,
          githubReadOnly: true,
        },
      }),
      founderReviewService: actionEngine.founderReviewService,
      operatingStageEngine: new OperatingStageEngine({ config: { operatingStage: 'pre_launch', launchDate: '2026-08-17' } }),
      productActivationEngine: new ProductActivationEngine({ catalogCohortService: catalog }),
      config: {
        githubReadOnly: true,
        openclawEnabled: false,
        telegramOperatorAllowedChatIds: [],
        telegramOperatorAllowedUserIds: [],
      },
    }).build({ requestId: 'test-live-v18' });
    expect(live.mode).toBe('real_read_only');
    expect(live.fallbackActive).toBe(false);
    expect(live.catalog.importedIntermexDraftProducts).toBe(190);
    expect(live.capabilityMatrix.capabilities.find((item) => item.id === 'whatsapp_send')).toMatchObject({
      state: 'blocked_by_safety',
      failure: false,
    });
    expect(live.workflowCoverage.activeNow).toContain('product_quality_flow');
    expect(live.environmentDoctor.secretsExposed).toBe(false);
  });

  test('product activation engine recommends batches but keeps activation blocked', async () => {
    const plan = await new ProductActivationEngine({ catalogCohortService: createCatalog() }).buildPlan({ requestId: 'test-product-activation-v18' });
    expect(plan.totalDraftProducts).toBe(190);
    expect(plan.recommendedBatches.map((batch) => batch.id)).toContain('batch_5_needs_review');
    expect(plan.safety.productActivationBlocked).toBe(true);
    expect(plan.nextActions.join(' ')).toContain('first 30');
  });
});
