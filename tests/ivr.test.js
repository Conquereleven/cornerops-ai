process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');

describe('CornerOps IVR API', () => {
  test('returns the IVR integration placeholder', async () => {
    const response = await request(app).post('/api/ivr').send({
      callId: 'abc123',
      transcript: 'Quiero saber el estado de mi orden',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.reply).toContain('IVR Worker placeholder activo');
    expect(response.body.callId).toBe('abc123');
  });
});
