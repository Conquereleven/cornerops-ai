const categoryBucket = (category = '') => {
  const value = String(category || '').toLowerCase();
  if (/snack|salsa|sauce|chile|tajin|valentina|pulparindo|candy|sweet/.test(value)) return 'batch_2_snacks_salsas';
  if (/beverage|drink|jarrito|clamato|horchata|jamaica/.test(value)) return 'batch_3_beverages';
  if (/bulk|b2b|tortilla|chorizo|restaurant|wholesale/.test(value)) return 'batch_4_bulk_b2b';
  return 'batch_1_safe_launch';
};

class ProductActivationEngine {
  constructor({ catalogCohortService } = {}) {
    this.catalogCohortService = catalogCohortService;
  }

  async buildPlan(context = {}) {
    const catalog = await this.catalogCohortService.buildCohort(context);
    const draftProducts = (catalog.products || []).filter((product) => product.active === false);
    const classifications = draftProducts.map((product) => this.classify(product, catalog));
    const byStatus = (status) => classifications.filter((item) => item.status === status);
    const recommendedBatches = this.buildBatches(classifications);
    return {
      sourceMode: catalog.sourceMode,
      dataSource: catalog.dataSource,
      generatedAt: new Date().toISOString(),
      totalDraftProducts: catalog.importedIntermexDraftProducts,
      readyToActivate: byStatus('ready_to_activate').length,
      needsReview: classifications.filter((item) => item.status !== 'ready_to_activate').length,
      missingImages: catalog.missingImageCount,
      missingCategories: classifications.filter((item) => item.reasons.includes('missing_category')).length,
      marginUnknown: classifications.length,
      recommendedBatches,
      nextActions: [
        catalog.missingImageCount === null
          ? 'Expose image_url in the read-only product view before final image QA.'
          : catalog.missingImageCount > 0 ? `Review ${catalog.missingImageCount} product(s) missing image.` : null,
        'Select the first 30 launch-ready draft products for founder review.',
        'Confirm margin and supplier availability before any activation.',
        'Keep activation blocked until founder approval and write workflow exist.',
      ].filter(Boolean),
      classifications: classifications.slice(0, 100),
      safety: {
        readOnly: true,
        writesBlocked: true,
        productActivationBlocked: true,
        externalSendsBlocked: true,
      },
      warnings: [
        ...(catalog.warnings || []),
        'Product Activation Engine returns recommendations only; it never activates products.',
      ],
    };
  }

  classify(product, catalog = {}) {
    const reasons = [];
    if (!product.imageAvailable && catalog.fieldAvailability?.image) reasons.push('needs_image');
    if (!product.category) reasons.push('missing_category');
    if (product.priceAED === null || product.priceAED === undefined || product.priceAED === '') reasons.push('missing_price');
    reasons.push('needs_margin_review', 'needs_supplier_confirmation');
    const status = reasons.some((reason) => ['needs_image', 'missing_category', 'missing_price'].includes(reason))
      ? 'needs_review'
      : 'ready_to_activate';
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      status,
      activationState: status === 'ready_to_activate' ? 'ready_to_activate' : 'do_not_launch_yet',
      reasons,
      recommendedBatch: status === 'ready_to_activate' ? categoryBucket(product.category) : 'batch_5_needs_review',
      writeBlocked: true,
    };
  }

  buildBatches(classifications) {
    const grouped = classifications.reduce((acc, item) => {
      const key = item.recommendedBatch || 'batch_5_needs_review';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    return [
      ['batch_1_safe_launch', 'Safe launch candidates'],
      ['batch_2_snacks_salsas', 'Snacks and salsas'],
      ['batch_3_beverages', 'Beverages'],
      ['batch_4_bulk_b2b', 'Bulk B2B'],
      ['batch_5_needs_review', 'Needs review'],
    ].map(([id, label]) => ({
      id,
      label,
      count: (grouped[id] || []).length,
      sampleSkus: (grouped[id] || []).slice(0, 10).map((item) => item.sku).filter(Boolean),
      activationBlocked: true,
    }));
  }
}

module.exports = { ProductActivationEngine };
