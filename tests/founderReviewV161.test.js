const fs = require('fs');
const path = require('path');
const { FounderReviewService } = require('../src/core/intelligence');

const root = path.resolve(__dirname, '..');

const baseOverview = (overrides = {}) => ({
  status: 'success',
  sourceMode: 'real_read_only',
  dataSource: 'cornermex_supabase',
  readOnly: true,
  dryRun: true,
  writesBlocked: true,
  externalSendsBlocked: true,
  piiMasked: true,
  counts: {
    productsCount: 0,
    activeProducts: 0,
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
  topOperationalAlerts: [],
  recommendedFounderActions: [],
  dataFreshness: {
    lastReadAt: '2026-07-09T00:00:00.000Z',
    tableAvailability: {
      products: 'available_masked',
      orders: 'available_empty',
      payments: 'available_empty',
      fulfillment: 'available_empty',
    },
  },
  warnings: [],
  ...overrides,
});

const createService = ({ state, products = [] }) => new FounderReviewService({
  auditLogService: { record: jest.fn(async () => ({ id: 'audit-founder-review-v161' })) },
  config: { operatingStage: 'pre_launch', launchDate: '2026-08-17' },
  connector: {
    listProducts: jest.fn(async () => ({
      data: products,
      meta: {
        source: 'real_read_only',
        readOnly: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        maskingApplied: true,
      },
    })),
  },
  intelligenceService: { buildState: jest.fn(async () => state) },
});

describe('Pre-Launch Founder Review Mode v1.6.1', () => {
  test('pre-launch mode does not treat missing orders, payments or fulfillment as critical live failures', async () => {
    const service = createService({
      state: {
        overview: baseOverview({
          counts: {
            ...baseOverview().counts,
            productsCount: 149,
            activeProducts: 149,
          },
        }),
        signals: [],
        anomalies: [],
        cases: [],
        flowAnalysis: { summary: { flowsWithData: [], flowsMissingData: [] }, warnings: [] },
      },
      products: [
        { id: 'p1', sku: 'TAJIN-142G', name: 'Tajin', category: 'seasoning', priceAED: 14, stock: 120 },
      ],
    });
    const review = await service.buildFounderReview({
      requestId: 'prelaunch-no-live-orders',
      now: '2026-07-09T12:00:00.000Z',
    });
    expect(review.operatingStage).toBe('pre_launch');
    expect(review.daysToLaunch).toBe(39);
    expect(review.urgentActions.map((action) => action.id)).not.toEqual(expect.arrayContaining([
      'orders',
      'payments',
      'fulfillment',
    ]));
    expect(review.missingData.find((item) => item.id === 'orders')).toMatchObject({
      preLaunchExpected: true,
      priority: 'informational',
      requiredForFounderLoop: false,
    });
    expect(review.missingData.find((item) => item.id === 'payment_test')).toMatchObject({
      preLaunchExpected: true,
      priority: 'launch_rehearsal',
      requiredForFounderLoop: false,
    });
  });

  test('product count drives catalog readiness and launch actions', async () => {
    const service = createService({
      state: {
        overview: baseOverview({
          counts: {
            ...baseOverview().counts,
            productsCount: 149,
            activeProducts: 149,
            b2bLeadCount: 10,
          },
        }),
        signals: [],
        anomalies: [],
        cases: [],
        flowAnalysis: { summary: { flowsWithData: ['product_quality_flow'], flowsMissingData: [] }, warnings: [] },
      },
      products: [
        { id: 'p1', sku: 'TAJIN-142G', name: 'Tajin', category: 'seasoning', priceAED: 14, stock: 120 },
        { id: 'p2', sku: 'PULP-20', name: 'Pulparindo', category: 'candy', priceAED: 32, stock: 80 },
      ],
    });
    const review = await service.buildFounderReview({ now: '2026-07-09T12:00:00.000Z' });
    expect(review.catalogReadiness.productCount).toBe(149);
    expect(review.catalogReadiness.evidence.join(' ')).toContain('149 product row(s) readable');
    expect(review.launchActions.map((action) => action.title)).toEqual(expect.arrayContaining([
      'Complete product data quality review for 149 readable product(s).',
      'Identify top 20 launch products.',
      'Run payment method test.',
      'Run internal fulfillment test order.',
    ]));
    expect(review.launchReadinessScore).toBeGreaterThan(0);
    expect(['needs_work', 'launch_rehearsal_ready', 'soft_launch_ready']).toContain(review.launchReadinessStatus);
  });

  test('missing product fields become launch readiness warnings without exposing PII or enabling sends', async () => {
    const service = createService({
      state: {
        overview: baseOverview({
          counts: {
            ...baseOverview().counts,
            productsCount: 2,
            activeProducts: 2,
          },
        }),
        signals: [{ id: 'signal', title: 'Contact maria@example.com +971 50 123 4567' }],
        anomalies: [],
        cases: [],
        flowAnalysis: { summary: { flowsWithData: [], flowsMissingData: [] }, warnings: [] },
      },
      products: [
        { id: 'p1', sku: 'TAJIN-142G', name: 'Tajin', category: 'seasoning', priceAED: 14, stock: 120 },
        { id: 'p2', sku: '', name: 'No SKU', category: '', priceAED: '', stock: 0 },
      ],
    });
    const review = await service.buildFounderReview({ now: '2026-07-09T12:00:00.000Z' });
    expect(review.catalogReadiness.missingFields.sku).toBe(1);
    expect(review.catalogReadiness.missingFields.category).toBe(1);
    expect(review.inventoryReadiness.writesBlocked).toBeUndefined();
    expect(review.safetyPosture).toMatchObject({
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      whatsappSendsBlocked: true,
      emailSendsBlocked: true,
    });
    const serialized = JSON.stringify(review);
    expect(serialized).not.toContain('maria@example.com');
    expect(serialized).not.toContain('+971 50 123 4567');
  });

  test('v1.6.1 docs exist without secrets', () => {
    [
      'docs/lovable/prompts/control-tower-v1.6.1-pre-launch-founder-review.md',
      'docs/acceptance/acceptance-v1.6.1.md',
    ].forEach((file) => {
      const content = fs.readFileSync(path.join(root, file), 'utf8');
      expect(content).toBeTruthy();
      expect(content).not.toMatch(/service_role_[A-Za-z0-9_-]{10,}|sb_secret|ghp_|sk-[A-Za-z0-9_-]{20,}/i);
    });
  });
});
