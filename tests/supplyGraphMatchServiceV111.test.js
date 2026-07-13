const {
  IntermexCatalogSynchronizer, SupplyGraphMatchService, SupplyGraphMatchStore,
  SupplyGraphService, SupplyGraphStore, emptyState,
} = require('../src/core/supplygraph');
const { MemoryInternalOperationsStore } = require('../src/core/work-queue/MemoryInternalOperationsStore');

const config = {
  supplyGraphEnabled: true, supplyGraphIntermexSyncEnabled: true,
  supplyGraphDemandIntakeEnabled: true, supplyGraphMatchingEnabled: true,
  supplyGraphMatchMaxCandidatesPerItem: 5, supplyGraphObservationStaleAfterHours: 168,
  supplyGraphIntermexSourceChecksum: '90f8585196507fbe3663586d5a902449828d67b52ca7db436dd06867c13f1934',
};
const context = { actorType: 'founder', actorId: 'founder-test', correlationId: 'match-v111' };

const build = () => {
  const state = emptyState();
  const workState = { workItems: [], approvals: [], auditEvents: [] };
  const internalStore = new MemoryInternalOperationsStore({ state: workState });
  const store = new SupplyGraphStore({ state, internalStore });
  const matchStore = new SupplyGraphMatchStore({ supplyGraphStore: store, internalStore });
  const matchService = new SupplyGraphMatchService({ matchStore, config });
  const service = new SupplyGraphService({ config, internalStore, store, matchStore, matchService,
    synchronizer: new IntermexCatalogSynchronizer() });
  return { state, workState, service };
};

const createReadyDemand = async (service, exactName) => service.createDemand({
  idempotencyKey: 'match-demand-v111', customerReference: 'opaque-match-v111',
  customerSegment: 'restaurant', emirate: 'Dubai', priority: 'medium',
  requiredBy: '2026-08-15T00:00:00.000Z', requestedCurrency: 'AED', sourceType: 'test',
  items: [
    { itemKey: 'known', productQuery: exactName, requestedQuantity: 10, requestedUnit: 'case', substitutesAllowed: false },
    { itemKey: 'missing', productQuery: 'acceptance-test-nonexistent-product-v111', requestedQuantity: 2, requestedUnit: 'case', substitutesAllowed: true },
  ],
}, context);

