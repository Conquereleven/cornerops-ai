const { createWebConsoleGuard, isLoopback, safeEqual } = require('../../../src/middleware/webConsoleGuard');

const base = {
  corneropsWebConsoleEnabled: true,
  corneropsWebConsoleLocalOnly: true,
  corneropsWebConsoleAllowedOrigins: ['http://127.0.0.1:3000'],
  corneropsWebConsoleRequireAuth: true,
  corneropsWebConsoleAuthToken: 'test-console-token',
  corneropsWebConsoleReadOnly: true,
  corneropsWebConsoleDryRun: true,
  corneropsFailClosed: true,
  corneropsPiiMasking: true,
  corneropsLogSanitization: true,
  corneropsAuditViewerMaskPii: true,
  corneropsSecurityDashboardMaskPii: true,
};

const invoke = (config, headers = {}, address = '127.0.0.1') => {
  const req = { ip: address, socket: { remoteAddress: address }, get: (name) => headers[name.toLowerCase()] };
  const response = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  const next = jest.fn();
  createWebConsoleGuard(config)(req, response, next);
  return { next, response };
};

describe('webConsoleGuard v0.8', () => {
  test('recognizes loopback only', () => {
    expect(isLoopback({ ip: '::1', socket: {} })).toBe(true);
    expect(isLoopback({ ip: '10.0.0.5', socket: { remoteAddress: '10.0.0.5' } })).toBe(false);
  });

  test('is disabled by default and fails closed when auth is missing', () => {
    expect(invoke({ ...base, corneropsWebConsoleEnabled: false }).response.statusCode).toBe(404);
    expect(invoke({ ...base, corneropsWebConsoleAuthToken: '' }).response.statusCode).toBe(503);
  });

  test('rejects non-local, unapproved origins and invalid auth', () => {
    expect(invoke(base, { 'x-cornerops-console-token': 'test-console-token' }, '10.0.0.5').response.statusCode).toBe(403);
    expect(invoke(base, { origin: 'https://public.example', 'x-cornerops-console-token': 'test-console-token' }).response.statusCode).toBe(403);
    expect(invoke(base, { 'x-cornerops-console-token': 'wrong' }).response.statusCode).toBe(401);
  });

  test('allows a valid local authenticated request without exposing token comparisons', () => {
    const result = invoke(base, { origin: 'http://127.0.0.1:3000', 'x-cornerops-console-token': 'test-console-token' });
    expect(result.next).toHaveBeenCalledTimes(1);
    expect(safeEqual('same', 'same')).toBe(true);
    expect(safeEqual('same', 'different')).toBe(false);
  });

  test('fails closed when masking or sanitization is disabled', () => {
    const headers = { 'x-cornerops-console-token': 'test-console-token' };
    expect(invoke({ ...base, corneropsAuditViewerMaskPii: false }, headers).response.statusCode).toBe(503);
    expect(invoke({ ...base, corneropsLogSanitization: false }, headers).response.statusCode).toBe(503);
  });
});
