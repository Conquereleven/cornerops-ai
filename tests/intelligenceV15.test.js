const fs = require('fs');
const path = require('path');
const {
  IntelligenceService,
  convertAnomalyToCaseDraft,
  normalizeConfidenceScore,
  normalizeSeverity,
  scoreAnomalyRuleBased,
} = require('../src/core/intelligence');
const { mapCornerMexAnomalyToCornerOpsAnomaly } = require('../src/core/data-contracts/cornermex');

const root = path.resolve(__dirname, '..');

describe('CornerOps Real Operational Intelligence v1.5', () => {
  test('normalizes severity, confidence and case drafts safely', () => {
    expect(normalizeSeverity('P1')).toBe('high');
    expect(normalizeConfidenceScore(83)).toBe(0.83);
    const anomaly = {
      anomalyKey: 'pay-1001',
      clientSlug: 'cornermex',
      type: 'payment_review',
      severity: 'high',
      confidenceScore: 0.75,
      title: 'Bank transfer pending review',
    };
    expect(scoreAnomalyRuleBased(anomaly)).toBeGreaterThan(0.7);
    const draft = convertAnomalyToCaseDraft(anomaly);
    expect(draft).toMatchObject({
      anomalyKey: 'pay-1001',
      clientSlug: 'cornermex',
      readOnly: true,
      writesBlocked: true,
      dryRun: true,
      externalSendsBlocked: true,
    });
  });

  test('maps CornerMex anomaly_events into CornerOps anomalies and case drafts', () => {
    const mapped = mapCornerMexAnomalyToCornerOpsAnomaly({
      anomaly_key: 'uae-stock-tajin',
      type: 'inventory_low_stock',
      severity: 'medium',
      status: 'open',
      title: 'Tajin stock needs review',
      evidence: [{ metric: 'stock', value: 3 }],
      hypotheses: ['Demand spike'],
      suggested_action: 'Review replenishment',
      emirate_code: 'DXB',
      emirate_name: 'Dubai',
      product_id: 'prod_tajin',
      product_slug: 'tajin-clasico',
      confidence_score: 64,
      first_detected_at: '2026-07-01T00:00:00Z',
      source: 'cornermex_live_view',
    });
    expect(mapped.clientSlug).toBe('cornermex');
    expect(mapped.source).toBe('cornermex_live_view');
    expect(mapped.confidenceScore).toBe(0.64);
    expect(mapped.caseDraft.writesBlocked).toBe(true);
  });

  test('builds read-only intelligence overview from connector and flow evidence', async () => {
    const service = new IntelligenceService({
      auditLogService: { record: jest.fn(async () => ({ id: 'audit-intelligence-v15' })) },
      connector: {
        getConnectorStatus: jest.fn(async () => ({
          sourceMode: 'real_read_only',
          dataSource: 'cornermex_supabase',
          supabaseStatus: 'connected',
          rowCounts: { products: 1, leads: 0, orders: 1, payments: 1, fulfillment: 1 },
          tableAvailability: { products: 'available_masked' },
          maskingApplied: true,
          warnings: [],
        })),
      },
      flowEngine: {
        analyzeFlows: jest.fn(async () => ({
          sourceMode: 'real_read_only',
          dataSource: 'cornermex_supabase',
          flows: [{
            id: 'manual_payment_review_flow',
            sourceMode: 'real_read_only',
            records: [{ id: 'order-1', reason: 'Bank Transfer requires review.' }],
          }],
          summary: { candidates: { manual_payment_review_flow: 1 } },
          warnings: [],
        })),
      },
    });
    const overview = await service.getOverview();
    expect(overview.sourceMode).toBe('real_read_only');
    expect(overview.writesBlocked).toBe(true);
    expect(overview.externalSendsBlocked).toBe(true);
    expect(overview.counts.pendingPaymentReviewCount).toBe(1);
    expect(overview.anomalies).toHaveLength(1);
    expect(overview.cases[0].dryRun).toBe(true);
    expect(overview.auditId).toBe('audit-intelligence-v15');
  });

  test('v1.5 docs and data templates exist without secrets', () => {
    [
      'docs/data/cornermex-real-data-onboarding-v1.5.md',
      'docs/supabase/cornermex-real-data-import-v1.5.sql',
      'docs/supabase/cornermex-real-data-schema-notes-v1.5.md',
      'docs/cornerops-architecture.md',
      'docs/lovable/prompts/control-tower-v1.5-real-operational-intelligence.md',
      'docs/acceptance/acceptance-v1.5.md',
      'data/cornermex/onboarding-v1.5/products.template.csv',
      'data/cornermex/onboarding-v1.5/b2b_leads.template.csv',
      'data/cornermex/onboarding-v1.5/orders.template.csv',
      'data/cornermex/onboarding-v1.5/order_items.template.csv',
      'data/cornermex/onboarding-v1.5/inventory.template.csv',
      'data/cornermex/onboarding-v1.5/payments.template.csv',
      'data/cornermex/onboarding-v1.5/fulfillment.template.csv',
    ].forEach((file) => {
      const content = fs.readFileSync(path.join(root, file), 'utf8');
      expect(content).toBeTruthy();
      expect(content).not.toMatch(/service_role_[A-Za-z0-9_-]{10,}|sb_secret|ghp_|sk-[A-Za-z0-9_-]{20,}/i);
    });
  });
});
