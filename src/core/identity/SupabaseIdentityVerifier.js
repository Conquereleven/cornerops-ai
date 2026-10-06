const { createHash } = require('crypto');
const { identityError, isUuid } = require('./policy');

const TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MAX_TOKEN_LENGTH = 4096;

const looksLikeSessionToken = (token) => typeof token === 'string'
  && token.length <= MAX_TOKEN_LENGTH && TOKEN_PATTERN.test(token);

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
  constructor({ url = '', publishableKey = '', fetchImpl = globalThis.fetch, cacheTtlMs = 30000, timeoutMs = 5000, maxEntries = 500 } = {}) {
    this.url = String(url || '').replace(/\/+$/, '');
    this.publishableKey = String(publishableKey || '');
    this.fetchImpl = fetchImpl;
    this.cacheTtlMs = cacheTtlMs;
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
    const key = createHash('sha256').update(token).digest('hex');
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return { userId: cached.userId };
    this.cache.delete(key);

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
      throw identityError('Session is invalid or expired.', 'APP_SESSION_INVALID', 401);
    }
    if (!response.ok) throw identityError('Identity provider is unavailable.', 'APP_AUTH_PROVIDER_UNAVAILABLE', 503);
    const body = await response.json().catch(() => null);
    if (!isUuid(body?.id)) throw identityError('Session is invalid or expired.', 'APP_SESSION_INVALID', 401);

    if (this.cache.size >= this.maxEntries) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, { userId: body.id, expiresAt: Date.now() + this.cacheTtlMs });
    return { userId: body.id };
  }
}

module.exports = { SupabaseIdentityVerifier, looksLikeSessionToken };
