const { CORNERMEX_FLOW_IDS } = require('./cornermexFlowTypes');

const defaultFlows = [
  {
    id: CORNERMEX_FLOW_IDS.B2B_LEAD,
    name: 'B2B lead follow-up',
    requiredCollections: ['leads'],
    mutates: false,
  },
  {
    id: CORNERMEX_FLOW_IDS.QUOTE_FOLLOW_UP,
    name: 'Quote follow-up',
    requiredCollections: ['quotes'],
    mutates: false,
  },
  {
    id: CORNERMEX_FLOW_IDS.ORDER_ATTENTION,
    name: 'Order attention',
    requiredCollections: ['orders'],
    mutates: false,
  },
  {
    id: CORNERMEX_FLOW_IDS.MANUAL_PAYMENT_REVIEW,
    name: 'Manual payment review',
    requiredCollections: ['orders'],
    mutates: false,
  },
  {
    id: CORNERMEX_FLOW_IDS.PRODUCT_QUALITY,
    name: 'Product quality',
    requiredCollections: ['products'],
    mutates: false,
  },
  {
    id: CORNERMEX_FLOW_IDS.CUSTOMER_FOLLOW_UP,
    name: 'Customer follow-up',
    requiredCollections: ['customers'],
    mutates: false,
  },
  {
    id: CORNERMEX_FLOW_IDS.FULFILLMENT_REVIEW,
    name: 'Fulfillment review',
    requiredCollections: ['orders'],
    mutates: false,
  },
];

class CornerMexFlowRegistry {
  constructor({ flows = defaultFlows } = {}) {
    this.flows = new Map(flows.map((flow) => [flow.id, flow]));
  }

  list() {
    return [...this.flows.values()];
  }

  get(id) {
    return this.flows.get(id) || null;
  }

  has(id) {
    return this.flows.has(id);
  }
}

module.exports = {
  CornerMexFlowRegistry,
  defaultFlows,
};