describe('SupplyGraph Match Service v1.11', () => {
  test('normalizes nested PostgreSQL offer evidence before scoring', async () => {
    const pool = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'supplier-1', canonical_name: 'Intermex UAE' }] })
        .mockResolvedValueOnce({ rows: [{
          id: 'catalog-1', display_name: 'Achiote Paste', source_checksum: 'checksum-1',
          latest_offer: {
            id: 'offer-1', source_checksum: 'checksum-1', verification_status: 'source_verified',
            unit_price: '10.5000', observed_at: '2026-07-12T00:00:00.000Z',
          },
        }] }),
    };
    const supplyGraphStore = {
      getDemand: jest.fn().mockResolvedValue({ request: { id: 'demand-1' }, items: [] }),
      isTestMemory: () => false,
      table: (name) => `cornerops_internal.${name}`,
    };
    const store = new SupplyGraphMatchStore({ supplyGraphStore, internalStore: { pool } });

    const inputs = await store.loadInputs('demand-1');

    expect(inputs.catalog[0].latestOffer).toMatchObject({
      sourceChecksum: 'checksum-1',
      verificationStatus: 'source_verified',
      unitPrice: '10.5000',
      observedAt: '2026-07-12T00:00:00.000Z',
    });
  });

  test('persists partial single-supplier assessment and reuses identical fingerprint', async () => {
    const { state, workState, service } = build();
    await service.syncIntermex(context);
    const created = await createReadyDemand(service, state.catalogItems[0].displayName);
    const first = await service.matchDemand(created.request.id, { version: 1, maxCandidatesPerItem: 5 }, context);
    expect(first).toMatchObject({ reused: false, cornerMexMutations: false, externalActionsBlocked: true,
      matchRun: { comparisonScope: 'single_verified_supplier', supplierCountEvaluated: 1,
        marketComparisonPerformed: false, bestSupplierClaim: false, coverageStatus: 'catalog_coverage_partial' } });
    expect(first.matchRun.matchedItemCount).toBe(1);
    expect(first.matchRun.unmatchedItemCount).toBe(1);
    expect(first.recommendation).toMatchObject({ recommendationType: 'mixed_coverage_review', executed: false, externalActionAllowed: false });
    expect(workState.workItems.filter((item) => item.actionType === 'review_supplygraph_match')).toHaveLength(1);
    expect(workState.approvals).toHaveLength(1);

    const repeated = await service.matchDemand(created.request.id, { version: 1 }, context);
    expect(repeated.reused).toBe(true);
    expect(repeated.matchRun.id).toBe(first.matchRun.id);
    expect(state.matchRuns).toHaveLength(1);
    expect(workState.workItems.filter((item) => item.actionType === 'review_supplygraph_match')).toHaveLength(1);
  });

  test('demand version change creates a new immutable run and stale version is rejected', async () => {
    const { state, workState, service } = build();
    await service.syncIntermex(context);
    const created = await createReadyDemand(service, state.catalogItems[0].displayName);
    const first = await service.matchDemand(created.request.id, { version: 1 }, context);
    await service.updateDemand(created.request.id, { command: 'set_priority', priority: 'high', version: 1 }, context);
    await expect(service.matchDemand(created.request.id, { version: 1 }, context)).rejects.toMatchObject({ code: 'SUPPLYGRAPH_VERSION_CONFLICT', statusCode: 409 });
    const second = await service.matchDemand(created.request.id, { version: 2 }, context);
    expect(second.matchRun.id).not.toBe(first.matchRun.id);
    expect(second.matchRun.inputFingerprint).not.toBe(first.matchRun.inputFingerprint);
    expect(state.matchRuns[0]).toMatchObject({ id: first.matchRun.id, demandVersion: 1 });
    const firstWork = workState.workItems.find((item) => item.idempotencyKey.includes(first.matchRun.inputFingerprint));
    expect(firstWork.evidence.conditionActive).toBe(false);
  });

  test('offer watermark changes create a new run and candidate ties are stable', async () => {
    const { state, service } = build();
    await service.syncIntermex(context);
    const created = await createReadyDemand(service, state.catalogItems[0].displayName);
    const first = await service.matchDemand(created.request.id, { version: 1 }, context);
    const originalOffer = state.offerSnapshots.find((offer) => offer.supplierCatalogItemId === state.catalogItems[0].id);
    state.offerSnapshots.push({ ...originalOffer, id: 'offer-new-watermark', idempotencyKey: 'offer-new-watermark', observedAt: new Date(Date.parse(originalOffer.observedAt) + 1000).toISOString() });
    const second = await service.matchDemand(created.request.id, { version: 1 }, context);
    expect(second.matchRun.id).not.toBe(first.matchRun.id);
    expect(second.matchRun.sourceWatermark).not.toBe(first.matchRun.sourceWatermark);
    second.items.forEach((item) => {
      const keys = item.candidates.filter((candidate) => candidate.matchScore === item.candidates[0]?.matchScore && candidate.confidenceScore === item.candidates[0]?.confidenceScore).map((candidate) => candidate.stableKey);
      expect(keys).toEqual([...keys].sort());
    });
  });

  test('rejects custom weights and unbounded candidate limits', async () => {
    const { state, service } = build();
    await service.syncIntermex(context);
    const created = await createReadyDemand(service, state.catalogItems[0].displayName);
    await expect(service.matchDemand(created.request.id, { version: 1, weights: { identity: 100 } }, context)).rejects.toMatchObject({ code: 'SUPPLYGRAPH_MATCH_OPTION_DENIED' });
    await expect(service.matchDemand(created.request.id, { version: 1, maxCandidatesPerItem: 11 }, context)).rejects.toMatchObject({ code: 'SUPPLYGRAPH_MATCH_CANDIDATE_LIMIT_INVALID' });
    expect(state.matchRuns).toHaveLength(0);
  });

  test('kill switch fails closed without match writes while reads stay available', async () => {
    const { state, service } = build();
    await service.syncIntermex(context);
    const created = await createReadyDemand(service, state.catalogItems[0].displayName);
    service.config.supplyGraphMatchingEnabled = false;
    await expect(service.matchDemand(created.request.id, { version: 1 }, context)).rejects.toMatchObject({ code: 'SUPPLYGRAPH_MATCHING_DISABLED', statusCode: 503 });
    expect(state.matchRuns).toHaveLength(0);
    await expect(service.listCatalog({ limit: 1 })).resolves.toHaveLength(1);
  });
});
