process.env.NODE_ENV = 'test';

const { searchCatalog } = require('../src/services/catalogSearchService');

describe('catalogSearchService', () => {
  test('uses keyword search without embeddings', async () => {
    const products = await searchCatalog('Busco piñatas para una fiesta');
    expect(products[0].sku).toBe('PINATA-MED-01');
  });
});
