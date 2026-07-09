#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const INPUT_CSV = process.env.CORNERMEX_INPUT_CSV || 'docs/data/cornermex-products-import-v1.csv';
const OUTPUT_CSV = 'docs/data/cornermex-products-master-enriched-from-intermex.csv';
const UNMATCHED_CSV = 'docs/data/cornermex-products-unmatched-review.csv';
const SQL_PATH = 'docs/supabase/cornermex-products-upsert-from-intermex.sql';
const SUMMARY_PATH = 'docs/data/cornermex-products-intermex-enrichment-summary.json';
const INTERMEX_URL = process.env.INTERMEX_PRODUCTS_JSON || 'https://intermexuae.com/products.json?limit=250&page=1';
const SOURCE_ID_HINTS_SQL = process.env.CORNERMEX_SOURCE_ID_HINTS_SQL || 'docs/supabase/cornermex-products-upsert-v1.sql';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (q) {
      if (c === '"' && n === '"') {
        cell += '"';
        i += 1;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0]);
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCsv(file, rows, columns) {
  const out = [columns.join(','), ...rows.map((r) => columns.map((c) => csvEscape(r[c])).join(','))].join('\n') + '\n';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
}

function parseInputCsv(file) {
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  const header = rows[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h) => [h, r[idx[h]] || ''])));
}

