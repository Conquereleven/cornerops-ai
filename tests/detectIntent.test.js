const { detectIntent } = require('../src/utils/detectIntent');

describe('detectIntent', () => {
  test.each([
    ['quiero hablar con alguien', 'human_handoff', 'humanHandoffWorker', 'support'],
    ['I want wholesale prices', 'b2b_lead', 'b2bWorker', 'b2b'],
    ['do you have tajin?', 'product_search', 'salesWorker', 'sales'],
    ['where is my order?', 'order_status', 'ordersWorker', 'orders'],
    ['hola, necesito ayuda', 'support', 'supportWorker', 'support'],
    ['need 20 boxes for a supermarket', 'b2b_lead', 'b2bWorker', 'b2b'],
    ['texto ambiguo xyz', 'unknown', 'supportWorker', 'unknown'],
  ])('detects "%s"', (message, intent, worker, category) => {
    expect(detectIntent(message)).toEqual({ intent, worker, category });
  });

  test('keeps conversation context for an ambiguous follow-up', () => {
    expect(
      detectIntent('¿Y para cuándo?', { lastIntent: 'order_status' }),
    ).toEqual({
      intent: 'order_status',
      worker: 'ordersWorker',
      category: 'orders',
    });
  });
});
