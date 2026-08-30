const axios = require('axios');
const { commerceOsError } = require('../../core/commerce-os/commerceOsTypes');

const ORDERS_QUERY = `query CommerceOsOrders($first: Int!, $after: String, $query: String!) {
  orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT) {
    nodes {
      id legacyResourceId name createdAt updatedAt displayFinancialStatus currencyCode
      currentSubtotalPriceSet { shopMoney { amount } }
      currentTotalDiscountsSet { shopMoney { amount } }
      currentTotalTaxSet { shopMoney { amount } }
      currentTotalPriceSet { shopMoney { amount } }
      currentShippingPriceSet { shopMoney { amount } }
      customer { id legacyResourceId }
      shippingAddress { company countryCodeV2 province }
      lineItems(first: 250) {
        nodes { id legacyResourceId sku title quantity requiresShipping originalUnitPriceSet { shopMoney { amount } } }
        pageInfo { hasNextPage }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;
const HEALTH_QUERY = 'query CommerceOsShopHealth { shop { id name myshopifyDomain } }';
const validShop = (value) => /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(String(value || ''));
const validVersion = (value) => /^20\d{2}-(01|04|07|10)$/.test(String(value || ''));

class ShopifyAdminReadClient {
  constructor({ shopDomain, accessToken, apiVersion = '2026-07', http = axios, timeoutMs = 10000 } = {}) {
    if (!validShop(shopDomain)) throw commerceOsError('A valid myshopify.com domain is required.', 'SHOPIFY_SHOP_DOMAIN_INVALID');
    if (!validVersion(apiVersion)) throw commerceOsError('A stable Shopify API version is required.', 'SHOPIFY_API_VERSION_INVALID');
    this.shopDomain = shopDomain.toLowerCase();
    this.accessToken = String(accessToken || '');
    this.apiVersion = apiVersion;
    this.http = http;
    this.timeoutMs = timeoutMs;
    this.endpoint = `https://${this.shopDomain}/admin/api/${apiVersion}/graphql.json`;
  }

  async request(query, variables = {}) {
    if (!this.accessToken) throw commerceOsError('Shopify read token is required.', 'SHOPIFY_ACCESS_TOKEN_REQUIRED');
    try {
      const response = await this.http.post(this.endpoint, { query, variables }, {
        timeout: this.timeoutMs,
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': this.accessToken },
      });
      if (response.data?.errors?.length) throw commerceOsError('Shopify returned a GraphQL error.', 'SHOPIFY_GRAPHQL_ERROR');
      return response.data?.data;
    } catch (error) {
      if (error.code?.startsWith('SHOPIFY_')) throw error;
      throw commerceOsError('Shopify read request failed.', 'SHOPIFY_READ_REQUEST_FAILED', { status: error.response?.status || null });
    }
  }

  async health() {
    try {
      const data = await this.request(HEALTH_QUERY);
      return { healthy: Boolean(data?.shop?.id), provider: 'shopify', mode: 'read_only', shopDomain: this.shopDomain, apiVersion: this.apiVersion };
    } catch (error) {
      return { healthy: false, provider: 'shopify', mode: 'read_only', shopDomain: this.shopDomain, apiVersion: this.apiVersion, reason: error.code || 'SHOPIFY_HEALTH_FAILED' };
    }
  }

  async fetchOrdersPage({ updatedAfter, cursor = null, pageSize = 100 } = {}) {
    if (!updatedAfter || !Number.isFinite(Date.parse(updatedAfter))) throw commerceOsError('A valid incremental watermark is required.', 'SHOPIFY_UPDATED_AFTER_INVALID');
    const first = Math.max(1, Math.min(250, Number(pageSize) || 100));
    const data = await this.request(ORDERS_QUERY, { first, after: cursor, query: `updated_at:>'${new Date(updatedAfter).toISOString()}'` });
    return { orders: data?.orders?.nodes || [], pageInfo: data?.orders?.pageInfo || { hasNextPage: false, endCursor: null } };
  }
}

module.exports = { ShopifyAdminReadClient };
