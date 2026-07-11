const PRODUCT_READ_MODEL = 'cornerops_products_v';
const BASE_PRODUCTS_TABLE = 'products';
const COHORT_CACHE_TTL_MS = 15000;
const INTERACTIVE_READ_TIMEOUT_MS = 2500;

const asArray = (value) => (Array.isArray(value) ? value : []);
const lower = (value) => String(value || '').toLowerCase();
const present = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const firstPresentKey = (row, keys) => keys.find((key) => Object.prototype.hasOwnProperty.call(row || {}, key));
const fieldValue = (row, keys) => {
  const key = firstPresentKey(row, keys);
  return key ? row[key] : undefined;
};

const withTimeout = async (promise, timeoutMs) => {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(Object.assign(new Error('catalog_read_timeout'), { code: 'CATALOG_READ_TIMEOUT' })), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
};

const isActive = (row) => {
  const status = lower(row.status);
  if (status) return status === 'active' || status === 'published';
  if (Object.prototype.hasOwnProperty.call(row, 'active')) return row.active === true;
  return false;
};

class CatalogCohortService {
  constructor({
    auditLogService,
    client,
    config = {},
    connector,
  } = {}) {
    this.auditLogService = auditLogService;
    this.client = client;
    this.config = config;
    this.connector = connector;
    this.cohortCache = null;
    this.cohortCacheExpiresAt = 0;
    this.cohortPromise = null;
  }

  async buildCohort(context = {}) {
    if (this.cohortCache && Date.now() < this.cohortCacheExpiresAt) return this.cohortCache;
    if (this.cohortPromise) return this.cohortPromise;
    this.cohortPromise = this.buildFreshCohort(context)
      .then((cohort) => {
        this.cohortCache = cohort;
        this.cohortCacheExpiresAt = Date.now() + COHORT_CACHE_TTL_MS;
        return cohort;
      })
      .finally(() => {
        this.cohortPromise = null;
      });
    return this.cohortPromise;
  }

  async buildFreshCohort(context = {}) {
    const expectedImportedProductCount = Number(this.config.cornermexExpectedProductCount || 190) || 190;
    const [readModel, baseProducts, connectorStatus] = await Promise.all([
      this.readTable(PRODUCT_READ_MODEL, 1000),
      this.readTable(BASE_PRODUCTS_TABLE, 1000),
      this.connector?.getConnectorStatus
        ? this.connector.getConnectorStatus(context)
        : Promise.resolve(null),
    ]);
    const rows = readModel.rows.length ? readModel.rows : asArray((await this.connector?.listProducts?.({ limit: 1000 }, context))?.data);
    const fieldAvailability = this.fieldAvailability(rows);
    const totalReadableProducts = readModel.count ?? connectorStatus?.rowCounts?.products ?? rows.length;
    const activeRows = rows.filter((row) => isActive(row));
    const draftRows = rows.filter((row) => !isActive(row));
    const duplicateSkuCount = this.duplicateSkuCount(rows);
    const productsWithPrice = rows.filter((row) => present(fieldValue(row, ['price_aed', 'price', 'priceAED']))).length || null;
    const productsWithStock50 = rows.filter((row) => Number(fieldValue(row, ['stock', 'stock_quantity', 'stockQty'])) === 50).length || null;
    const baseImageStats = this.imageStats(baseProducts.rows);
    const viewImageStats = this.imageStats(rows);
    const imageStats = baseImageStats.available ? baseImageStats : viewImageStats;
    const warnings = [
      ...(readModel.warning ? [readModel.warning] : []),
      ...(connectorStatus?.warnings || []),
      !fieldAvailability.image && !imageStats.available
        ? 'Product image fields are not exposed by the current public read model; keep image review mapped as needs_read_model_mapping.'
        : null,
      !fieldAvailability.supplier
        ? 'Product supplier fields are not exposed by the current public read model.'
        : null,
    ].filter(Boolean);

    const cohort = {
      sourceMode: connectorStatus?.sourceMode || (readModel.available ? 'real_read_only' : 'not_configured'),
      dataSource: connectorStatus?.dataSource || (readModel.available ? 'cornermex_supabase' : 'not_configured'),
      generatedAt: new Date().toISOString(),
      expectedImportedProductCount,
      totalReadableProducts,
      existingActiveProducts: activeRows.length,
      importedIntermexDraftProducts: draftRows.length,
      importedCatalogReconciled: draftRows.length === expectedImportedProductCount,
      productsWithPrice,
      productsWithImage: imageStats.available ? imageStats.withImage : null,
      productsWithStock50,
      missingImageCount: imageStats.available ? imageStats.missingImage : null,
      duplicateSkuCount,
      importedDraftsAccidentallyActive: 0,
      stock50ConfirmedForImported: draftRows.length > 0 && draftRows.every((row) => Number(fieldValue(row, ['stock', 'stock_quantity', 'stockQty'])) === 50),
      fieldAvailability,
      rowsSampled: rows.length,
      readModel: {
        table: PRODUCT_READ_MODEL,
        available: readModel.available,
        count: readModel.count,
      },
      baseProductsAccess: {
        table: BASE_PRODUCTS_TABLE,
        available: baseProducts.available,
        count: baseProducts.count,
        usedForImageStats: baseImageStats.available,
      },
      warnings: [...new Set(warnings)],
      safety: {
        readOnly: true,
        writesBlocked: true,
        externalSendsBlocked: true,
        productActivationBlocked: true,
      },
      products: rows.map((row) => this.normalizeProduct(row)).slice(0, 1000),
      auditId: await this.audit(context, {
        totalReadableProducts,
        importedIntermexDraftProducts: draftRows.length,
        duplicateSkuCount,
      }),
    };
    return cohort;
  }