function parseSourceIdHints(file) {
  if (!fs.existsSync(file)) return new Map();
  const text = fs.readFileSync(file, 'utf8');
  const hints = new Map();
  for (const m of text.matchAll(/-- \('([0-9a-f-]{36})', '[^']*', '((?:''|[^'])*)'/g)) {
    hints.set(m[2].replace(/''/g, "'"), m[1]);
  }
  return hints;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'user-agent': 'CornerOps catalog enrichment read-only/1.0' } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Intermex endpoint ${url} returned HTTP ${res.statusCode}`));
          return;
        }
        try { resolve(JSON.parse(body)); }
        catch (error) { reject(new Error(`Intermex endpoint ${url} returned non-JSON: ${error.message}`)); }
      });
    }).on('error', reject);
  });
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/®|™/g, '')
    .replace(/\b(corner|mex|uae|intermex|by|my|store|mexican|mexico|original|authentic|bulk|pack|piece|pieces)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return new Set(normalize(value).split(' ').filter((t) => t.length > 1));
}

function sizeTokens(value) {
  return new Set(String(value || '').toLowerCase().match(/\b\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|pcs|pieces|piece|ct|pack)\b/g) || []);
}

function jaccard(a, b) {
  const aa = tokens(a);
  const bb = tokens(b);
  if (!aa.size || !bb.size) return 0;
  let overlap = 0;
  for (const t of aa) if (bb.has(t)) overlap += 1;
  return overlap / (aa.size + bb.size - overlap);
}

function stableSku(name) {
  return `CMX-${normalize(name).toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '').slice(0, 56)}`;
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function productUrl(handle) {
  return handle ? `https://intermexuae.com/products/${handle}` : 'https://intermexuae.com/';
}

function classify(score, inputName, candidateTitle) {
  const nInput = normalize(inputName);
  const nCandidate = normalize(candidateTitle);
  const inputSizes = sizeTokens(inputName);
  const candidateSizes = sizeTokens(candidateTitle);
  let sizeCompatible = inputSizes.size === 0 || candidateSizes.size === 0;
  if (!sizeCompatible) {
    for (const s of inputSizes) if (candidateSizes.has(s)) sizeCompatible = true;
  }
  if (nInput && nInput === nCandidate) return 'exact';
  if (score >= 0.72 && sizeCompatible) return 'high';
  if (score >= 0.5 && sizeCompatible) return 'medium';
  if (score >= 0.36) return 'low';
  return 'unmatched';
}

function bestMatch(input, products) {
  let best = null;
  for (const p of products) {
    const score = jaccard(input.name, p.title);
    if (!best || score > best.score) best = { product: p, score };
  }
  if (!best || best.score < 0.36) return { confidence: 'unmatched', product: null, score: best?.score || 0 };
  return { ...best, confidence: classify(best.score, input.name, best.product.title) };
}

function sqlString(value) {
  if (value == null || value === '') return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlValue(value, numericOrBoolean = false) {
  if (value == null || value === '') return 'null';
  return numericOrBoolean ? String(value) : sqlString(value);
}

function buildSql(rows) {
  const values = rows.map((r) => `  (${[
    sqlValue(r.sku),
    sqlValue(r.name),
    sqlValue(r.category),
    sqlValue(r.price_aed || null, true),
    sqlValue(r.description),
    sqlValue(r.image_url),
    sqlValue(r.stock, true),
    sqlValue(r.supplier),
    sqlValue(r.active, true),
    sqlValue(r.b2b_available, true),
  ].join(', ')})`).join(',\n');

  return `-- CornerMex products upsert from Intermex UAE\n-- Proposal only. Do not execute without founder review.\n-- Source: ${INTERMEX_URL}\n-- Safety: no truncate, no delete, no privileged database key requirement.\n-- Import policy: active=false for every row until founder review.\n\nbegin;\n\ncreate table if not exists public.products_backup_pre_intermex_import as\nselect * from public.products;\n\nalter table public.products add column if not exists image_url text;\nalter table public.products add column if not exists supplier text;\n\ncreate unique index if not exists products_sku_unique on public.products (sku);\n\nwith incoming(sku, name, category, price_aed, description, image_url, stock, supplier, active, b2b_available) as (\nvalues\n${values}\n), checks as (\n  select\n    count(*) filter (where nullif(trim(sku), '') is null) as empty_sku_count,\n    count(*) filter (where nullif(trim(name), '') is null) as empty_name_count,\n    (select count(*) from (select sku from incoming group by sku having count(*) > 1) d) as duplicate_sku_count\n  from incoming\n)\nselect * from checks;\n\n-- Founder/operator must verify checks are all zero before running the upsert below.\n\ninsert into public.products (\n  sku, name, category, price_aed, description, image_url, stock, supplier, active, b2b_available\n)\nselect\n  sku, name, category, price_aed, description, image_url, stock, supplier, active, b2b_available\nfrom incoming\nwhere nullif(trim(sku), '') is not null\n  and nullif(trim(name), '') is not null\non conflict (sku) do update set\n  name = excluded.name,\n  category = coalesce(public.products.category, excluded.category),\n  price_aed = coalesce(public.products.price_aed, excluded.price_aed),\n  description = coalesce(public.products.description, excluded.description),\n  image_url = coalesce(public.products.image_url, excluded.image_url),\n  stock = case when public.products.stock is null or public.products.stock = 0 then excluded.stock else public.products.stock end,\n  supplier = coalesce(public.products.supplier, excluded.supplier),\n  active = public.products.active and excluded.active,\n  b2b_available = public.products.b2b_available or excluded.b2b_available,\n  updated_at = now();\n\nselect count(*) as total_products from public.products;\nselect count(*) as products_with_price from public.products where price_aed is not null;\nselect count(*) as products_with_image from public.products where image_url is not null and trim(image_url) <> '';\nselect count(*) as products_with_stock_50 from public.products where stock = 50;\nselect sku, count(*) from public.products group by sku having count(*) > 1;\n\nrollback;\n-- Replace rollback with commit only after founder review and successful preflight checks.\n`;
}

function buildInputMatchIndex(inputRows, products) {
  return inputRows.map((row) => ({ row, match: bestMatch(row, products) }));
}

function findBestInputForProduct(product, inputMatches) {
  let best = null;
  for (const item of inputMatches) {
    if (!item.match.product || item.match.product.id !== product.id) continue;
    if (!best || item.match.score > best.match.score) best = item;
  }
  return best;
}

async function main() {
  if (!fs.existsSync(INPUT_CSV)) throw new Error(`Missing input CSV: ${INPUT_CSV}`);
  const inputRows = parseInputCsv(INPUT_CSV);
  const sourceIdHints = parseSourceIdHints(SOURCE_ID_HINTS_SQL);
  const catalog = await fetchJson(INTERMEX_URL);
  const products = catalog.products || [];
  if (!products.length) throw new Error(`No products returned by Intermex endpoint: ${INTERMEX_URL}`);

  const inputMatches = buildInputMatchIndex(inputRows, products);
  const enriched = [];
  const reviewRows = [];
  const usedSkus = new Set();

  for (const p of products) {
    const v = p?.variants?.[0] || {};
    const image = p?.images?.[0]?.src || '';
    const matchedInput = findBestInputForProduct(p, inputMatches);
    const matchedRow = matchedInput?.row;
    const confidence = 'exact';
    let sku = v.sku || stableSku(p.title);
    let suffix = 2;
    while (usedSkus.has(sku)) {
      sku = `${stableSku(p.title)}-${suffix}`;
      suffix += 1;
    }
    usedSkus.add(sku);
    const out = {
      source_product_id: matchedRow ? (matchedRow.source_product_id || matchedRow.product_id || sourceIdHints.get(matchedRow.name) || '') : '',
      sku,
      name: p.title,
      category: matchedRow?.category || '',
      price_aed: v.price || '',
      stock: 50,
      description: matchedRow?.description || stripHtml(p.body_html) || '',
      image_url: image,
      supplier: p.vendor || 'Intermex UAE',
      active: 'false',
      b2b_available: 'false',
      match_confidence: confidence,
      matched_intermex_title: p.title,
      matched_intermex_url: productUrl(p.handle),
      review_notes: matchedRow
        ? 'Direct Intermex catalog row matched to CornerMex seed candidate. Founder review required before activation.'
        : 'Direct Intermex catalog row not present in original CornerMex CSV. Founder review required before import/activation.',
    };
    enriched.push(out);
    if (!out.price_aed || !out.image_url || !matchedRow) reviewRows.push(out);
  }

  for (const item of inputMatches) {
    if (item.match.confidence === 'exact' || item.match.confidence === 'high' || item.match.confidence === 'medium') continue;
    const row = item.row;
    reviewRows.push({
      source_product_id: row.source_product_id || row.product_id || sourceIdHints.get(row.name) || '',
      sku: stableSku(row.name),
      name: row.name,
      category: row.category,
      price_aed: '',
      stock: 50,
      description: row.description || '',
      image_url: '',
      supplier: 'Intermex UAE',
      active: 'false',
      b2b_available: 'false',
      match_confidence: item.match.confidence,
      matched_intermex_title: item.match.product?.title || '',
      matched_intermex_url: item.match.product ? productUrl(item.match.product.handle) : '',
      review_notes: item.match.confidence === 'low'
        ? 'Low confidence match from original CornerMex CSV; not included in 190-row Intermex master unless founder confirms.'
        : 'No confident Intermex match from original CornerMex CSV; not included in 190-row Intermex master unless founder confirms.',
    });
  }

  const columns = ['source_product_id','sku','name','category','price_aed','stock','description','image_url','supplier','active','b2b_available','match_confidence','matched_intermex_title','matched_intermex_url','review_notes'];
  writeCsv(OUTPUT_CSV, enriched, columns);
  writeCsv(UNMATCHED_CSV, reviewRows, columns);
  fs.mkdirSync(path.dirname(SQL_PATH), { recursive: true });
  fs.writeFileSync(SQL_PATH, buildSql(enriched));

  const matchedInputRows = inputMatches.filter((item) => ['exact', 'high', 'medium'].includes(item.match.confidence)).length;
  const lowUnmatchedInputRows = inputMatches.length - matchedInputRows;
  const summary = {
    sourceCsv: INPUT_CSV,
    intermexSourceMethod: INTERMEX_URL,
    inputRows: inputRows.length,
    intermexProducts: products.length,
    outputRows: enriched.length,
    matchedRows: enriched.length,
    exactHighConfidenceMatches: enriched.filter((r) => r.match_confidence === 'exact' || r.match_confidence === 'high').length,
    mediumConfidenceMatches: enriched.filter((r) => r.match_confidence === 'medium').length,
    lowUnmatchedRows: reviewRows.length,
    originalCsvMatchedRows: matchedInputRows,
    originalCsvLowUnmatchedRows: lowUnmatchedInputRows,
    rowsWithPrice: enriched.filter((r) => r.price_aed).length,
    rowsWithImage: enriched.filter((r) => r.image_url).length,
    rowsWithStockSetTo50: enriched.filter((r) => Number(r.stock) === 50).length,
    activeRows: enriched.filter((r) => r.active === 'true').length,
    enrichedCsv: OUTPUT_CSV,
    unmatchedReviewCsv: UNMATCHED_CSV,
    supabaseSql: SQL_PATH,
  };
  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
