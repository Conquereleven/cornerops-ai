process.env.NODE_ENV = 'test';

const { handle, extractOrderNumber } = require('../src/services/workers/ordersWorker');

describe('ordersWorker', () => {
  test.each([
    ['estado de orden #123', '123'],
    ['estado de orden 123', '123'],
    ['status of order 123', '123'],
  ])('extracts an order number from "%s"', (message, expected) => {
    expect(extractOrderNumber(message).replace(/^#/, '')).toBe(expected);
  });

  test('returns repository-backed order information', async () => {
    const result = await handle({ userId: '1', message: '¿Dónde está mi orden #123?' });
    expect(result.reply).toContain('preparing');
    expect(result.reply).toContain('2026-06-18');
    expect(result.metadata.orderId).toBe('123');
  });

  test('does not invent an unknown order', async () => {
    const result = await handle({ userId: '1', message: 'orden #999' });
    expect(result.metadata.found).toBe(false);
  });
});
