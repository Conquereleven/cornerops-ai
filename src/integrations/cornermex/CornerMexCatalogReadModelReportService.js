const { randomUUID } = require('crypto');
const {
  DEFAULT_READ_VIEW_TABLES,
  TABLE_AVAILABILITY,
} = require('./CornerMexSupabaseReadOnlyConfig');
const { classifyError, sanitizeErrorMessage } = require('./CornerMexSupabaseReadOnlyRepository');

const DEFAULT_CANDIDATE_SOURCES = Object.freeze([
  { id: 'cornerops_products_v', table: 'cornerops_products_v', type: 'read_model', contract: 'product' },
  { id: 'products', table: 'products', type: 'base_table', contract: 'product' },
  { id: 'product_translations', table: 'product_translations', type: 'translation_table', contract: 'product' },
  { id: 'product_variants', table: 'product_variants', type: 'variant_table', contract: 'product' },
  { id: 'catalog_events', table: 'catalog_events', type: 'catalog_event_table', contract: 'product' },
  { id: 'import_batches', table: 'import_batches', type: 'import_metadata_table', contract: 'catalog_import' },
  { id: 'product_imports', table: 'product_imports', type: 'import_table', contract: 'product' },
  { id: 'catalog_imports', table: 'catalog_imports', type: 'import_table', contract: 'product' },
]);

const PRODUCT_FIELD_ALIASES = Object.freeze({
  price: ['price', 'price_aed', 'priceAED', 'sale_price', 'salePrice', 'unit_price', 'unitPrice'],
  stock: ['stock', 'stock_qty', 'stockQty', 'inventory', 'quantity', 'available_quantity'],
  image: ['image', 'image_url', 'imageUrl', 'thumbnail', 'thumbnail_url', 'photo_url', 'photos'],
  status: ['status', 'product_status', 'catalog_status'],
  active: ['active', 'is_active', 'enabled'],
  published: ['published', 'is_published', 'visible', 'is_visible'],
  productId: ['product_id', 'productId', 'id'],
});

const nowIso = () => new Date().toISOString();
const reportId = () => `catalog-read-report-${randomUUID().slice(0, 12)}`;
const auditId = () => `audit-catalog-read-report-${randomUUID().slice(0, 12)}`;
const asArray = (value) => (Array.isArray(value) ? value : []);
const unique = (items) => [...new Set(items.filter(Boolean))];
const hasOwn = (row, key) => Object.prototype.hasOwnProperty.call(row || {}, key);
const firstPresent = (row, keys) => keys.find((key) => hasOwn(row, key));
const missingValue = (value) => value === undefined || value === null || value === '';

const withTimeout = async (promise, timeoutMs) => {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(Object.assign(new Error('read_timeout'), { code: 'READ_TIMEOUT' })), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
};

