const fs = require('fs');
const path = require('path');
const {
  createSupplyGraphError,
  normalizeKey,
  normalizeText,
  sha256,
} = require('./supplyGraphTypes');

const DEFAULT_SOURCE = 'docs/data/cornermex-products-master-enriched-from-intermex.csv';
const DEFAULT_CHECKSUM = '90f8585196507fbe3663586d5a902449828d67b52ca7db436dd06867c13f1934';
const SOURCE_OBSERVED_AT = '2026-07-11T05:12:18.000Z';

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (character === '"' && next === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (character !== '\r') cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (quoted) throw createSupplyGraphError('Intermex snapshot CSV is malformed.', 'SUPPLYGRAPH_SOURCE_MALFORMED', 422);
  const filtered = rows.filter((candidate) => candidate.some((value) => value !== ''));
  const header = filtered.shift() || [];
  return filtered.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] || ''])));
};

const packEvidence = (name) => {
  const match = String(name || '').match(/\b(\d+(?:\.\d+)?)\s*(kg|g|ml|l|oz|pcs|ct)\b/i);
  return match ? { packSize: match[1], unitOfMeasure: match[2].toLowerCase() }
    : { packSize: null, unitOfMeasure: null };
};

class IntermexCatalogSynchronizer {
  constructor({ sourcePath = DEFAULT_SOURCE, expectedChecksum = DEFAULT_CHECKSUM, projectRoot } = {}) {
    this.projectRoot = path.resolve(projectRoot || path.join(__dirname, '../../..'));
    this.sourcePath = sourcePath;
    this.expectedChecksum = expectedChecksum;
  }

  load() {
    const absolutePath = path.resolve(this.projectRoot, this.sourcePath);
    if (!absolutePath.startsWith(`${this.projectRoot}${path.sep}`)) {
      throw createSupplyGraphError('Intermex source path is outside the repository.', 'SUPPLYGRAPH_SOURCE_PATH_DENIED', 403);
    }
    const bytes = fs.readFileSync(absolutePath);
    const checksum = sha256(bytes);
    if (this.expectedChecksum && checksum !== this.expectedChecksum) {
      throw createSupplyGraphError('Intermex source checksum does not match the reviewed snapshot.', 'SUPPLYGRAPH_SOURCE_CHECKSUM_MISMATCH', 409);
    }
    const rows = parseCsv(bytes.toString('utf8'));
    const items = [];
    const skipped = [];
    rows.forEach((row, index) => {
      const displayName = normalizeText(row.name);
      const supplierSku = normalizeText(row.sku) || null;
      if (!displayName) {
        skipped.push({ rowNumber: index + 2, reason: 'missing_name' });
        return;
      }
      const normalizedName = normalizeKey(displayName).replace(/-/g, ' ');
      const identityKey = sha256(JSON.stringify([
        supplierSku || '', normalizeKey(displayName), normalizeText(row.source_product_id),
      ]));
      const price = row.price_aed === '' ? null : Number(row.price_aed);
      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        skipped.push({ rowNumber: index + 2, reason: 'invalid_price' });
        return;
      }
      const pack = packEvidence(displayName);
      const commercialFacts = {
        currency: price === null ? null : 'AED',
        unitPrice: price,
        stockStatus: 'unknown',
        stockQuantity: null,
        minimumOrderQuantity: null,
        minimumOrderUnit: null,
        leadTimeDays: null,
        shelfLifeDays: null,
        validUntil: null,
      };
      items.push({
        identityKey,
        externalProductId: normalizeText(row.source_product_id) || null,
        supplierSku,
        normalizedName,
        displayName,
        brand: null,
        category: normalizeText(row.category) || null,
        ...pack,
        temperatureZone: null,
        sourceType: 'repo_catalog_snapshot',
        sourceReference: normalizeText(row.matched_intermex_url) || this.sourcePath,
        sourceChecksum: checksum,
        activeObservation: true,
        offer: {
          ...commercialFacts,
          idempotencyKey: sha256(JSON.stringify([identityKey, commercialFacts])),
          observedAt: SOURCE_OBSERVED_AT,
          sourceType: 'repo_catalog_snapshot',
          sourceReference: normalizeText(row.matched_intermex_url) || this.sourcePath,
          sourceChecksum: checksum,
          verificationStatus: 'source_verified',
          metadata: { syntheticStockDiscarded: true, productActivationAllowed: false },
        },
      });
    });
    return {
      supplier: {
        canonicalKey: 'intermex-uae',
        canonicalName: 'Intermex UAE',
        legalName: null,
        supplierType: 'distributor',
        countryCode: 'AE',
        emirate: 'Dubai',
        status: 'active',
        website: 'https://intermexuae.com/',
        sourceType: 'repo_catalog_snapshot',
        sourceReference: this.sourcePath,
        observedAt: SOURCE_OBSERVED_AT,
        verifiedAt: null,
        verificationStatus: 'source_verified',
        metadata: { sourceChecksum: checksum, networkAccessDuringSync: false },
      },
      items,
      skipped,
      sourcePath: this.sourcePath,
      sourceChecksum: checksum,
      observedAt: SOURCE_OBSERVED_AT,
      scannedItems: rows.length,
    };
  }
}

module.exports = {
  DEFAULT_CHECKSUM,
  DEFAULT_SOURCE,
  IntermexCatalogSynchronizer,
  SOURCE_OBSERVED_AT,
  packEvidence,
  parseCsv,
};
