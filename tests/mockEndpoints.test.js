process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('Mock compatibility endpoints', () => {
  test.each([
    '/api/mock/orders',
    '/api/mock/products',
    '/api/mock/leads',
  ])('lists %s', async (path) => {
    const response = await request(app).get(path);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
