class LiveControlTowerStatusService {
  constructor({
    actionEngine,
    capabilityMatrixService,
    catalogCohortService,
    environmentDoctorService,
    founderReviewService,
    operatingStageEngine,
    productActivationEngine,
    config = {},
  } = {}) {
    this.actionEngine = actionEngine;
    this.capabilityMatrixService = capabilityMatrixService;
    this.catalogCohortService = catalogCohortService;
    this.environmentDoctorService = environmentDoctorService;
    this.founderReviewService = founderReviewService;
    this.operatingStageEngine = operatingStageEngine;
    this.productActivationEngine = productActivationEngine;
    this.config = config;
  }

  async build({ requestId = 'live-control-tower-status-v1.8', userId = 'control-tower', channel = 'api' } = {}) {
    const context = { requestId, userId, channel };
    const [catalog, founderReview, actionEngine, productActivation, environmentDoctor] = await Promise.all([
      this.catalogCohortService.buildCohort(context),
      this.founderReviewService.buildFounderReview({
        requestId: `${requestId}-founder-review`,
        userId,
        channel,
      }),
      this.actionEngine.build(context),
      this.productActivationEngine.buildPlan(context),
      Promise.resolve(this.environmentDoctorService.check()),
    ]);
    const connectors = this.connectors({ catalog, environmentDoctor });
    const capabilityMatrix = this.capabilityMatrixService.build({ actionEngine, connectors });
    const operatingStage = this.operatingStageEngine.build({ actionEngine, catalog, founderReview });
    return {
      mode: catalog.sourceMode === 'real_read_only' || catalog.sourceMode === 'real_read_only_partial'
        ? 'real_read_only'
        : catalog.sourceMode || 'not_configured',
      source: catalog.dataSource || 'cornermex_supabase',
      fallbackActive: false,
      generatedAt: new Date().toISOString(),
      safety: {
        writesBlocked: true,
        externalSendsBlocked: true,
        customerChannelsDisabled: true,
        piiMasking: true,
        productActivationBlocked: true,
      },
      connectors,
      catalog: {
        totalReadableProducts: catalog.totalReadableProducts,
        existingActiveProducts: catalog.existingActiveProducts,
        importedIntermexDraftProducts: catalog.importedIntermexDraftProducts,
        expectedImportedProductCount: catalog.expectedImportedProductCount,
        importedCatalogReconciled: catalog.importedCatalogReconciled,
        productsWithPrice: catalog.productsWithPrice,
        productsWithImage: catalog.productsWithImage,
        productsWithStock50: catalog.productsWithStock50,
        missingImageCount: catalog.missingImageCount,
        duplicateSkuCount: catalog.duplicateSkuCount,
        stock50ConfirmedForImported: catalog.stock50ConfirmedForImported,
        fieldAvailability: catalog.fieldAvailability,
        warnings: catalog.warnings,
      },
      founderReview: {
        status: founderReview.launchReadinessStatus || founderReview.status || 'needs_work',
        operatingStage: founderReview.operatingStage || operatingStage.operatingStage,
        launchDate: founderReview.launchDate || this.config.launchDate || null,
        daysToLaunch: founderReview.daysToLaunch ?? null,
        readinessScore: founderReview.launchReadinessScore ?? null,
        topRisks: (founderReview.launchRisks || []).slice(0, 5),
        nextActions: (founderReview.launchActions || founderReview.recommendedActions || []).slice(0, 8),
        auditId: founderReview.auditId,
      },
      capabilities: capabilityMatrix.summary,
      capabilityMatrix,
      actionEngine,
      productActivation,
      operatingStage: operatingStage.operatingStage,
      stageWorkflows: operatingStage.stageWorkflows,
      nextStageUnlocks: operatingStage.nextStageUnlocks,
      launchReadiness: operatingStage.launchReadiness,
      workflowCoverage: operatingStage.workflowCoverage,
      environmentDoctor,
      warnings: [
        ...(catalog.warnings || []),
        ...(actionEngine.warnings || []),
        ...(founderReview.warnings || []),
      ],
    };
  }

  connectors({ catalog, environmentDoctor }) {
    const telegramConfigured = (this.config.telegramOperatorAllowedChatIds || []).length > 0
      && (this.config.telegramOperatorAllowedUserIds || []).length > 0;
    return {
      cornermexSupabase: {
        status: catalog.sourceMode === 'real_read_only' || catalog.sourceMode === 'real_read_only_partial'
          ? 'connected'
          : 'not_configured',
        mode: 'read_only',
        reason: catalog.sourceMode === 'real_read_only' || catalog.sourceMode === 'real_read_only_partial'
          ? null
          : 'Supabase real read-only connector is not fully configured.',
      },
      github: {
        status: this.config.githubReadOnly === false ? 'not_configured' : 'read_only',
        mode: 'read_only',
      },
      openclaw: {
        status: this.config.openclawEnabled ? 'blocked_by_safety' : 'disabled',
        mode: 'not_configured',
      },
      telegram: {
        status: telegramConfigured ? 'active' : 'not_configured',
        mode: this.config.telegramOperatorMode || 'polling',
        reason: telegramConfigured ? null : 'Founder Telegram allowlist or bot config is missing.',
      },
      environment: {
        status: environmentDoctor.overallStatus,
      },
    };
  }
}

module.exports = { LiveControlTowerStatusService };
