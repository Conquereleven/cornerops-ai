// Functional fixtures explicitly authenticate; security tests use raw supertest.
process.env.INTERNAL_API_KEY = 'synthetic-internal-test-key';
const supertest = require('supertest');
module.exports = (app) => supertest.agent(app).set('x-internal-api-key', 'synthetic-internal-test-key');