const countBy = (rows, getter) => rows.reduce((counts, row) => {
  const value = getter(row);
  if (value === undefined || value === null || value === '') return counts;
  const key = String(value).toLowerCase();
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

class CornerMexCatalogReadModelReportService {
  constructor({
    auditLogService,
    client,
    config = {},
    configSummary,
    repository,
  } = {}) {
    this.auditLogService = auditLogService;
    this.client = client;
    this.config = config;
    this.configSummary = configSummary;
    this.repository = repository;
  }

  async buildReport(context = {}) {
    const validation = this.configSummary?.validate?.() || {};
    const readiness = this.repository?.checkReadiness
      ? await this.repository.checkReadiness({ ...context, operation: 'catalog_read_model_report_readiness' })
      : null;
    const expectedFounderProductCount = Number(this.config.cornermexExpectedProductCount || 0) || null;
    const candidates = this.candidateSources(validation);
    const sourceReports = [];
    for (const source of candidates) {
      sourceReports.push(await this.inspectSource(source, validation));
    }
    const primaryReadModel = sourceReports.find((source) => source.table === DEFAULT_READ_VIEW_TABLES.products)
      || sourceReports.find((source) => source.table === 'cornerops_products_v')
      || null;
    const baseProductSource = sourceReports.find((source) => source.table === 'products') || null;
    const readableProducts = this.bestCount(primaryReadModel, readiness?.rowCounts?.products);
    const discoveredCatalogItems = this.discoveredCatalogItems(sourceReports);
    const productCountMismatch = Boolean(
      expectedFounderProductCount
      && Number.isFinite(readableProducts)
      && readableProducts !== expectedFounderProductCount,
    );
    const likelyMismatchReason = this.likelyMismatchReason({
      baseProductSource,
      discoveredCatalogItems,
      expectedFounderProductCount,
      primaryReadModel,
      productCountMismatch,
      readableProducts,
      sourceReports,
    });
    const output = {
      report: 'cornermex_catalog_read_model_v1.6.2',
      status: 'success',
      generatedAt: nowIso(),
      reportId: reportId(),
      sourceMode: readiness?.sourceMode || validation.sourceMode || 'repo_discovered',
      dataSource: readiness?.sourceMode?.startsWith('real_read_only') ? 'cornermex_supabase_read_replica' : 'unavailable',
      readOnly: true,
      writesBlocked: true,
      externalSendsBlocked: true,
      piiMasked: validation.readOnlyFlags?.maskingApplied !== false,
      serviceRoleUsed: false,
      expectedFounderProductCount,
      readableProducts,
      discoveredCatalogItems,
      productCountMismatch,
      productCountMismatchWarning: productCountMismatch
        ? `Founder expectation is ${expectedFounderProductCount} product(s), but the current readable product read model exposes ${readableProducts} product row(s).`
        : null,
      sourceSummary: {
        primaryReadModel: this.publicSourceSummary(primaryReadModel),
        baseProductSource: this.publicSourceSummary(baseProductSource),
        availableSources: sourceReports
          .filter((source) => source.available)
          .map((source) => this.publicSourceSummary(source)),
        unavailableSources: sourceReports
          .filter((source) => !source.available)
          .map((source) => this.publicSourceSummary(source)),
      },
      sources: sourceReports.map((source) => this.publicSourceSummary(source, { includeStats: true })),
      likelyMismatchReason,
      recommendedFix: this.recommendedFix({
        baseProductSource,
        discoveredCatalogItems,
        expectedFounderProductCount,
        primaryReadModel,
        productCountMismatch,
        readableProducts,
      }),
      safety: {
        readOnly: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        destructiveSqlExecuted: false,
        serviceRoleUsed: false,
        secretsPrinted: false,
        piiMasked: validation.readOnlyFlags?.maskingApplied !== false,
      },
      auditId: await this.audit(context, {
        readableProducts,
        expectedFounderProductCount,
        productCountMismatch,
        availableSourceCount: sourceReports.filter((source) => source.available).length,
      }),
      warnings: unique([
        ...(validation.warnings || []),
        ...(readiness?.warnings || []),
        productCountMismatch ? 'Catalog read model mismatch remains unresolved; launch readiness must stay partial.' : null,
      ]),
    };
    return output;
  }

  candidateSources(validation = {}) {
    const configuredProducts = [
      validation.tableMappings?.products,
      ...(validation.tableMappingCandidates?.products || []),
    ];
    const configured = unique(configuredProducts)
      .map((table) => ({ id: table, table, type: 'configured_product_source', contract: 'product' }));
    const defaults = DEFAULT_CANDIDATE_SOURCES;
    const byTable = new Map();
    [...configured, ...defaults].forEach((source) => {
      if (!source?.table || byTable.has(source.table)) return;
      byTable.set(source.table, source);
    });
    return [...byTable.values()];
  }

  async inspectSource(source, validation = {}) {
    const timeoutMs = validation.limits?.requestTimeoutMs || 8000;
    if (!this.client?.countRows || !this.client?.selectRows) {
      return this.unavailableSource(source, TABLE_AVAILABILITY.CONFIG_MISSING, 'Supabase read-only client is not configured.');
    }
    const countResult = await this.safeCount(source, timeoutMs);
    if (!countResult.available) return { ...countResult, sample: this.emptySample() };
    const sampleLimit = Math.max(1, Math.min(validation.limits?.maxRows || 50, 100));
    const sample = await this.safeSample(source, sampleLimit, timeoutMs);
    if (
      countResult.exactRowCount === 0
      && [
        TABLE_AVAILABILITY.MISSING_TABLE,
        TABLE_AVAILABILITY.RLS_BLOCKED,
        TABLE_AVAILABILITY.TIMEOUT,
        TABLE_AVAILABILITY.ERROR_SANITIZED,
      ].includes(sample.availability)
    ) {
      return {
        ...countResult,
        available: false,
        availability: sample.availability,
        exactRowCount: null,
        countMethod: 'count_head_unconfirmed',
        warning: sample.warning || countResult.warning,
        sample,
        fieldStats: this.fieldStats([]),
      };
    }
    return {
      ...countResult,
      sample,
      fieldStats: this.fieldStats(sample.rows),
    };
  }

  async safeCount(source, timeoutMs) {
    try {
      const response = await withTimeout(this.client.countRows({ table: source.table }), timeoutMs);
      if (response.error) {
        return this.unavailableSource(source, classifyError(response.error), sanitizeErrorMessage(response.error));
      }
      const rowCount = Number(response.count);
      return {
        ...source,
        available: true,
        availability: Number(rowCount) > 0 ? TABLE_AVAILABILITY.AVAILABLE_MASKED : TABLE_AVAILABILITY.AVAILABLE_EMPTY,
        exactRowCount: Number.isFinite(rowCount) ? rowCount : null,
        countMethod: 'supabase_count_head_exact',
        warning: null,
      };
    } catch (error) {
      return this.unavailableSource(source, classifyError(error), sanitizeErrorMessage(error));
    }
  }

  async safeSample(source, limit, timeoutMs) {
    try {
      const response = await withTimeout(this.client.selectRows({ table: source.table, limit }), timeoutMs);
      if (response.error) {
        return {
          ...this.emptySample(),
          availability: classifyError(response.error),
          warning: sanitizeErrorMessage(response.error),
        };
      }
      const rows = asArray(response.data).slice(0, limit);
      return {
        rowCount: rows.length,
        rows,
        limit,
        truncated: rows.length >= limit,
        availability: rows.length ? TABLE_AVAILABILITY.AVAILABLE_MASKED : TABLE_AVAILABILITY.AVAILABLE_EMPTY,
        warning: null,
      };
    } catch (error) {
      return {
        ...this.emptySample(),
        availability: classifyError(error),
        warning: sanitizeErrorMessage(error),
      };
    }
  }

  unavailableSource(source, availability, warning) {
    return {
      ...source,
      available: false,
      availability,
      exactRowCount: null,
      countMethod: 'unavailable',
      warning,
    };
  }

  emptySample() {
    return {
      rowCount: 0,
      rows: [],
      limit: 0,
      truncated: false,
      availability: TABLE_AVAILABILITY.CONFIG_MISSING,
      warning: null,
    };
  }

  fieldStats(rows = []) {
    const sampledRowCount = rows.length;
    const fieldAvailability = Object.fromEntries(Object.entries(PRODUCT_FIELD_ALIASES).map(([field, aliases]) => [
      field,
      rows.some((row) => firstPresent(row, aliases)),
    ]));
    const missingCounts = Object.fromEntries(['price', 'stock', 'image'].map((field) => {
      const aliases = PRODUCT_FIELD_ALIASES[field];
      const availableRows = rows.filter((row) => firstPresent(row, aliases));
      if (!availableRows.length) return [field, null];
      return [field, availableRows.filter((row) => missingValue(row[firstPresent(row, aliases)])).length];
    }));
    const statusCounts = countBy(rows, (row) => {
      const statusKey = firstPresent(row, PRODUCT_FIELD_ALIASES.status);
      if (statusKey) return row[statusKey];
      const activeKey = firstPresent(row, PRODUCT_FIELD_ALIASES.active);
      if (activeKey) return row[activeKey] ? 'active' : 'inactive';
      const publishedKey = firstPresent(row, PRODUCT_FIELD_ALIASES.published);
      if (publishedKey) return row[publishedKey] ? 'published' : 'draft';
      return null;
    });
    const productIdKeyRows = rows.filter((row) => firstPresent(row, PRODUCT_FIELD_ALIASES.productId));
    const distinctProductIdsInSample = new Set(
      productIdKeyRows.map((row) => String(row[firstPresent(row, PRODUCT_FIELD_ALIASES.productId)])),
    ).size;
    return {
      sampledRowCount,
      fieldAvailability,
      statusCounts,
      qualityCounts: {
        sampledMissingPrice: missingCounts.price,
        sampledMissingStock: missingCounts.stock,
        sampledMissingImage: missingCounts.image,
      },
      distinctProductIdsInSample,
      distinctProductIdsExact: false,
    };
  }

  bestCount(source, fallback) {
    const sourceCount = Number(source?.exactRowCount);
    if (Number.isFinite(sourceCount)) return sourceCount;
    const fallbackCount = Number(fallback);
    return Number.isFinite(fallbackCount) ? fallbackCount : 0;
  }

  discoveredCatalogItems(sourceReports) {
    const productLikeCounts = sourceReports
      .filter((source) => source.contract === 'product' && Number.isFinite(Number(source.exactRowCount)))
      .map((source) => Number(source.exactRowCount));
    if (!productLikeCounts.length) return null;
    return Math.max(...productLikeCounts);
  }

  publicSourceSummary(source, { includeStats = false } = {}) {
    if (!source) return null;
    const summary = {
      id: source.id,
      table: source.table,
      type: source.type,
      contract: source.contract,
      availability: source.availability,
      available: Boolean(source.available),
      exactRowCount: source.exactRowCount,
      countMethod: source.countMethod,
      warning: source.warning || source.sample?.warning || null,
    };
    if (includeStats) {
      summary.sample = {
        sampledRowCount: source.sample?.rowCount || 0,
        sampleLimit: source.sample?.limit || 0,
        truncated: Boolean(source.sample?.truncated),
      };
      summary.fieldStats = source.fieldStats || this.emptyFieldStats();
    }
    return summary;
  }

  emptyFieldStats() {
    return {
      sampledRowCount: 0,
      fieldAvailability: {},
      statusCounts: {},
      qualityCounts: {
        sampledMissingPrice: null,
        sampledMissingStock: null,
        sampledMissingImage: null,
      },
      distinctProductIdsInSample: 0,
      distinctProductIdsExact: false,
    };
  }

  likelyMismatchReason({
    baseProductSource,
    discoveredCatalogItems,
    expectedFounderProductCount,
    primaryReadModel,
    productCountMismatch,
    readableProducts,
    sourceReports,
  }) {
    if (!productCountMismatch) {
      return expectedFounderProductCount
        ? 'Current readable product count matches the configured founder expectation.'
        : 'No expected founder product count is configured, so mismatch severity is informational.';
    }
    const largerSource = sourceReports.find((source) => Number(source.exactRowCount) >= expectedFounderProductCount);
    if (largerSource) {
      return `Product rows appear to exist in ${largerSource.table}, but the primary read model exposes ${readableProducts}. Update the reviewed read model mapping after manual schema review.`;
    }
    if (baseProductSource?.available && Number(baseProductSource.exactRowCount) === readableProducts) {
      return `The public read model and base products source both expose ${readableProducts} product row(s); the remaining expected catalog may be in another source, not imported, filtered by status/RLS, or static in Lovable.`;
    }
    if (discoveredCatalogItems && discoveredCatalogItems > readableProducts) {
      return `A product-related source exposes more rows (${discoveredCatalogItems}) than the primary read model (${readableProducts}); confirm whether those rows are products, variants, translations, or imports before changing launch readiness.`;
    }
    if (primaryReadModel?.available) {
      return `The current primary read model ${primaryReadModel.table} is readable but exposes only ${readableProducts} product row(s); no read-only visible source confirms ${expectedFounderProductCount} products yet.`;
    }
    return 'The primary product read model is unavailable; verify table/view exposure, grants, and RLS for anon/publishable read-only access.';
  }

  recommendedFix({
    baseProductSource,
    discoveredCatalogItems,
    expectedFounderProductCount,
    primaryReadModel,
    productCountMismatch,
    readableProducts,
  }) {
    if (!productCountMismatch) {
      return 'Keep current read model and continue launch readiness review with reconciled catalog count.';
    }
    if (baseProductSource?.available && Number(baseProductSource.exactRowCount) > readableProducts) {
      return 'Manually review products table filters/status fields and update cornerops_products_v only after confirming the intended launch catalog rows.';
    }
    if (discoveredCatalogItems && expectedFounderProductCount && discoveredCatalogItems >= expectedFounderProductCount) {
      return 'Map the larger product-related source into a reviewed read-only product view after confirming it represents unique launch products.';
    }
    if (primaryReadModel?.available) {
      return 'Founder should verify where the remaining products live: Supabase base table, import table, variant/translation tables, or Lovable static catalog. Keep launch readiness partial until reconciled.';
    }
    return 'Review Supabase Data API exposure, SELECT grants, and RLS for the product read model before treating catalog readiness as real.';
  }

  async audit(context, details) {
    const event = await this.auditLogService?.record?.({
      ...context,
      eventType: 'cornermex_catalog_read_model_report',
      dataSource: 'cornermex_supabase',
      operation: 'catalog_read_model_report',
      policyDecision: 'allowed_read_only',
      status: 'success',
      input: details,
    });
    return event?.id || auditId();
  }
}

module.exports = {
  CornerMexCatalogReadModelReportService,
  DEFAULT_CATALOG_CANDIDATE_SOURCES: DEFAULT_CANDIDATE_SOURCES,
};
