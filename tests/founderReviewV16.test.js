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
  dataFreshness: { lastReadAt: null, tableAvailability: {} },
  warnings: [],
  ...overrides,
});

const createService = ({ state, auditId = 'audit-founder-review-v16' }) => new FounderReviewService({
  auditLogService: { record: jest.fn(async () => ({ id: auditId })) },
  intelligenceService: { buildState: jest.fn(async () => state) },
});

describe('Founder Review Loop v1.6', () => {
  test('generates a safe missing-data review with empty data', async () => {
    const service = createService({
      state: {
        overview: baseOverview({ sourceMode: 'mock', dataSource: 'mock_fallback' }),
        signals: [],
        anomalies: [],
        cases: [],
        flowAnalysis: {
          summary: {
            flowsWithData: [],
            flowsMissingData: ['b2b_lead_flow', 'quote_follow_up_flow'],
          },
          warnings: ['No live data available.'],
        },
      },
    });
    const review = await service.buildFounderReview({ requestId: 'empty-review-test' });
    expect(review.sourceMode).toBe('mock');
    expect(review.safetyPosture).toMatchObject({
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      runtimeSupabaseWritesBlocked: true,
    });
    expect(review.dataQuality.status).toBe('missing_or_mock');
    expect(review.missingData.map((item) => item.id)).toEqual(expect.arrayContaining([
      'products',
      'b2b_leads',
      'quotes',
      'orders',
      'payments',
      'fulfillment',
      'flow_b2b_lead_flow',
    ]));
    expect(review.nextFounderStep).toContain('Supabase read-only credentials');
  });

  test('generates founder review from sample operational data', async () => {
    const anomaly = {
      id: 'anomaly-payment-1',
      anomalyKey: 'payment-1',
      type: 'manual_payment_review_flow',
      severity: 'medium',
      title: 'Bank Transfer requires review',
      suggestedAction: 'Review payment evidence; never mark paid automatically.',
      sourceMode: 'real_read_only',
      readOnly: true,
      writesBlocked: true,
    };
    const service = createService({
      state: {
        overview: baseOverview({
          counts: {
            productsCount: 3,
            activeProducts: 3,
            lowStockProducts: 1,
            b2bLeadCount: 2,
            warmLeads: 1,
            quoteCount: 1,
            quoteFollowUpCount: 1,
            orderCount: 2,
            orderAttentionCount: 1,
            customerCount: 2,
            paymentCount: 2,
            fulfillmentCount: 1,
            pendingPaymentReviewCount: 1,
            fulfillmentDelayedCount: 1,
            anomalyCandidateCount: 1,
            trackedAnomalyCaseCount: 0,
          },
          topOperationalAlerts: [{
            id: 'alert-payment-1',
            title: 'Bank Transfer requires review',
            severity: 'medium',
            recommendedAction: 'Review manually.',
          }],
          recommendedFounderActions: ['Review pending manual payment candidates.'],
          dataFreshness: {
            lastReadAt: '2026-07-09T00:00:00.000Z',
            tableAvailability: { products: 'available_masked', payments: 'available_masked' },
          },
        }),
        signals: [{ id: 'signal-lead-1', type: 'b2b_lead_flow', title: 'Warm B2B lead', readOnly: true }],
        anomalies: [anomaly],
        cases: [{ id: 'case-draft-payment-1', title: 'Payment review', dryRun: true, writesBlocked: true }],
        flowAnalysis: {
          summary: {
            flowsWithData: ['manual_payment_review_flow', 'b2b_lead_flow'],
            flowsMissingData: [],
          },
          warnings: [],
        },
      },
    });
    const review = await service.buildFounderReview({ requestId: 'sample-review-test' });
    expect(review.dataQuality.status).toBe('usable');
    expect(review.operationalMetrics.payments).toBe(2);
    expect(review.paymentRisks).toHaveLength(1);
    expect(review.leadFollowUps).toHaveLength(1);
    expect(review.urgentActions[0].approvalRequired).toBe(true);
    expect(review.recommendedActions).toEqual(expect.arrayContaining([
      'Review manual payment candidates; never mark paid automatically.',
    ]));
  });

  test('masks PII and preserves no-write/no-send posture', async () => {
    const service = createService({
      state: {
        overview: baseOverview({
          counts: { productsCount: 1, customerCount: 1 },
          topOperationalAlerts: [],
        }),
        signals: [{
          id: 'signal-customer',
          type: 'customer_follow_up_flow',
          title: 'Contact maria@example.com at +971 50 123 4567',
          readOnly: true,
        }],
        anomalies: [{
          id: 'anomaly-customer',
          anomalyKey: 'customer',
          type: 'customer_follow_up_flow',
          title: 'Contact maria@example.com at +971 50 123 4567',
          suggestedAction: 'Prepare local draft only.',
          sourceMode: 'real_read_only',
          readOnly: true,
          writesBlocked: true,
        }],
        cases: [],
        flowAnalysis: { summary: { flowsWithData: ['customer_follow_up_flow'], flowsMissingData: [] }, warnings: [] },
      },
    });
    const review = await service.buildFounderReview({ requestId: 'pii-review-test' });
    const serialized = JSON.stringify(review);
    expect(serialized).not.toContain('maria@example.com');
    expect(serialized).not.toContain('+971 50 123 4567');
    expect(serialized).toContain('ma***@example.com');
    expect(review.safetyPosture.whatsappSendsBlocked).toBe(true);
    expect(review.safetyPosture.emailSendsBlocked).toBe(true);
    expect(review.safetyPosture.writesBlocked).toBe(true);
  });

  test('v1.6 docs exist without secrets', () => {
    [
      'docs/lovable/prompts/control-tower-v1.6-founder-review-loop.md',
      'docs/acceptance/acceptance-v1.6.md',
    ].forEach((file) => {
      const content = fs.readFileSync(path.join(root, file), 'utf8');
      expect(content).toBeTruthy();
      expect(content).not.toMatch(/service_role_[A-Za-z0-9_-]{10,}|sb_secret|ghp_|sk-[A-Za-z0-9_-]{20,}/i);
    });
  });
});
