process.env.NODE_ENV = 'test';

const request = require('supertest');
const { authed, installTestAppAuth } = require('./helpers/appAuth');
const app = require('../src/app');

installTestAppAuth();

// The /api/mock/* aliases were removed in Product & Web Consolidation v1.
describe('Removed mock compatibility endpoints', () => {
  test.each([
    '/api/mock/orders',
    '/api/mock/products',
    '/api/mock/leads',
  ])('%s is not reachable anonymously and no longer exists', async (path) => {
    expect((await request(app).get(path)).statusCode).toBe(401);
    expect((await authed(app).get(path)).statusCode).toBe(404);
  });
});
