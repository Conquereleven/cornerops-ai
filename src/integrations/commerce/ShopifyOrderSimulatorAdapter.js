const { commerceOsError } = require('../../core/commerce-os/commerceOsTypes');

const moneyMinor = (value, field) => {
  const normalized = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw commerceOsError(`Shopify ${field} is invalid.`, 'SHOPIFY_MONEY_INVALID', { field });
  return Math.round(Number(normalized) * 100);
};
const emirateFromProvince = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  const aliases = { dubai: 'Dubai', 'abu dhabi': 'Abu Dhabi', sharjah: 'Sharjah', ajman: 'Ajman', fujairah: 'Fujairah', 'ras al khaimah': 'Ras Al Khaimah', 'umm al quwain': 'Umm Al Quwain' };
  return aliases[normalized] || null;
};

class ShopifyOrderSimulatorAdapter {
  constructor({ shopDomain = 'simulation.invalid' } = {}) { this.shopDomain = shopDomain; }
  status() { return { adapter: 'shopify', mode: 'simulation', networkAccess: false, externalWritesAllowed: false }; }

  normalize(payload = {}, { tenantId } = {}) {
    if (!payload.id) throw commerceOsError('Shopify order ID is required.', 'SHOPIFY_ORDER_ID_REQUIRED');
    const currency = String(payload.currency || '').toUpperCase();
    const lineItems = (payload.line_items || []).map((item) => ({
      externalLineItemId: String(item.id || ''), sku: String(item.sku || '').trim() || null,
      title: String(item.title || '').trim(), quantity: Number(item.quantity),
      unitPriceMinor: moneyMinor(item.price, `line_items.${item.id}.price`),
      requiresShipping: item.requires_shipping !== false,
    }));
    const subtotalMinor = moneyMinor(payload.current_subtotal_price ?? payload.subtotal_price, 'subtotal_price');
    const discountMinor = moneyMinor(payload.current_total_discounts ?? payload.total_discounts ?? '0', 'total_discounts');
    const taxMinor = moneyMinor(payload.current_total_tax ?? payload.total_tax ?? '0', 'total_tax');
    const totalMinor = moneyMinor(payload.current_total_price ?? payload.total_price, 'total_price');
    const shippingMinor = (payload.shipping_lines || []).reduce((sum, line) => sum + moneyMinor(line.price ?? '0', 'shipping_lines.price'), 0);
    return {
      schemaVersion: 'commerce-os-order/v1', tenantId,
      source: { system: 'shopify', shopDomain: this.shopDomain, externalOrderId: String(payload.id), externalUpdatedAt: payload.updated_at || payload.created_at },
      orderNumber: String(payload.name || payload.order_number || payload.id), currency,
      createdAt: payload.created_at, financialStatus: payload.financial_status || 'unknown',
      customer: { externalCustomerId: payload.customer?.id ? String(payload.customer.id) : null, companyName: payload.shipping_address?.company || null },
      delivery: { countryCode: String(payload.shipping_address?.country_code || '').toUpperCase() || null, emirate: emirateFromProvince(payload.shipping_address?.province) },
      lineItems,
      totals: { subtotalMinor, discountMinor, taxMinor, shippingMinor, totalMinor },
      provenance: { adapter: 'shopify_simulator', simulated: true, rawPayloadStored: false },
    };
  }
}

module.exports = { ShopifyOrderSimulatorAdapter };
