const { sanitizeValue } = require('../security/SecuritySanitizer');
const { IntelligenceService } = require('./IntelligenceService');

const FLOW_LABELS = {
  b2b_lead_flow: 'B2B lead follow-up',
  quote_follow_up_flow: 'Quote follow-up',
  order_attention_flow: 'Order attention',
  manual_payment_review_flow: 'Manual payment review',
  product_quality_flow: 'Product quality',
  customer_follow_up_flow: 'Customer follow-up',
  fulfillment_review_flow: 'Fulfillment review',
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const unique = (items) => [...new Set(items.filter(Boolean))];

const matching = (items, terms) => asArray(items).filter((item) => {
  const text = JSON.stringify(item).toLowerCase();
  return terms.some((term) => text.includes(term));
});

const preLaunchExpectedWarning = (warning) => /no (orders?|manual payment|customer|fulfillment|quote) .*?(available|found|signals|candidates)/i
  .test(String(warning || ''));

const operationalRowCount = (counts = {}) => [
  counts.productsCount,
  counts.b2bLeadCount,
  counts.quoteCount,
  counts.orderCount,
  counts.customerCount,
  counts.paymentCount,
  counts.fulfillmentCount,
].reduce((sum, value) => sum + Number(value || 0), 0);

const firstPresent = (row, keys) => keys.find((key) => Object.prototype.hasOwnProperty.call(row || {}, key));
const isMissing = (value) => value === undefined || value === null || value === '';
const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

class FounderReviewService {
  constructor({
    auditLogService,
    config = {},
    connector,
    flowEngine,
    intelligenceService,
  } = {}) {
    this.auditLogService = auditLogService;
    this.config = {
      operatingStage: config.cornermexOperatingStage || config.operatingStage || 'live',
      launchDate: config.cornermexLaunchDate || config.launchDate || '',
    };
    this.connector = connector;
    this.intelligenceService = intelligenceService || new IntelligenceService({
      auditLogService,
      connector,
      flowEngine,
    });
  }

  async buildFounderReview(options = {}) {
    const requestId = options.requestId || 'founder-review-v1.6';
    const state = await this.intelligenceService.buildState({ requestId });
    const overview = state.overview || {};
    const counts = overview.counts || {};
    const operatingStage = options.operatingStage || this.config.operatingStage || 'live';
    const launchDate = options.launchDate || this.config.launchDate || '';
    const generatedAt = new Date(options.now || Date.now()).toISOString();
    const daysToLaunch = this.daysToLaunch(launchDate, generatedAt);
    const anomalies = asArray(state.anomalies);
    const cases = asArray(state.cases);
    const signals = asArray(state.signals);
    const flowAnalysis = state.flowAnalysis || {};
    const flowSummary = flowAnalysis.summary || {};
    const hasConfirmedOperationalRows = operationalRowCount(counts) > 0;
    const reviewAnomalies = hasConfirmedOperationalRows ? anomalies : [];
    const reviewCases = hasConfirmedOperationalRows ? cases : [];
    const reviewSignals = hasConfirmedOperationalRows ? signals : [];
    const productSample = operatingStage === 'pre_launch'
      ? await this.loadProductSample({ requestId, userId: options.userId, channel: options.channel })
      : { data: [], meta: {} };
    const preLaunch = operatingStage === 'pre_launch'
      ? this.buildPreLaunchReadiness({ counts, overview, productSample, launchDate, daysToLaunch })
      : null;
    const missingData = this.buildMissingDataChecklist({ counts, overview, flowSummary, operatingStage, preLaunch });
    const dataQuality = this.buildDataQuality({ overview, counts, flowSummary, missingData, operatingStage });
    const urgentActions = operatingStage === 'pre_launch'
      ? this.buildPreLaunchUrgentActions({ daysToLaunch, preLaunch })
      : this.buildUrgentActions({ overview, anomalies: reviewAnomalies, missingData });
    const recommendedActions = this.buildRecommendedActions({
      overview,
      counts,
      hasConfirmedOperationalRows,
      operatingStage,
      preLaunch,
      missingData,
    });
    const review = {
      status: 'success',
      generatedAt,
      operatingStage,
      launchDate: launchDate || null,
      daysToLaunch,
      sourceMode: overview.sourceMode || 'mock',
      dataSource: overview.dataSource || 'unknown',
      safetyPosture: {
        readOnly: true,
        dryRun: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        runtimeSupabaseWritesBlocked: true,
        whatsappSendsBlocked: true,
        emailSendsBlocked: true,
        customerChannelsDisabled: true,
        piiMasked: overview.piiMasked !== false,
      },
      dataQuality,
      executiveSummary: this.buildExecutiveSummary({
        overview,
        counts,
        anomalies: reviewAnomalies,
        missingData,
        operatingStage,
        preLaunch,
      }),
      urgentActions,
      operationalMetrics: {
        products: counts.productsCount || 0,
        b2bLeads: counts.b2bLeadCount || 0,
        quotes: counts.quoteCount || 0,
        orders: counts.orderCount || 0,
        customers: counts.customerCount || 0,
        payments: counts.paymentCount || 0,
        fulfillment: counts.fulfillmentCount || 0,
        anomalyCandidates: reviewAnomalies.length,
        openDraftCases: reviewCases.length,
      },
      inventoryRisks: matching(reviewAnomalies, ['inventory', 'stock', 'product']).slice(0, 8),
      paymentRisks: matching(reviewAnomalies, ['payment', 'bank transfer', 'manual_payment']).slice(0, 8),
      fulfillmentRisks: matching(reviewAnomalies, ['fulfillment', 'delivery', 'order_attention']).slice(0, 8),
      leadFollowUps: matching(reviewSignals, ['b2b_lead_flow', 'lead']).slice(0, 8),
      anomalyCandidates: reviewAnomalies.slice(0, 12),
      caseDrafts: reviewCases.slice(0, 12),
      recommendedActions,
      missingData,
      ...(preLaunch || {}),
      nextFounderStep: this.nextFounderStep({
        sourceMode: overview.sourceMode,
        operatingStage,
        preLaunch,
        missingData,
        urgentActions,
      }),
      auditId: overview.auditId,
      warnings: unique([
        ...this.filterWarningsForStage([...(overview.warnings || []), ...(flowAnalysis.warnings || [])], operatingStage),
        'Founder Review Loop v1.6 is read-only; recommended actions are review guidance only.',
      ]),
    };
    const audit = await this.auditLogService?.record?.({
      requestId,
      eventType: 'founder_review_read',
      dataSource: review.dataSource,
      operation: 'build_founder_review',
      userId: options.userId || 'founder-review-api',
      channel: options.channel || 'api',
      policyDecision: 'allowed_read_only',
      status: 'success',
      input: {
        sourceMode: review.sourceMode,
        urgentActionCount: urgentActions.length,
        missingDataCount: missingData.length,
        writesBlocked: true,
      },
    });
    return sanitizeValue({
      ...review,
      auditId: audit?.id || review.auditId,
    });
  }

  filterWarningsForStage(warnings, operatingStage) {
    if (operatingStage !== 'pre_launch') return warnings;
    const filtered = warnings.filter((warning) => !preLaunchExpectedWarning(warning));
    if (filtered.length !== warnings.length) {
      filtered.push('Some live-operation gaps are expected in pre-launch mode and are tracked as launch readiness items, not production failures.');
    }
    return filtered;
  }

  async loadProductSample(context = {}) {
    if (!this.connector?.listProducts) return { data: [], meta: { availability: 'connector_unavailable' } };
    try {
      const result = await this.connector.listProducts({ limit: 1000 }, {
        requestId: context.requestId || 'founder-review-products-v1.6.1',
        userId: context.userId || 'founder-review',
        channel: context.channel || 'api',
        agentId: 'founder-review-v1.6.1',
      });
      return {
        data: asArray(result?.data),
        meta: result?.meta || {},
      };
    } catch (error) {
      return {
        data: [],
        meta: { availability: 'read_failed_safely', warnings: [`Product sample read failed safely: ${error.message}`] },
      };
    }
  }

  daysToLaunch(launchDate, generatedAt) {
    if (!launchDate) return null;
    const launch = new Date(`${launchDate}T00:00:00.000Z`);
    const now = new Date(generatedAt);
    if (Number.isNaN(launch.getTime()) || Number.isNaN(now.getTime())) return null;
    return Math.ceil((launch.getTime() - now.getTime()) / 86400000);
  }

  buildPreLaunchReadiness({ counts, overview, productSample, launchDate, daysToLaunch }) {
    const products = asArray(productSample.data);
    const productCount = Number(counts.productsCount || products.length || 0);
    const catalogReadiness = this.catalogReadiness({ products, productCount });
    const inventoryReadiness = this.inventoryReadiness({ products, productCount, lowStockProducts: counts.lowStockProducts });
    const paymentReadiness = this.readinessCategory({
      id: 'paymentReadiness',
      status: counts.paymentCount > 0 ? 'partial' : 'unknown',
      score: counts.paymentCount > 0 ? 0.6 : 0.25,
      confidence: counts.paymentCount > 0 ? 'medium' : 'low',
      evidence: counts.paymentCount > 0 ? [`${counts.paymentCount} payment row(s) readable.`] : [],
      warnings: counts.paymentCount > 0 ? [] : ['Payment readiness is unknown until an internal payment method test is recorded.'],
    });
    const fulfillmentReadiness = this.readinessCategory({
      id: 'fulfillmentReadiness',
      status: counts.fulfillmentCount > 0 ? 'partial' : 'unknown',
      score: counts.fulfillmentCount > 0 ? 0.6 : 0.25,
      confidence: counts.fulfillmentCount > 0 ? 'medium' : 'low',
      evidence: counts.fulfillmentCount > 0 ? [`${counts.fulfillmentCount} fulfillment row(s) readable.`] : [],
      warnings: counts.fulfillmentCount > 0 ? [] : ['Fulfillment readiness is unknown until an internal fulfillment rehearsal is recorded.'],
    });
    const complianceReadiness = this.readinessCategory({
      id: 'complianceReadiness',
      status: catalogReadiness.unavailableFields.includes('complianceStatus') ? 'unknown' : 'partial',
      score: catalogReadiness.unavailableFields.includes('complianceStatus') ? 0.25 : 0.55,
      confidence: catalogReadiness.unavailableFields.includes('complianceStatus') ? 'low' : 'medium',
      evidence: [],
      warnings: catalogReadiness.unavailableFields.includes('complianceStatus')
        ? ['Compliance status field is unavailable in readable product data.']
        : [],
    });
    const b2bReadiness = this.readinessCategory({
      id: 'b2bReadiness',
      status: counts.b2bLeadCount > 0 ? 'partial' : 'unknown',
      score: counts.b2bLeadCount > 0 ? 0.65 : 0.3,
      confidence: counts.b2bLeadCount > 0 ? 'medium' : 'low',
      evidence: counts.b2bLeadCount > 0 ? [`${counts.b2bLeadCount} B2B lead row(s) readable.`] : [],
      warnings: counts.b2bLeadCount > 0 ? [] : ['B2B launch/outreach list is not readable yet.'],
    });
    const marketingReadiness = this.readinessCategory({
      id: 'marketingReadiness',
      status: catalogReadiness.unavailableFields.includes('seoTitle') && catalogReadiness.unavailableFields.includes('seoDescription') ? 'unknown' : 'partial',
      score: catalogReadiness.unavailableFields.includes('seoTitle') && catalogReadiness.unavailableFields.includes('seoDescription') ? 0.25 : 0.55,
      confidence: 'low',
      evidence: [],
      warnings: ['Marketing/SEO readiness requires reviewed launch copy, campaign offer, and Arabic/legal placeholders.'],
    });
    const weighted = [
      [catalogReadiness, 0.30],
      [inventoryReadiness, 0.20],
      [paymentReadiness, 0.15],
      [fulfillmentReadiness, 0.15],
      [complianceReadiness, 0.15],
      [b2bReadiness, 0.025],
      [marketingReadiness, 0.025],
    ];
    const launchReadinessScore = Math.round(weighted.reduce((sum, [category, weight]) => sum + (category.score * weight), 0) * 100);
    const launchReadinessConfidence = weighted.some(([category]) => category.confidence === 'low') ? 'low' : 'medium';
    const launchReadinessStatus = this.launchReadinessStatus(launchReadinessScore, launchReadinessConfidence);
    const launchRisks = this.launchRisks({
      catalogReadiness,
      inventoryReadiness,
      paymentReadiness,
      fulfillmentReadiness,
      complianceReadiness,
      b2bReadiness,
      marketingReadiness,
      daysToLaunch,
      productCount,
    });
    return {
      launchReadinessStatus,
      launchReadinessScore,
      launchReadinessConfidence,
      catalogReadiness,
      inventoryReadiness,
      paymentReadiness,
      fulfillmentReadiness,
      complianceReadiness,
      b2bReadiness,
      marketingReadiness,
      launchRisks,
      launchActions: this.launchActions({ productCount, catalogReadiness, daysToLaunch }),
      launchContext: {
        launchDate: launchDate || null,
        daysToLaunch,
        preLaunchMode: true,
        missingLiveOrdersExpected: true,
        missingLivePaymentsExpected: true,
        missingLiveFulfillmentExpected: true,
        sourceMode: overview.sourceMode || 'mock',
      },
    };
  }

  readinessCategory({ id, status, score, confidence, evidence = [], warnings = [] }) {
    return {
      id,
      status,
      score: Number(Math.max(0, Math.min(score, 1)).toFixed(2)),
      confidence,
      evidence,
      warnings,
    };
  }

  catalogReadiness({ products, productCount }) {
    const fields = {
      sku: ['sku', 'SKU'],
      category: ['category', 'categoryName', 'category_name'],
      price: ['priceAED', 'price_aed', 'price', 'salePrice', 'sale_price'],
      stock: ['stock', 'stockQty', 'stock_qty', 'inventory', 'quantity'],
      image: ['image', 'imageUrl', 'image_url', 'thumbnail', 'photos'],
      description: ['description', 'descriptionEn', 'description_en'],
      seoTitle: ['seoTitle', 'seo_title', 'metaTitle', 'meta_title'],
      seoDescription: ['seoDescription', 'seo_description', 'metaDescription', 'meta_description'],
      supplier: ['supplier', 'supplierName', 'supplier_name', 'source'],
      complianceStatus: ['complianceStatus', 'compliance_status', 'foodComplianceStatus', 'food_compliance_status'],
    };
    const unavailableFields = [];
    const missing = {};
    Object.entries(fields).forEach(([field, keys]) => {
      const available = products.some((product) => firstPresent(product, keys));
      if (!available) {
        unavailableFields.push(field);
        missing[field] = null;
        return;
      }
      missing[field] = products.filter((product) => isMissing(product[firstPresent(product, keys)])).length;
    });
    const priceKeyRows = products.filter((product) => firstPresent(product, fields.price));
    const stockKeyRows = products.filter((product) => firstPresent(product, fields.stock));
    const suspiciousPriceCount = priceKeyRows.filter((product) => !isPositiveNumber(product[firstPresent(product, fields.price)])).length;
    const zeroOrLowStockCount = stockKeyRows.filter((product) => Number(product[firstPresent(product, fields.stock)]) <= 0).length;
    const availableChecks = Object.entries(missing).filter(([, value]) => value !== null);
    const missingCount = availableChecks.reduce((sum, [, value]) => sum + Number(value || 0), 0);
    const possibleChecks = Math.max(1, availableChecks.length * Math.max(products.length, 1));
    const completeness = productCount > 0
      ? Math.max(0, 1 - (missingCount / possibleChecks))
      : 0;
    const score = productCount > 0 ? Math.min(0.95, completeness * 0.85 + 0.1) : 0;
    return {
      ...this.readinessCategory({
      id: 'catalogReadiness',
      status: productCount > 0 ? missingCount ? 'needs_work' : 'partial' : 'not_ready',
      score,
      confidence: productCount > 0 ? products.length ? 'medium' : 'low' : 'low',
      evidence: [
        `${productCount} product row(s) readable.`,
        products.length ? `${products.length} product row(s) sampled for field quality.` : 'No product sample available for field quality checks.',
      ],
      warnings: [
        ...unavailableFields.map((field) => `${field} field unavailable in readable product data.`),
        suspiciousPriceCount ? `${suspiciousPriceCount} sampled product(s) have missing/suspicious price.` : null,
        zeroOrLowStockCount ? `${zeroOrLowStockCount} sampled product(s) have zero or low stock.` : null,
      ].filter(Boolean),
      }),
      productCount,
      sampledProductCount: products.length,
      missingFields: missing,
      unavailableFields,
      suspiciousPriceCount,
      zeroOrLowStockCount,
    };
  }

  inventoryReadiness({ products, productCount, lowStockProducts }) {
    const stockFields = ['stock', 'stockQty', 'stock_qty', 'inventory', 'quantity'];
    const rowsWithStock = products.filter((product) => firstPresent(product, stockFields));
    const zeroOrLowStockCount = rowsWithStock.filter((product) => Number(product[firstPresent(product, stockFields)]) <= 0).length;
    if (!productCount) {
      return this.readinessCategory({
        id: 'inventoryReadiness',
        status: 'not_ready',
        score: 0,
        confidence: 'low',
        warnings: ['No readable product rows for inventory readiness.'],
      });
    }
    if (!rowsWithStock.length) {
      return this.readinessCategory({
        id: 'inventoryReadiness',
        status: 'unknown',
        score: 0.25,
        confidence: 'low',
        warnings: ['Stock/inventory field is unavailable in readable product data.'],
      });
    }
    const riskCount = Math.max(Number(lowStockProducts || 0), zeroOrLowStockCount);
    return this.readinessCategory({
      id: 'inventoryReadiness',
      status: riskCount ? 'needs_work' : 'partial',
      score: Math.max(0.2, 0.85 - (riskCount / Math.max(productCount, 1))),
      confidence: 'medium',
      evidence: [`${rowsWithStock.length} sampled product row(s) include stock evidence.`],
      warnings: riskCount ? [`${riskCount} product(s) show low/zero stock risk in available evidence.`] : [],
    });
  }

  launchReadinessStatus(score, confidence) {
    if (confidence === 'low' && score < 80) return score >= 60 ? 'launch_rehearsal_ready' : 'needs_work';
    if (score >= 90) return 'launch_ready';
    if (score >= 78) return 'soft_launch_ready';
    if (score >= 60) return 'launch_rehearsal_ready';
    if (score >= 35) return 'needs_work';
    return 'not_ready';
  }

  launchRisks(categories) {
    const risks = [];
    if (!categories.productCount) risks.push({ id: 'no_products_readable', severity: 'high', title: 'No readable products for launch catalog.' });
    if (categories.catalogReadiness.warnings.length) risks.push({ id: 'catalog_gaps', severity: 'medium', title: 'Catalog fields need launch review.' });
    if (categories.paymentReadiness.status === 'unknown') risks.push({ id: 'payment_unknown', severity: categories.daysToLaunch !== null && categories.daysToLaunch <= 45 ? 'high' : 'medium', title: 'Payment test readiness is unknown.' });
    if (categories.fulfillmentReadiness.status === 'unknown') risks.push({ id: 'fulfillment_unknown', severity: categories.daysToLaunch !== null && categories.daysToLaunch <= 45 ? 'high' : 'medium', title: 'Fulfillment rehearsal readiness is unknown.' });
    if (categories.complianceReadiness.status === 'unknown') risks.push({ id: 'compliance_unknown', severity: 'high', title: 'Food/import compliance evidence is unavailable.' });
    if (categories.marketingReadiness.status === 'unknown') risks.push({ id: 'marketing_unknown', severity: 'medium', title: 'SEO/launch campaign readiness is not fully evidenced.' });
    return risks;
  }

  launchActions({ productCount, catalogReadiness, daysToLaunch }) {
    return unique([
      productCount ? `Complete product data quality review for ${productCount} readable product(s).` : 'Load or expose readable product catalog before launch review.',
      'Identify top 20 launch products.',
      'Confirm stock and supplier availability.',
      'Confirm price and margin for launch products.',
      'Review food/import compliance status for imported products.',
      'Run payment method test.',
      'Run internal fulfillment test order.',
      'Prepare B2B outreach list.',
      'Prepare launch offer/campaign.',
      'Confirm courier SLA, refund policy, and Arabic/legal placeholders before public launch.',
      daysToLaunch !== null && daysToLaunch <= 14 ? 'Run final launch rehearsal this week.' : null,
      ...(catalogReadiness.warnings || []).slice(0, 3),
    ]).map((title, index) => ({
      id: `launch-action-${index + 1}`,
      title,
      reviewOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
    }));
  }

  buildPreLaunchUrgentActions({ daysToLaunch, preLaunch }) {
    const risks = asArray(preLaunch?.launchRisks);
    const urgent = risks
      .filter((risk) => ['critical', 'high'].includes(risk.severity))
      .map((risk) => ({
        id: risk.id,
        title: risk.title,
        severity: risk.severity,
        recommendedAction: this.recommendLaunchActionForRisk(risk.id),
        approvalRequired: false,
        writesBlocked: true,
        preLaunchOnly: true,
      }));
    if (daysToLaunch !== null && daysToLaunch <= 14 && preLaunch?.launchReadinessStatus !== 'launch_ready') {
      urgent.unshift({
        id: 'launch_countdown_near',
        title: 'Launch date is near and readiness is not launch_ready.',
        severity: 'critical',
        recommendedAction: 'Run launch rehearsal and resolve high launch risks before public launch.',
        approvalRequired: false,
        writesBlocked: true,
        preLaunchOnly: true,
      });
    }
    return urgent.slice(0, 8);
  }

  recommendLaunchActionForRisk(riskId) {
    const actions = {
      no_products_readable: 'Expose or import readable product catalog before launch review.',
      catalog_gaps: 'Complete product data quality review for launch products.',
      payment_unknown: 'Run and record an internal payment method test.',
      fulfillment_unknown: 'Run and record an internal fulfillment rehearsal.',
      compliance_unknown: 'Review food/import compliance evidence before public launch.',
      marketing_unknown: 'Prepare launch offer, SEO metadata, and legal/Arabic placeholders.',
    };
    return actions[riskId] || 'Review launch risk manually; no automated action is enabled.';
  }

  buildDataQuality({ overview, counts, flowSummary, missingData, operatingStage = 'live' }) {
    const tableAvailability = overview.dataFreshness?.tableAvailability || {};
    const availableTables = Object.entries(tableAvailability)
      .filter(([, value]) => String(value).includes('available'))
      .map(([key]) => key);
    const hasOperationalRows = [
      counts.productsCount,
      counts.b2bLeadCount,
      counts.quoteCount,
      counts.orderCount,
      counts.customerCount,
      counts.paymentCount,
      counts.fulfillmentCount,
    ].some((value) => Number(value) > 0);
    const status = overview.sourceMode === 'real_read_only' && hasOperationalRows
      ? missingData.length ? 'usable_with_gaps' : 'usable'
      : hasOperationalRows ? 'partial' : 'missing_or_mock';
    return {
      status,
      sourceMode: overview.sourceMode || 'mock',
      dataSource: overview.dataSource || 'unknown',
      piiMasked: overview.piiMasked !== false,
      availableTables,
      tableAvailability,
      flowsWithData: flowSummary.flowsWithData || [],
      flowsMissingData: flowSummary.flowsMissingData || [],
      missingDataCount: missingData.length,
      warnings: this.filterWarningsForStage(overview.warnings || [], operatingStage),
    };
  }

  buildExecutiveSummary({ overview, counts, anomalies, missingData, operatingStage = 'live', preLaunch = null }) {
    const source = overview.sourceMode || 'mock';
    if (operatingStage === 'pre_launch') {
      const productCount = preLaunch?.catalogReadiness?.productCount || counts.productsCount || 0;
      return `Pre-launch founder review for CornerMex generated in ${source} mode with ${productCount} readable product row(s), launch readiness ${preLaunch?.launchReadinessStatus || 'unknown'} (${preLaunch?.launchReadinessScore ?? 'unknown'}), and ${missingData.length} launch data gap(s).`;
    }
    const totalRows = [
      counts.productsCount,
      counts.b2bLeadCount,
      counts.quoteCount,
      counts.orderCount,
      counts.customerCount,
      counts.paymentCount,
      counts.fulfillmentCount,
    ].reduce((sum, value) => sum + Number(value || 0), 0);
    if (!totalRows) {
      return `Founder review generated in ${source} mode with no confirmed operational rows; complete the missing data checklist before treating it as live operating truth.`;
    }
    return `Founder review generated in ${source} mode from ${totalRows} read-only operational row(s), with ${anomalies.length} anomaly candidate(s) and ${missingData.length} data gap(s).`;
  }

  buildUrgentActions({ overview, anomalies, missingData }) {
    const alerts = anomalies.length ? asArray(overview.topOperationalAlerts).slice(0, 5).map((alert) => ({
      id: alert.id,
      title: alert.title,
      severity: alert.severity || 'low',
      recommendedAction: alert.recommendedAction,
      approvalRequired: true,
      writesBlocked: true,
    })) : [];
    const highSignal = matching(anomalies, ['payment', 'fulfillment', 'delayed']).slice(0, 5).map((anomaly) => ({
      id: anomaly.id,
      title: anomaly.title,
      severity: anomaly.severity || 'medium',
      recommendedAction: anomaly.suggestedAction,
      approvalRequired: true,
      writesBlocked: true,
    }));
    const dataGapAction = missingData.length ? [{
      id: 'missing-data-checklist',
      title: 'Complete missing operational data checklist',
      severity: 'medium',
      recommendedAction: 'Import or map the missing read-only operational datasets before using review output for decisions.',
      approvalRequired: false,
      writesBlocked: true,
    }] : [];
    return [...alerts, ...highSignal, ...dataGapAction].slice(0, 8);
  }

  buildRecommendedActions({ overview, counts, hasConfirmedOperationalRows, operatingStage, preLaunch, missingData }) {
    if (operatingStage === 'pre_launch') {
      return unique([
        ...(preLaunch?.launchActions || []).map((action) => action.title),
        missingData.length ? 'Close the missing launch data checklist before launch rehearsal.' : null,
        'Keep all launch actions review-only until an approval-gated execution sprint.',
      ]).slice(0, 12);
    }
    const liveActions = hasConfirmedOperationalRows ? [
      ...(overview.recommendedFounderActions || []),
      counts.pendingPaymentReviewCount ? 'Review manual payment candidates; never mark paid automatically.' : null,
      counts.fulfillmentDelayedCount ? 'Review fulfillment delay candidates and prepare internal task drafts.' : null,
      counts.quoteFollowUpCount ? 'Review quote follow-up candidates and prepare non-sendable drafts.' : null,
      counts.warmLeads ? 'Review warm B2B lead follow-ups and prepare local drafts only.' : null,
    ] : [];
    return unique([
      ...liveActions,
      missingData.length ? 'Close the missing-data checklist for a stronger daily founder loop.' : null,
      'Keep all recommended actions approval-gated and read-only in v1.6.',
    ]).slice(0, 10);
  }

  buildMissingDataChecklist({ counts, overview, flowSummary, operatingStage = 'live', preLaunch = null }) {
    const tableAvailability = overview.dataFreshness?.tableAvailability || {};
    const missing = [];
    const add = (id, label, reason, options = {}) => missing.push({
      id,
      label,
      reason,
      requiredForFounderLoop: options.requiredForFounderLoop !== false,
      priority: options.priority || 'required',
      preLaunchExpected: Boolean(options.preLaunchExpected),
    });
    if (operatingStage === 'pre_launch') {
      if (!counts.productsCount) add('products', 'Products', 'Primary launch catalog dataset is required for pre-launch review.', { priority: 'critical' });
      if (!counts.b2bLeadCount) add('b2b_leads', 'B2B leads', 'Needed for launch outreach readiness.', { priority: 'recommended' });
      if (preLaunch?.catalogReadiness?.unavailableFields?.length) {
        preLaunch.catalogReadiness.unavailableFields.forEach((field) => {
          add(`catalog_field_${field}`, field, `${field} is unavailable in readable product data.`, { priority: field === 'complianceStatus' ? 'critical' : 'recommended' });
        });
      }
      if (!counts.paymentCount) add('payment_test', 'Payment test evidence', 'Expected pre-launch gap; record internal payment test before launch.', { requiredForFounderLoop: false, priority: 'launch_rehearsal', preLaunchExpected: true });
      if (!counts.fulfillmentCount) add('fulfillment_rehearsal', 'Fulfillment rehearsal evidence', 'Expected pre-launch gap; record internal fulfillment rehearsal before launch.', { requiredForFounderLoop: false, priority: 'launch_rehearsal', preLaunchExpected: true });
      if (!counts.customerCount) add('customers', 'Customers', 'Missing live customers are expected before launch and should not be treated as a production failure.', { requiredForFounderLoop: false, priority: 'informational', preLaunchExpected: true });
      if (!counts.orderCount) add('orders', 'Orders', 'Missing live orders are expected before launch and should not be treated as a production failure.', { requiredForFounderLoop: false, priority: 'informational', preLaunchExpected: true });
      return unique(missing.map((item) => JSON.stringify(item))).map((item) => JSON.parse(item));
    }
    if (!counts.productsCount) add('products', 'Products', 'Needed for inventory risks and product quality review.');
    if (!counts.b2bLeadCount) add('b2b_leads', 'B2B leads', 'Needed for lead follow-up recommendations.');
    if (!counts.quoteCount) add('quotes', 'Quotes', 'Needed for quote follow-up recommendations.');
    if (!counts.orderCount) add('orders', 'Orders', 'Needed for order attention and fulfillment review.');
    if (!counts.customerCount) add('customers', 'Customers', 'Needed for customer follow-up context; PII must remain masked.');
    if (!counts.paymentCount) add('payments', 'Payments', 'Needed for manual payment review signals.');
    if (!counts.fulfillmentCount) add('fulfillment', 'Fulfillment', 'Needed for delivery delay detection.');
    Object.entries(tableAvailability).forEach(([table, status]) => {
      if (String(status).includes('missing')) add(`table_${table}`, table, `Read model table status is ${status}.`);
    });
    asArray(flowSummary.flowsMissingData).forEach((flowId) => {
      add(`flow_${flowId}`, FLOW_LABELS[flowId] || flowId, 'Flow has no usable candidate records.');
    });
    return unique(missing.map((item) => JSON.stringify(item))).map((item) => JSON.parse(item));
  }

  nextFounderStep({ sourceMode, operatingStage, preLaunch, missingData, urgentActions }) {
    if (operatingStage === 'pre_launch') {
      if (sourceMode !== 'real_read_only') {
        return 'Confirm Supabase read-only access so launch readiness can use real catalog data.';
      }
      if (preLaunch?.launchReadinessStatus === 'not_ready' || preLaunch?.launchReadinessStatus === 'needs_work') {
        return 'Resolve launch risks and run an internal payment plus fulfillment rehearsal before public launch.';
      }
      if (missingData.some((item) => item.priority === 'critical')) {
        return 'Complete critical launch data fields, then rerun npm run founder:review.';
      }
      return 'Use this pre-launch review as the launch readiness checklist until soft launch.';
    }
    if (sourceMode !== 'real_read_only') {
      return 'Confirm Supabase read-only credentials and public read model before treating the review as live.';
    }
    if (missingData.length) {
      return 'Import or map the missing operational datasets, then rerun npm run founder:review.';
    }
    if (urgentActions.length) {
      return 'Review urgent actions manually and create approval-gated internal cases where needed.';
    }
    return 'Use this review as the daily founder operating checklist; keep writes and sends disabled.';
  }
}

module.exports = { FounderReviewService };
