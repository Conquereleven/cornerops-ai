const { SupabaseIdentityVerifier, looksLikeSessionToken } = require('../src/core/identity');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const tokenFor = (claims) => `${encode({ alg: 'ES256' })}.${encode(claims)}.signature`;
const future = () => Math.floor(Date.now() / 1000) + 3600;
const TOKEN = tokenFor({ sub: USER_ID, exp: future() });
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
    for (const token of [
      '', 'opaque', 'a.b', 'a.b.c.d', 'a b.c.d', `${'a'.repeat(5000)}.b.c`, 'aaa.bbb.ccc',
      tokenFor({ sub: USER_ID, exp: Math.floor(Date.now() / 1000) - 3600 }),
      tokenFor({ sub: USER_ID }), tokenFor({ exp: future() }), tokenFor({ sub: 'not-a-uuid', exp: future() }), tokenFor([1, 2]),
    ]) {
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
    // The provider must confirm the same subject the token names.
    await expect(make(async () => ok({ id: '99999999-9999-4999-8999-999999999999' })).verify(TOKEN)).rejects.toMatchObject({ statusCode: 401 });
  });

  test('caches a positive result briefly, bounded and never past token expiry', async () => {
    const other = (n) => tokenFor({ sub: USER_ID, exp: future(), n });
    const fetchImpl = jest.fn(async () => ok({ id: USER_ID }));
    const verifier = make(fetchImpl, { maxEntries: 2 });
    await verifier.verify(TOKEN); await verifier.verify(TOKEN);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await verifier.verify(other(1)); await verifier.verify(other(2));
    expect(verifier.cache.size).toBe(2);

    const expired = make(fetchImpl, { cacheTtlMs: -1 });
    await expired.verify(TOKEN); await expired.verify(TOKEN);
    expect(fetchImpl).toHaveBeenCalledTimes(5);

    const nearlyExpired = tokenFor({ sub: USER_ID, exp: Math.floor(Date.now() / 1000) - 30 });
    const skewed = make(fetchImpl);
    await skewed.verify(nearlyExpired); await skewed.verify(nearlyExpired);
    expect(fetchImpl).toHaveBeenCalledTimes(7);
  });

  test('a rejected token is remembered briefly; an outage is never cached', async () => {
    const rejecting = jest.fn(async () => ({ ok: false, status: 401 }));
    const verifier = make(rejecting);
    await expect(verifier.verify(TOKEN)).rejects.toMatchObject({ statusCode: 401 });
    await expect(verifier.verify(TOKEN)).rejects.toMatchObject({ statusCode: 401 });
    expect(rejecting).toHaveBeenCalledTimes(1);

    let down = true;
    const recovering = jest.fn(async () => (down ? { ok: false, status: 502 } : ok({ id: USER_ID })));
    const second = make(recovering);
    await expect(second.verify(TOKEN)).rejects.toMatchObject({ statusCode: 503 });
    down = false;
    await expect(second.verify(TOKEN)).resolves.toEqual({ userId: USER_ID });
  });
});
