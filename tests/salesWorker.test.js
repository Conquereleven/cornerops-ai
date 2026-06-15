process.env.NODE_ENV = 'test';

const { handle } = require('../src/services/workers/salesWorker');

describe('salesWorker', () => {
  test('returns data for Tajín from the product repository', async () => {
    const result = await handle({ message: '¿Tienen Tajín disponible?' });
    expect(result.reply).toContain('12 AED');
    expect(result.metadata.products[0].sku).toBe('TAJIN-142G');
  });
});
