import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  getConversations,
  getLeads,
  getOrders,
  getProducts,
  getWorkerRuns,
  sendChatMessage,
} from './api';

describe('API client', () => {
  afterEach(() => vi.restoreAllMocks());

  test('posts the chat contract and returns the structured response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      reply: 'Hola',
      worker: 'supportWorker',
      intent: 'support',
      conversationId: 'conv-test',
      metadata: { latencyMs: 4 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const response = await sendChatMessage({ userId: '1', message: 'Hola' });

    expect(response.conversationId).toBe('conv-test');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ userId: '1', message: 'Hola' }) }),
    );
  });

  test('returns an actionable connection error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    await expect(sendChatMessage({ userId: '1', message: 'Hola' })).rejects.toThrow(
      /backend de CórnerOps AI/,
    );
  });

  test('serializes operational filters for repository-backed endpoints', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));

    await getConversations({ worker: 'ordersWorker', intent: 'order_status' });
    await getOrders({ status: 'preparing' });
    await getProducts({ category: 'Dried Chiles', lowStock: true });
    await getLeads({ status: 'qualified' });
    await getWorkerRuns({ worker: 'ordersWorker', limit: 25 });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/conversations?worker=ordersWorker&intent=order_status',
      '/api/orders?status=preparing',
      '/api/products?category=Dried+Chiles&lowStock=true',
      '/api/leads?status=qualified',
      '/api/worker-runs?worker=ordersWorker&limit=25',
    ]);
  });
});
