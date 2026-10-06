const { createHash } = require('crypto');
const { identityError, isUuid } = require('./policy');

const TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MAX_TOKEN_LENGTH = 4096;

const looksLikeSessionToken = (token) => typeof token === 'string'
  && token.length <= MAX_TOKEN_LENGTH && TOKEN_PATTERN.test(token);

// Unverified read of the token's own claims. Used only to reject tokens that
// cannot be valid (malformed, expired, no subject) without a network call, and
// to cross-check the provider's answer. It never grants anything.
const readClaims = (token) => {
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return claims && typeof claims === 'object' ? claims : null;
  } catch (_error) { return null; }
};
const CLOCK_SKEW_MS = 60000;

const allowedAuthUrl = (value) => {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch (_error) { return false; }
};

// Verifies a browser access token against Supabase Auth. Identity only: the
// result never carries a role or workspace.
class SupabaseIdentityVerifier {
  constructor({ url = '', publishableKey = '', fetchImpl = globalThis.fetch, cacheTtlMs = 30000, rejectedTtlMs = 10000, timeoutMs = 5000, maxEntries = 500 } = {}) {
    this.url = String(url || '').replace(/\/+$/, '');
    this.publishableKey = String(publishableKey || '');
    this.fetchImpl = fetchImpl;
    this.cacheTtlMs = cacheTtlMs;
    this.rejectedTtlMs = rejectedTtlMs;
    this.timeoutMs = timeoutMs;
    this.maxEntries = maxEntries;
    this.cache = new Map();
  }

  get configured() {
    return Boolean(this.publishableKey) && allowedAuthUrl(this.url) && typeof this.fetchImpl === 'function';
  }

  async verify(token) {
    if (!this.configured) throw identityError('Authentication is not configured.', 'APP_AUTH_NOT_CONFIGURED', 503);
    if (!looksLikeSessionToken(token)) throw identityError('Session is invalid.', 'APP_SESSION_INVALID', 401);
    const invalid = () => identityError('Session is invalid or expired.', 'APP_SESSION_INVALID', 401);
    const claims = readClaims(token);
    if (!claims || !isUuid(claims.sub) || typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now() - CLOCK_SKEW_MS) throw invalid();

    const key = createHash('sha256').update(token).digest('hex');
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      if (!cached.userId) throw invalid();
      return { userId: cached.userId };
    }
    this.cache.delete(key);
    const remember = (userId, ttlMs) => {
      if (this.cache.size >= this.maxEntries) this.cache.delete(this.cache.keys().next().value);
      this.cache.set(key, { userId, expiresAt: Date.now() + ttlMs });
    };

    let response;
    try {
      response = await this.fetchImpl(`${this.url}/auth/v1/user`, {
        headers: { apikey: this.publishableKey, Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (_error) {
      throw identityError('Identity provider is unavailable.', 'APP_AUTH_PROVIDER_UNAVAILABLE', 503);
    }
    if (response.status === 401 || response.status === 403) {
      // A rejected token never becomes valid: remember that briefly so a
      // replayed bad token cannot be used to flood the provider.
      remember(null, this.rejectedTtlMs);
      throw invalid();
    }
    if (!response.ok) throw identityError('Identity provider is unavailable.', 'APP_AUTH_PROVIDER_UNAVAILABLE', 503);
    const body = await response.json().catch(() => null);
    if (!isUuid(body?.id) || body.id.toLowerCase() !== claims.sub.toLowerCase()) throw invalid();

    // Never trust a positive result past the token's own expiry.
    remember(body.id, Math.max(0, Math.min(this.cacheTtlMs, claims.exp * 1000 - Date.now())));
    return { userId: body.id };
  }
}

module.exports = { SupabaseIdentityVerifier, looksLikeSessionToken };
