process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('Products API', () => {
  test('searches, filters, and gets products by SKU', async () => {
    const search = await request(app).get('/api/products/search?q=tajin');
    const lowStock = await request(app).get('/api/products?lowStock=true');
    const detail = await request(app).get('/api/products/TAJIN-142G');
    expect(search.body[0].sku).toBe('TAJIN-142G');
    expect(lowStock.body.every((product) => product.stock < 20)).toBe(true);
    expect(detail.body.name).toContain('Tajín');
  });
});
