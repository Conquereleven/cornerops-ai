const {
  DEMAND_PRIORITIES,
  boundedString,
  createSupplyGraphError,
  evaluateDemandCompleteness,
  normalizeDemandItem,
  opaqueCustomerReference,
  sha256,
} = require('./supplyGraphTypes');

class DemandIntakeService {
  constructor({ store, internalStore } = {}) {
    this.store = store;
    this.internalStore = internalStore;
  }

  normalize(input = {}, actorId = 'founder') {
    const customerSegment = boundedString(input.customerSegment, 80).toLowerCase();
    const emirate = boundedString(input.emirate, 80);
    const priority = boundedString(input.priority || 'medium', 20).toLowerCase();
    const sourceType = boundedString(input.sourceType, 100).toLowerCase();
    if (!customerSegment) throw createSupplyGraphError('customerSegment is required.', 'SUPPLYGRAPH_CUSTOMER_SEGMENT_REQUIRED');
    if (!emirate) throw createSupplyGraphError('emirate is required.', 'SUPPLYGRAPH_EMIRATE_REQUIRED');
    if (!DEMAND_PRIORITIES.includes(priority)) throw createSupplyGraphError('priority is invalid.', 'SUPPLYGRAPH_PRIORITY_INVALID');
    if (!sourceType) throw createSupplyGraphError('sourceType is required.', 'SUPPLYGRAPH_SOURCE_TYPE_REQUIRED');
    if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) {
      throw createSupplyGraphError('items must contain between 1 and 50 entries.', 'SUPPLYGRAPH_ITEMS_INVALID');
    }
    const items = input.items.map((item, index) => normalizeDemandItem(item, `item-${index + 1}`));
    if (new Set(items.map((item) => item.itemKey)).size !== items.length) {
      throw createSupplyGraphError('Active demand item keys must be unique.', 'SUPPLYGRAPH_ITEM_CONFLICT', 409);
    }
    let requiredBy = null;
    if (input.requiredBy) {
      const parsed = new Date(input.requiredBy);
      if (Number.isNaN(parsed.getTime())) throw createSupplyGraphError('requiredBy is invalid.', 'SUPPLYGRAPH_REQUIRED_BY_INVALID');
      requiredBy = parsed.toISOString();
    }
    const requestedCurrency = input.requestedCurrency
      ? boundedString(input.requestedCurrency, 3).toUpperCase() : null;
    if (requestedCurrency && !/^[A-Z]{3}$/.test(requestedCurrency)) {
      throw createSupplyGraphError('requestedCurrency must be an ISO currency code.', 'SUPPLYGRAPH_CURRENCY_INVALID');
    }
    const base = {
      customerReference: opaqueCustomerReference(input.customerReference),
      customerSegment,
      emirate,
      priority,
      requiredBy,
      requestedCurrency,
      sourceType,
      sourceReference: boundedString(input.sourceReference, 500) || null,
      internalNotes: boundedString(input.internalNotes, 1000) || null,
      createdBy: boundedString(actorId, 120) || 'founder',
      items,
    };
    const completeness = evaluateDemandCompleteness(base, items);
    const canonical = JSON.stringify({
      customerReference: base.customerReference,
      customerSegment, emirate, requiredBy, requestedCurrency, sourceType,
      items: items.map((item) => ({ ...item, notes: undefined })),
    });
    return {
      ...base,
      idempotencyKey: boundedString(input.idempotencyKey, 160) || `supplygraph-demand:${sha256(canonical)}`,
      status: completeness.completeForMatching ? 'ready_for_matching' : 'needs_information',
      missingFields: completeness,
    };
  }

  async create(input, context = {}) {
    const normalized = this.normalize(input, context.actorId);
    const result = await this.store.createDemand(normalized, context);
    result.workQueue = await this.syncWorkQueue(result, context);
    return result;
  }

  async update(id, command, context = {}) {
    const result = await this.store.updateDemand(id, command, context);
    if (!result) return null;
    result.workQueue = await this.syncWorkQueue(result, context);
    return result;
  }

  async syncWorkQueue(result, context = {}) {
    const request = result.request;
    const incomplete = request.status === 'needs_information';
    const recommendations = incomplete ? [{
      idempotencyKey: `supplygraph-demand-needs-information:${request.id}`,
      sourceType: 'supplygraph',
      sourceId: request.id,
      sourceFlow: 'supplygraph_demand_intake_flow',
      actionType: 'internal_demand_information_review',
      title: 'Review incomplete B2B demand request',
      description: 'SupplyGraph detected required sourcing fields that need internal human review.',
      priority: request.priority,
      status: 'recommended',
      approvalRequired: false,
      evidence: {
        conditionActive: true,
        source: request.sourceType,
        observedAt: request.updatedAt || request.createdAt,
        demandRequestId: request.id,
        missingFieldCount: request.missingFields?.criticalMissingFields?.length || 0,
      },
      safePayload: { internalReviewOnly: true, externalActionAllowed: false },
    }] : [];
    return this.internalStore.syncRecommendations(recommendations, {
      actorType: context.actorType || 'founder',
      actorId: context.actorId || 'founder',
      correlationId: context.correlationId,
      sourceType: 'supplygraph',
      sourceId: request.id,
    });
  }
}

module.exports = { DemandIntakeService };
