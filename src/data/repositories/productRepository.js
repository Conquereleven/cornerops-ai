const mockProducts = require('../mockProducts');
const {
  supabase,
  isSupabaseEnabled,
} = require('../supabase/supabaseClient');
const {
  clampLimit,
  parseOptionalBoolean,
  throwSupabaseError,
  trySupabase,
} = require('./repositoryUtils');

const normalize = (value) =>
  String(value || '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const ignoredTerms = new Set([
  'tienen', 'tienes', 'have', 'producto', 'product', 'precio', 'price',
  'disponible', 'available', 'comprar', 'quiero', 'busco',
]);

const getSearchTerms = (query) =>
  normalize(query)
    .split(/\s+/)
    .filter((term) => term.length > 2 && !ignoredTerms.has(term));

const productHaystack = (product) =>
  normalize(
    `${product.sku} ${product.name} ${product.category} ${product.description} ${(product.keywords || []).join(' ')}`,
  );

const mapProduct = (row) => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  category: row.category || '',
  available: row.available !== false && row.active !== false && row.stock > 0,
  priceAED: row.price_aed === null ? 0 : Number(row.price_aed),
  stock: row.stock,
  description: row.description || '',
  languages: row.languages || [],
  b2bAvailable: Boolean(row.b2b_available),
  keywords: row.keywords || [],
  active: Boolean(row.active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const searchProducts = async (query) => {
  const terms = getSearchTerms(query);
  if (!terms.length) return [];

  if (isSupabaseEnabled()) {
    const result = await trySupabase('search products', async () => {
      const term = terms[0].replace(/[,%()]/g, '');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .or(
          `sku.ilike.%${term}%,name.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`,
        )
        .limit(25);
      throwSupabaseError(error, 'search products');
      return data.map(mapProduct);
    });
    if (result.ok) return result.value;
  }

  return mockProducts.filter((product) =>
    terms.some((term) => productHaystack(product).includes(term)),
  );
};

const getProductBySku = async (sku) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('get product', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', String(sku))
        .maybeSingle();
      throwSupabaseError(error, 'get product');
      return data ? mapProduct(data) : null;
    });
    if (result.ok) return result.value;
  }
  return mockProducts.find(
    (product) => normalize(product.sku) === normalize(sku),
  ) || null;
};

const listAvailableProducts = async () => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('list available products', async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .gt('stock', 0)
        .order('name')
        .limit(500);
      throwSupabaseError(error, 'list available products');
      return data.map(mapProduct);
    });
    if (result.ok) return result.value;
  }
  return mockProducts.filter((product) => product.stock > 0);
};

const listProducts = async ({
  limit = 100,
  category,
  b2bAvailable,
  lowStock,
} = {}) => {
  const safeLimit = clampLimit(limit);
  const b2b = parseOptionalBoolean(b2bAvailable);
  const low = parseOptionalBoolean(lowStock);

  if (isSupabaseEnabled()) {
    const result = await trySupabase('list products', async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name')
        .limit(safeLimit);
      if (category) query = query.eq('category', category);
      if (b2b !== undefined) query = query.eq('b2b_available', b2b);
      if (low === true) query = query.lt('stock', 20);
      const { data, error } = await query;
      throwSupabaseError(error, 'list products');
      return data.map(mapProduct);
    });
    if (result.ok) return result.value;
  }

  return mockProducts
    .filter((product) => !category || product.category === category)
    .filter((product) => b2b === undefined || product.b2bAvailable === b2b)
    .filter((product) => low !== true || product.stock < 20)
    .slice(0, safeLimit)
    .map((product) => ({ active: true, ...product }));
};

module.exports = {
  searchProducts,
  findProducts: searchProducts,
  getProductBySku,
  findProductBySku: getProductBySku,
  listAvailableProducts,
  listProducts,
};
