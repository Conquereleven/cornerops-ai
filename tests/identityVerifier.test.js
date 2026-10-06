const { SupabaseIdentityVerifier, looksLikeSessionToken } = require('../src/core/identity');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const TOKEN = 'aaa.bbb.ccc';
const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const make = (fetchImpl, options = {}) => new SupabaseIdentityVerifier({
  url: 'https://project.supabase.example', publishableKey: 'publishable-test', fetchImpl, ...options,
});

describe('SupabaseIdentityVerifier', () => {
  test('is unconfigured without URL, key or with a non-HTTPS remote URL', async () => {
    expect(new SupabaseIdentityVerifier({}).configured).toBe(false);
    expect(new SupabaseIdentityVerifier({ url: 'http://evil.example', publishableKey: 'k' }).configured).toBe(false);
    expect(new SupabaseIdentityVerifier({ url: 'http://127.0.0.1:54321', publishableKey: 'k' }).configured).toBe(true);
    await expect(new SupabaseIdentityVerifier({}).verify(TOKEN)).rejects.toMatchObject({ statusCode: 503, code: 'APP_AUTH_NOT_CONFIGURED' });
  });

  test('rejects malformed tokens without calling the provider', async () => {
    const fetchImpl = jest.fn();
    for (const token of ['', 'opaque', 'a.b', 'a.b.c.d', 'a b.c.d', `${'a'.repeat(5000)}.b.c`]) {
      await expect(make(fetchImpl).verify(token)).rejects.toMatchObject({ statusCode: 401 });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(looksLikeSessionToken(TOKEN)).toBe(true);
  });

  test('returns only the user id and sends the publishable key', async () => {
    const fetchImpl = jest.fn(async () => ok({ id: USER_ID, email: 'person@example.test', role: 'service_role', app_metadata: { role: 'founder' } }));
    expect(await make(fetchImpl).verify(TOKEN)).toEqual({ userId: USER_ID });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://project.supabase.example/auth/v1/user');
    expect(options.headers).toEqual({ apikey: 'publishable-test', Authorization: `Bearer ${TOKEN}` });
  });

  test('maps provider rejection to 401 and outages to 503', async () => {
    await expect(make(async () => ({ ok: false, status: 401 })).verify(TOKEN)).rejects.toMatchObject({ statusCode: 401 });
    await expect(make(async () => ({ ok: false, status: 500 })).verify(TOKEN)).rejects.toMatchObject({ statusCode: 503 });
    await expect(make(async () => { throw new Error('network'); }).verify(TOKEN)).rejects.toMatchObject({ statusCode: 503 });
    await expect(make(async () => ok({ id: 'not-a-uuid' })).verify(TOKEN)).rejects.toMatchObject({ statusCode: 401 });
  });

  test('caches briefly, never caches failures, and bounds the cache', async () => {
    const fetchImpl = jest.fn(async () => ok({ id: USER_ID }));
    const verifier = make(fetchImpl, { maxEntries: 2 });
    await verifier.verify(TOKEN); await verifier.verify(TOKEN);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await verifier.verify('d.e.f'); await verifier.verify('g.h.i');
    expect(verifier.cache.size).toBe(2);

    const expired = make(fetchImpl, { cacheTtlMs: -1 });
    await expired.verify(TOKEN); await expired.verify(TOKEN);
    expect(fetchImpl).toHaveBeenCalledTimes(5);

    const failing = jest.fn(async () => ({ ok: false, status: 401 }));
    const rejecting = make(failing);
    await expect(rejecting.verify(TOKEN)).rejects.toBeTruthy();
    await expect(rejecting.verify(TOKEN)).rejects.toBeTruthy();
    expect(failing).toHaveBeenCalledTimes(2);
  });
});
