process.env.NODE_ENV = 'test';

const service = require('../src/services/workerEventService');

describe('workerEventService', () => {
  test('records and lists local worker events', async () => {
    const event = await service.recordEvent({
      conversationId: 'conv-event-test',
      worker: 'salesWorker',
      intent: 'product_search',
      eventType: 'worker_completed',
      source: 'memory',
    });
    const events = await service.listWorkerEvents({ limit: 10 });

    expect(event.source).toBe('memory');
    expect(events.some((item) => item.id === event.id)).toBe(true);
  });
});
