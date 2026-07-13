const {
  IntermexCatalogSynchronizer,
  SupplyGraphService,
  SupplyGraphStore,
  emptyState,
  sha256,
} = require('../src/core/supplygraph');
const { MemoryInternalOperationsStore } = require('../src/core/work-queue/MemoryInternalOperationsStore');

const config = {
  supplyGraphEnabled: true,
  supplyGraphIntermexSyncEnabled: true,
  supplyGraphDemandIntakeEnabled: true,
  supplyGraphObservationStaleAfterHours: 168,
};
const context = { actorType: 'founder', actorId: 'founder-test', correlationId: 'supplygraph-test' };

const build = () => {
  const state = emptyState();
  const workState = { workItems: [], approvals: [], auditEvents: [] };
  const internalStore = new MemoryInternalOperationsStore({ state: workState });
  const store = new SupplyGraphStore({ state, internalStore });
  const service = new SupplyGraphService({ config, internalStore, store });
  return { internalStore, service, state, store, workState };
};

const incompleteDemand = () => ({
  idempotencyKey: 'demand-test-1',
  customerReference: 'opaque-test-b2b-v110',
  customerSegment: 'restaurant',
  emirate: 'Dubai',
  priority: 'medium',
  sourceType: 'production_acceptance_test',
  internalNotes: 'Buyer test@example.com, call +971 50 123 4567',
  items: [
    { itemKey: 'tajin', productQuery: 'Tajin seasoning', brandRequired: true, preferredBrand: 'Tajin' },
    { itemKey: 'pulparindo', productQuery: 'Pulparindo', requestedQuantity: 10, requestedUnit: 'case', substitutesAllowed: false },
  ],
});

describe('SupplyGraph data foundation v1.10', () => {
  test('loads the reviewed 190-row snapshot without trusting synthetic stock', () => {
    const source = new IntermexCatalogSynchronizer().load();
    expect(source).toMatchObject({ scannedItems: 190, sourceChecksum: '90f8585196507fbe3663586d5a902449828d67b52ca7db436dd06867c13f1934' });
    expect(source.items).toHaveLength(190);
    expect(source.skipped).toEqual([]);
    expect(new Set(source.items.map((item) => item.offer.stockStatus))).toEqual(new Set(['unknown']));
    expect(new Set(source.items.map((item) => item.offer.stockQuantity))).toEqual(new Set([null]));
  });

  test('first sync creates stable identities and second sync is idempotent', async () => {
    const { service, state } = build();
    const first = await service.syncIntermex(context);
    expect(first).toMatchObject({
      supplierCreated: true, createdCatalogItems: 190, createdOfferSnapshots: 190,
      cornerMexMutations: false, externalActions: false,
    });
    const second = await service.syncIntermex(context);
    expect(second).toMatchObject({
      supplierReused: true, createdCatalogItems: 0, reusedCatalogItems: 190,
      createdOfferSnapshots: 0, unchangedOfferSnapshots: 190,
    });
    expect(state.suppliers).toHaveLength(1);
    expect(state.catalogItems).toHaveLength(190);
    expect(state.offerSnapshots).toHaveLength(190);
  });

  test('material price change appends one snapshot while irrelevant timing does not', async () => {
    const { internalStore, state, store } = build();
    const source = new IntermexCatalogSynchronizer().load();
    await store.syncCatalog(source, context);
    const changed = JSON.parse(JSON.stringify(source));
    changed.items = [changed.items[0]];
    changed.scannedItems = 1;
    changed.items[0].offer.unitPrice += 1;
    changed.items[0].offer.idempotencyKey = sha256(JSON.stringify([
      changed.items[0].identityKey,
      {
        currency: changed.items[0].offer.currency,
        unitPrice: changed.items[0].offer.unitPrice,
        stockStatus: 'unknown', stockQuantity: null, minimumOrderQuantity: null,
        minimumOrderUnit: null, leadTimeDays: null, shelfLifeDays: null, validUntil: null,
      },
    ]));
    const result = await store.syncCatalog(changed, context);
    expect(result.createdOfferSnapshots).toBe(1);
    expect(state.offerSnapshots).toHaveLength(191);
    expect(internalStore.state).toBeDefined();
  });

  test('demand intake sanitizes PII, detects missing fields and is idempotent', async () => {
    const { service, state, workState } = build();
    const first = await service.createDemand(incompleteDemand(), context);
    expect(first.created).toBe(true);
    expect(first.request.status).toBe('needs_information');
    expect(first.request.missingFields.criticalMissingFields).toContain('required_by');
    expect(first.request.internalNotes).not.toContain('test@example.com');
    expect(first.request.internalNotes).not.toContain('+971 50 123 4567');
    const second = await service.createDemand(incompleteDemand(), context);
    expect(second.created).toBe(false);
    expect(state.demandRequests).toHaveLength(1);
    expect(workState.workItems).toHaveLength(1);
    expect(workState.workItems[0].evidence).not.toHaveProperty('internalNotes');
  });

  test('optimistic locking, readiness and non-destructive closure are enforced', async () => {
    const { service, state } = build();
    const created = await service.createDemand(incompleteDemand(), context);
    await expect(service.updateDemand(created.request.id, {
      command: 'mark_ready_for_matching', version: 1,
    }, context)).rejects.toMatchObject({ code: 'SUPPLYGRAPH_DEMAND_INCOMPLETE', statusCode: 409 });
    const required = await service.updateDemand(created.request.id, {
      command: 'set_required_by', version: 1, requiredBy: '2026-08-01T00:00:00.000Z',
    }, context);
    await expect(service.updateDemand(created.request.id, {
      command: 'set_priority', version: 1, priority: 'high',
    }, context)).rejects.toMatchObject({ code: 'SUPPLYGRAPH_VERSION_CONFLICT', statusCode: 409 });
    await expect(service.updateDemand(created.request.id, {
      command: 'deactivate_item', version: required.request.version, itemKey: 'tajin',
    }, context)).rejects.toMatchObject({ code: 'SUPPLYGRAPH_REASON_REQUIRED' });
    const closed = await service.updateDemand(created.request.id, {
      command: 'close_request', version: required.request.version, reason: 'Acceptance test completed.',
    }, context);
    expect(closed.request.status).toBe('closed');
    expect(state.demandRequests).toHaveLength(1);
    expect(state.demandItems).toHaveLength(2);
    expect(state.auditEvents.length).toBeGreaterThan(2);
  });

  test('status reports truthfully without matching or external execution', async () => {
    const { service } = build();
    await service.syncIntermex(context);
    const status = await service.status();
    expect(status).toMatchObject({
      status: 'ready',
      matchingEngineStatus: 'not_implemented',
      supplierOutreachStatus: 'blocked',
      autonomousPurchasingStatus: 'blocked',
      cornerMexWritesBlocked: true,
      externalActionsBlocked: true,
    });
    expect(status.metrics).toMatchObject({ supplierCount: 1, catalogItemCount: 190, offerSnapshotCount: 190 });
  });
});