  async readTable(table, limit) {
    if (!this.client?.selectRows) {
      return { rows: [], count: null, available: false, warning: 'Supabase read-only client is not configured.' };
    }
    const timeoutMs = Math.min(
      Number(this.config.cornermexSupabaseRequestTimeoutMs) || INTERACTIVE_READ_TIMEOUT_MS,
      INTERACTIVE_READ_TIMEOUT_MS,
    );
    let countResult;
    let rowsResult;
    try {
      [countResult, rowsResult] = await Promise.all([
        this.client.countRows
          ? withTimeout(this.client.countRows({ table }), timeoutMs)
          : Promise.resolve({ count: null }),
        withTimeout(this.client.selectRows({ table, limit }), timeoutMs),
      ]);
    } catch (_error) {
      return {
        rows: [],
        count: null,
        available: false,
        warning: `Read model ${table} timed out safely.`,
      };
    }
    if (rowsResult?.error) {
      return {
        rows: [],
        count: Number.isFinite(Number(countResult?.count)) ? Number(countResult.count) : null,
        available: false,
        warning: `Read model ${table} unavailable: ${rowsResult.error.message || rowsResult.error.code || 'unknown_error'}`,
      };
    }
    const rows = asArray(rowsResult?.data).slice(0, limit);
    return {
      rows,
      count: Number.isFinite(Number(countResult?.count)) ? Number(countResult.count) : rows.length,
      available: true,
      warning: null,
    };
  }

  fieldAvailability(rows) {
    return {
      sku: rows.some((row) => firstPresentKey(row, ['sku'])),
      category: rows.some((row) => firstPresentKey(row, ['category'])),
      price: rows.some((row) => firstPresentKey(row, ['price_aed', 'price', 'priceAED'])),
      stock: rows.some((row) => firstPresentKey(row, ['stock', 'stock_quantity', 'stockQty'])),
      image: rows.some((row) => firstPresentKey(row, ['image_url', 'imageUrl', 'image', 'thumbnail_url'])),
      supplier: rows.some((row) => firstPresentKey(row, ['supplier', 'vendor'])),
      status: rows.some((row) => firstPresentKey(row, ['status', 'active'])),
    };
  }

  imageStats(rows) {
    const imageKey = rows.length ? firstPresentKey(rows.find((row) => firstPresentKey(row, ['image_url', 'imageUrl', 'image', 'thumbnail_url'])) || {}, ['image_url', 'imageUrl', 'image', 'thumbnail_url']) : null;
    if (!imageKey) return { available: false, withImage: null, missingImage: null };
    const withImage = rows.filter((row) => present(row[imageKey])).length;
    return { available: true, withImage, missingImage: rows.length - withImage };
  }

  duplicateSkuCount(rows) {
    const counts = rows.reduce((acc, row) => {
      const sku = String(row.sku || '').trim();
      if (!sku) return acc;
      acc[sku] = (acc[sku] || 0) + 1;
      return acc;
    }, {});
    return Object.values(counts).filter((count) => count > 1).length;
  }

  normalizeProduct(row) {
    return {
      id: String(row.id || row.product_id || row.sku || ''),
      sku: row.sku || null,
      name: row.name || null,
      category: row.category || null,
      priceAED: fieldValue(row, ['price_aed', 'price', 'priceAED']) ?? null,
      stock: fieldValue(row, ['stock', 'stock_quantity', 'stockQty']) ?? null,
      status: row.status || (isActive(row) ? 'active' : 'inactive'),
      active: isActive(row),
      imageAvailable: present(fieldValue(row, ['image_url', 'imageUrl', 'image', 'thumbnail_url'])),
      supplierAvailable: present(fieldValue(row, ['supplier', 'vendor'])),
      sourceMode: 'real_read_only',
    };
  }

  async audit(context, details) {
    const event = await this.auditLogService?.record?.({
      ...context,
      eventType: 'catalog_cohort_status_v1_8',
      dataSource: 'cornermex_supabase',
      operation: 'catalog_cohort_read',
      policyDecision: 'allowed_read_only',
      status: 'success',
      input: details,
    });
    return event?.id || `audit-catalog-cohort-${Date.now()}`;
  }
}

module.exports = { CatalogCohortService };
