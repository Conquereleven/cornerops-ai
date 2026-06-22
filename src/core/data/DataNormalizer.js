const normalizeStatus = (status, allowed, fallback = 'unknown') =>
  allowed.includes(String(status || '').toLowerCase())
    ? String(status).toLowerCase()
    : fallback;

const normalizeItems = (items = []) => (Array.isArray(items) ? items : []).map((item) => ({
  productId: item.productId,
  sku: item.sku,
  name: item.name || item.title || 'Producto sin nombre',
  quantity: Number(item.quantity || 0),
  unitPrice: item.unitPrice ?? item.priceAED ?? item.price,
  total: item.total,
}));

class DataNormalizer {
  normalizeLead(input = {}) {
    return {
      id: String(input.id || input.leadId || ''),
      externalId: input.externalId || input.leadId,
      name: input.name || input.businessName || input.companyName,
      companyName: input.companyName || input.businessName,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone || input.whatsapp,
      country: input.country || 'unknown',
      city: input.city || input.emirate,
      source: input.source || 'unknown',
      status: input.status || 'unknown',
      interestedProducts: input.interestedProducts || input.productsOfInterest || input.requestedProducts || [],
      notes: input.notes,
      priority: input.priority || 'medium',
      createdAt: input.createdAt || input.created_at || new Date().toISOString(),
      updatedAt: input.updatedAt || input.updated_at || new Date().toISOString(),
      lastContactedAt: input.lastContactedAt,
    };
  }

  normalizeQuote(input = {}) {
    return {
      id: String(input.id || input.quoteNumber || ''),
      quoteNumber: input.quoteNumber,
      leadId: input.leadId,
      customerName: input.customerName,
      companyName: input.companyName,
      status: input.status || 'unknown',
      currency: input.currency,
      subtotal: input.subtotal,
      total: input.total,
      items: normalizeItems(input.items),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: input.updatedAt || new Date().toISOString(),
      sentAt: input.sentAt,
      expiresAt: input.expiresAt,
      nextFollowUpAt: input.nextFollowUpAt,
    };
  }

  normalizeOrder(input = {}) {
    return {
      id: String(input.id || input.orderNumber || ''),
      orderNumber: input.orderNumber || input.id,
      customerName: input.customerName,
      companyName: input.companyName,
      status: input.status || 'unknown',
      paymentStatus: input.paymentStatus || 'unknown',
      paymentMethod: input.paymentMethod || 'unknown',
      currency: input.currency,
      subtotal: input.subtotal,
      total: input.total,
      items: normalizeItems(input.items),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: input.updatedAt || new Date().toISOString(),
      paidAt: input.paidAt,
      fulfillmentStatus: input.fulfillmentStatus || input.deliveryStatus,
      notes: input.notes,
    };
  }
}

module.exports = {
  DataNormalizer,
};
