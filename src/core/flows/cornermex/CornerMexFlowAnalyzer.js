const { CORNERMEX_FLOW_IDS } = require('./cornermexFlowTypes');

const lower = (value) => String(value || '').toLowerCase();
const includesAny = (value, terms) => terms.some((term) => lower(value).includes(term));

class CornerMexFlowAnalyzer {
  analyze({ collections = {}, dataSource = 'mock_fallback', sourceMode = 'mock', status = {}, tableAvailability = {} } = {}) {
    const leads = collections.leads?.data || [];
    const quotes = collections.quotes?.data || [];
    const orders = collections.orders?.data || [];
    const products = collections.products?.data || [];
    const customers = collections.customers?.data || [];

    const flows = [
      this.b2bLeadFlow(leads),
      this.quoteFollowUpFlow(quotes),
      this.orderAttentionFlow(orders),
      this.manualPaymentReviewFlow(orders),
      this.productQualityFlow(products),
      this.customerFollowUpFlow(customers),
      this.fulfillmentReviewFlow(orders),
    ].map((flow) => ({
      ...flow,
      sourceMode,
      readOnly: true,
      writesBlocked: true,
      sendStatus: 'not_sendable_in_v1.2',
    }));

    const warnings = [
      ...(status.warnings || []),
      ...flows.flatMap((flow) => flow.warnings || []),
    ];

    return {
      sourceMode,
      dataSource,
      tableAvailability,
      supabaseStatus: status.supabaseStatus || 'not_configured',
      maskingApplied: status.maskingApplied !== false,
      lastReadAt: status.lastReadAt || null,
      flows,
      summary: {
        totalFlows: flows.length,
        flowsWithData: flows.filter((flow) => flow.records.length > 0).map((flow) => flow.id),
        flowsMissingData: flows.filter((flow) => flow.records.length === 0).map((flow) => flow.id),
        candidates: flows.reduce((acc, flow) => {
          acc[flow.id] = flow.records.length;
          return acc;
        }, {}),
      },
      warnings: [...new Set(warnings)],
    };
  }

  b2bLeadFlow(leads) {
    const records = leads
      .filter((lead) => includesAny(lead.status, ['follow', 'warm', 'pending', 'new']))
      .map((lead) => ({
        id: lead.id,
        label: lead.businessName || lead.id,
        type: lead.businessType || 'unknown',
        reason: `Lead status=${lead.status || 'unknown'} needs founder follow-up.`,
        proposedTask: `Follow up B2B lead ${lead.businessName || lead.id}.`,
      }));
    return {
      id: CORNERMEX_FLOW_IDS.B2B_LEAD,
      records,
      warnings: records.length ? [] : ['No B2B lead records available for follow-up analysis.'],
    };
  }

  quoteFollowUpFlow(quotes) {
    const records = quotes
      .filter((quote) => includesAny(quote.status, ['follow', 'sent', 'pending']))
      .map((quote) => ({
        id: quote.id,
        label: quote.id,
        reason: `Quote status=${quote.status || 'unknown'} may need follow-up.`,
        proposedTask: `Review and follow up quote ${quote.id}.`,
      }));
    return {
      id: CORNERMEX_FLOW_IDS.QUOTE_FOLLOW_UP,
      records,
      warnings: records.length ? [] : ['No quote records available for follow-up analysis.'],
    };
  }

  orderAttentionFlow(orders) {
    const records = orders
      .filter((order) => includesAny(`${order.status} ${order.paymentStatus}`, ['pending', 'review', 'attention', 'failed']))
      .map((order) => ({
        id: order.id,
        label: order.id,
        reason: `Order status=${order.status || 'unknown'} payment=${order.paymentStatus || 'unknown'}.`,
        proposedTask: `Review order ${order.id}; do not change status from Telegram.`,
      }));
    return {
      id: CORNERMEX_FLOW_IDS.ORDER_ATTENTION,
      records,
      warnings: records.length ? [] : ['No orders available for attention analysis.'],
    };
  }

  manualPaymentReviewFlow(orders) {
    const records = orders
      .filter((order) => includesAny(`${order.paymentMethod} ${order.paymentStatus}`, ['bank transfer', 'manual', 'cod', 'pending']))
      .map((order) => ({
        id: order.id,
        label: order.id,
        reason: `${order.paymentMethod || 'Unknown payment method'} requires human review.`,
        proposedTask: `Review payment evidence for ${order.id}; never mark paid automatically.`,
      }));
    return {
      id: CORNERMEX_FLOW_IDS.MANUAL_PAYMENT_REVIEW,
      records,
      warnings: records.length ? [] : ['No manual payment review candidates found.'],
    };
  }

  productQualityFlow(products) {
    const records = products
      .map((product) => {
        const missing = ['name', 'category', 'priceAED', 'stock']
          .filter((field) => product[field] === undefined || product[field] === null || product[field] === '');
        return { product, missing };
      })
      .filter(({ missing }) => missing.length > 0)
      .map(({ product, missing }) => ({
        id: product.id,
        label: product.name || product.sku || product.id,
        reason: `Missing product fields: ${missing.join(', ')}.`,
        proposedTask: `Fix product data for ${product.sku || product.id}.`,
      }));
    return {
      id: CORNERMEX_FLOW_IDS.PRODUCT_QUALITY,
      records,
      warnings: records.length ? [] : ['No product quality issues detected in available fields.'],
    };
  }

  customerFollowUpFlow(customers) {
    const records = customers
      .filter((customer) => includesAny(`${customer.status} ${customer.notes}`, ['follow', 'pending', 'warm']))
      .map((customer) => ({
        id: customer.id,
        label: customer.name || customer.email || customer.id,
        reason: 'Customer has follow-up signal in available fields.',
        proposedTask: `Prepare customer follow-up draft for ${customer.id}.`,
      }));
    return {
      id: CORNERMEX_FLOW_IDS.CUSTOMER_FOLLOW_UP,
      records,
      warnings: records.length ? [] : ['No customer follow-up signals found in available fields.'],
    };
  }

  fulfillmentReviewFlow(orders) {
    const records = orders
      .filter((order) => includesAny(`${order.status} ${order.fulfillmentStatus}`, ['pending_delivery', 'fulfillment', 'pending', 'delayed']))
      .map((order) => ({
        id: order.id,
        label: order.id,
        reason: `Fulfillment/order status=${order.fulfillmentStatus || order.status || 'unknown'}.`,
        proposedTask: `Review fulfillment state for ${order.id}; do not update fulfillment from Telegram.`,
      }));
    return {
      id: CORNERMEX_FLOW_IDS.FULFILLMENT_REVIEW,
      records,
      warnings: records.length ? [] : ['No fulfillment review candidates found.'],
    };
  }
}

module.exports = { CornerMexFlowAnalyzer };
