const request = require('supertest');
const app = require('../src/app');
describe('WhatsApp disabled without configuration', () => {
  test('does not advertise a functional placeholder', async () => {
    await request(app).get('/api/webhooks/whatsapp').expect(503);
  });
  test('rejects unsigned agent input', async () => {
    await request(app).post('/api/webhooks/whatsapp').send({from:'synthetic',text:'test'}).expect(503);
  });
});
