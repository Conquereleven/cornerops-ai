process.env.NODE_ENV = 'test';

const repository = require('../src/data/repositories/productRepository');

describe('productRepository', () => {
  test('finds Tajín from natural-language search and by SKU', async () => {
    const results = await repository.searchProducts('¿Tienen Tajín disponible?');
    const product = await repository.getProductBySku('TAJIN-142G');
    expect(results[0].sku).toBe('TAJIN-142G');
    expect(product.name).toContain('Tajín');
  });

  test('filters low-stock and B2B products', async () => {
    const lowStock = await repository.listProducts({ lowStock: true });
    const b2b = await repository.listProducts({ b2bAvailable: true });
    expect(lowStock.every((product) => product.stock < 20)).toBe(true);
    expect(b2b.every((product) => product.b2bAvailable)).toBe(true);
  });

  test('exposes database-ready repository aliases', async () => {
    const results = await repository.findProducts('chamoy');
    const product = await repository.findProductBySku('CHAMOY-1L');
    expect(results[0].sku).toBe('CHAMOY-1L');
    expect(product.available).toBe(true);
  });
});
