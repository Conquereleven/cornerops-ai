const { createHmac, timingSafeEqual } = require('crypto');
const { commerceOsError } = require('../../core/commerce-os/commerceOsTypes');

const header = (headers, name) => Object.entries(headers || {})
  .find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];

class MemoryShopifyWebhookReplayStore {
  constructor({ ttlMs = 24 * 60 * 60 * 1000 } = {}) {
    this.ttlMs = ttlMs;
    this.records = new Map();
  }
  checkAndSet(key, now = Date.now()) {
    for (const [recordKey, expiresAt] of this.records) if (expiresAt <= now) this.records.delete(recordKey);
    if (this.records.has(key)) return false;
    this.records.set(key, now + this.ttlMs);
    return true;
  }
  health() { return { healthy: true, provider: 'memory', ttlMs: this.ttlMs }; }
}

class ShopifyWebhookVerifier {
  constructor({ secret, shopDomain, topics = ['orders/create', 'orders/updated'], replayStore = new MemoryShopifyWebhookReplayStore() } = {}) {
    this.secret = String(secret || '');
    this.shopDomain = String(shopDomain || '').toLowerCase();
    this.topics = new Set(topics);
    this.replayStore = replayStore;
  }

  verify({ rawBody, headers = {} } = {}) {
    if (!this.secret) throw commerceOsError('Shopify webhook secret is required.', 'SHOPIFY_WEBHOOK_SECRET_REQUIRED');
    const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ''), 'utf8');
    const supplied = String(header(headers, 'x-shopify-hmac-sha256') || '');
    const expected = createHmac('sha256', this.secret).update(body).digest('base64');
    const valid = supplied.length === expected.length
      && timingSafeEqual(Buffer.from(supplied, 'utf8'), Buffer.from(expected, 'utf8'));
    if (!valid) throw commerceOsError('Shopify webhook signature is invalid.', 'SHOPIFY_WEBHOOK_HMAC_INVALID');

    const topic = String(header(headers, 'x-shopify-topic') || '').toLowerCase();
    const domain = String(header(headers, 'x-shopify-shop-domain') || '').toLowerCase();
    const webhookId = String(header(headers, 'x-shopify-webhook-id') || '');
    const eventId = String(header(headers, 'x-shopify-event-id') || webhookId);
    if (!this.topics.has(topic)) throw commerceOsError('Shopify webhook topic is not allowed.', 'SHOPIFY_WEBHOOK_TOPIC_NOT_ALLOWED', { topic });
    if (!domain || domain !== this.shopDomain) throw commerceOsError('Shopify webhook shop does not match.', 'SHOPIFY_WEBHOOK_SHOP_MISMATCH');
    if (!webhookId) throw commerceOsError('Shopify webhook delivery ID is required.', 'SHOPIFY_WEBHOOK_ID_REQUIRED');

    const replayKey = `${domain}:${eventId}`;
    return { accepted: this.replayStore.checkAndSet(replayKey), topic, shopDomain: domain, webhookId, eventId, rawBody: body };
  }
}

module.exports = { MemoryShopifyWebhookReplayStore, ShopifyWebhookVerifier };
