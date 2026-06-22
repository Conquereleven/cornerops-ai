process.env.NODE_ENV = 'test';

const { OpenClawGatewayClient } = require('../src/integrations/openclaw/OpenClawGatewayClient');

const baseConfig = {
  baseUrl: 'http://openclaw.local',
  circuitBreakerCooldownMs: 30000,
  circuitBreakerFailures: 3,
  defaultModel: 'openclaw/default',
  dryRun: false,
  enabled: true,
  maxRetries: 2,
  password: '',
  timeoutMs: 20,
  token: 'secret-token',
};

const jsonResponse = (body, init = {}) => ({
  ok: init.status ? init.status < 400 : true,
  status: init.status || 200,
  text: async () => JSON.stringify(body),
});

describe('OpenClawGatewayClient', () => {
  test('builds authenticated health and model requests without exposing token output', async () => {
    const calls = [];
    const client = new OpenClawGatewayClient({
      config: baseConfig,
      fetchFn: async (url, options) => {
        calls.push({ url, options });
        return jsonResponse({ data: [{ id: 'openclaw/default' }] });
      },
    });

    const health = await client.healthCheck({ requestId: 'request-1' });

    expect(health.ok).toBe(true);
    expect(calls[0].url).toBe('http://openclaw.local/v1/models');
    expect(calls[0].options.headers.authorization).toBe('Bearer secret-token');
    expect(calls[0].options.headers['x-request-id']).toBe('request-1');
  });

  test('maps 401/403 responses to auth errors', async () => {
    const client = new OpenClawGatewayClient({
      config: baseConfig,
      fetchFn: async () => jsonResponse({ error: 'bad token' }, { status: 401 }),
    });

    await expect(client.listModels()).rejects.toMatchObject({
      code: 'OPENCLAW_AUTH_ERROR',
      status: 401,
    });
  });

  test('maps server errors and retries only idempotent requests', async () => {
    let calls = 0;
    const client = new OpenClawGatewayClient({
      config: baseConfig,
      fetchFn: async () => {
        calls += 1;
        return jsonResponse({ error: 'down' }, { status: 500 });
      },
      log: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
    });

    await expect(client.listModels()).rejects.toMatchObject({
      code: 'OPENCLAW_HTTP_ERROR',
      status: 500,
    });
    expect(calls).toBe(3);

    calls = 0;
    const nonIdempotentClient = new OpenClawGatewayClient({
      config: baseConfig,
      fetchFn: async () => {
        calls += 1;
        return jsonResponse({ error: 'down' }, { status: 500 });
      },
      log: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
    });
    await expect(nonIdempotentClient.chatCompletion({ metadata: {} })).rejects.toBeDefined();
    expect(calls).toBe(1);
  });

  test('handles timeout', async () => {
    const client = new OpenClawGatewayClient({
      config: { ...baseConfig, maxRetries: 0, timeoutMs: 5 },
      fetchFn: async () => new Promise(() => {}),
    });

    await expect(client.listModels()).rejects.toMatchObject({
      code: 'OPENCLAW_TIMEOUT',
    });
  });
});
