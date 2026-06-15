process.env.NODE_ENV = 'test';

const repository = require('../src/data/repositories/aiWorkerRunRepository');

describe('aiWorkerRunRepository', () => {
  test('creates and filters worker runs', async () => {
    const run = await repository.createWorkerRun({
      userId: 'run-user',
      worker: 'ordersWorker',
      intent: 'order_status',
      input: 'orden #123',
      output: 'preparing',
      metadata: { orderId: '123' },
      success: true,
      latencyMs: 8,
    });
    const runs = await repository.listWorkerRuns({
      worker: 'ordersWorker',
      intent: 'order_status',
    });
    expect(run.id).toMatch(/^run-/);
    expect(runs.some((item) => item.id === run.id)).toBe(true);
  });
});
