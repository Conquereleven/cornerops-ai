const { CornerMexProgramStateService, PROGRAM_STATES } = require('../src/integrations/cornermex');
const { CanonicalInputPackService, QUOTE_STATUSES } = require('../src/core/intelligence');
const { MemoryInternalOperationsStore } = require('../src/core/work-queue/MemoryInternalOperationsStore');
const { WorkQueueService } = require('../src/core/work-queue/WorkQueueService');
const { ControlTowerFrontendContract } = require('../src/api/contracts/controlTowerFrontendContract');
const { CONTROL_TOWER_FRONTEND_SECTIONS } = require('../src/api/contracts/controlTowerFrontendSchemas');

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);
const NOW = new Date('2026-07-19T12:00:00.000Z');
const current = (overrides = {}) => ({
  sourceRepository: 'Conquereleven/corner-mex-uae', observedSha: SHA_A,
  governance: { deploymentPolicy: 'manual' }, health: 'healthy', readiness: 'ready',
  blockers: [], nextActions: [], pendingPrs: [], rollbackAvailable: true,
  evidenceTimestamp: '2026-07-19T11:00:00.000Z', ...overrides,
});
const deployments = (overrides = {}) => ({
  staging: { sha: SHA_A, autoDeploy: true },
  production: { sha: SHA_A, autoDeploy: false }, ...overrides,
});
const service = ({ state = current(), registry = deployments(), currentRaw, deploymentRaw, now = () => NOW, error } = {}) => new CornerMexProgramStateService({
  evidenceRoot: '/canonical', now,
  readFile: async (file) => {
    if (error) throw Object.assign(new Error('unavailable'), { code: error });
    return file.endsWith('CURRENT_STATE.json') ? (currentRaw ?? JSON.stringify(state)) : (deploymentRaw ?? JSON.stringify(registry));
  },
});

describe('CornerOps v1.16 CornerMex control plane', () => {
  test('supports the six fail-closed program states', () => expect(PROGRAM_STATES).toEqual(expect.arrayContaining(['verified_current', 'pending_pr', 'stale', 'drift_detected', 'malformed', 'unavailable'])));
  test('accepts current exact SHA evidence', async () => expect(await service().read()).toMatchObject({ status: 'verified_current', observedSha: SHA_A, stagingSha: SHA_A, productionSha: SHA_A, writesBlocked: true, routes: { read: true, write: false } }));
  test('detects SHA drift', async () => expect(await service({ state: current({ observedSha: SHA_B }) }).read()).toMatchObject({ status: 'drift_detected' }));
  test('detects stale evidence', async () => expect(await service({ state: current({ evidenceTimestamp: '2026-07-17T11:00:00.000Z' }) }).read()).toMatchObject({ status: 'stale', freshness: { fresh: false } }));
  test('rejects malformed JSON', async () => expect(await service({ currentRaw: '{bad' }).read()).toMatchObject({ status: 'malformed' }));
  test('fails closed when source is unavailable', async () => expect(await service({ error: 'ENOENT' }).read()).toMatchObject({ status: 'unavailable', blockers: ['canonical_evidence_file_missing'] }));
  test('flags unexpected production auto-deploy', async () => expect(await service({ registry: deployments({ production: { sha: SHA_A, autoDeploy: true } }) }).read()).toMatchObject({ warnings: ['production_auto_deploy_unexpectedly_active'] }));
  test('preserves degraded readiness without inventing a healthy state', async () => expect(await service({ state: current({ readiness: 'degraded', health: 'degraded' }) }).read()).toMatchObject({ readiness: 'degraded', health: 'degraded' }));

  test('materializes program work idempotently without duplicate approvals and keeps append-only audit', async () => {
    const store = new MemoryInternalOperationsStore();
    const queue = new WorkQueueService({ store, actionEngineService: {} });
    const state = await service({ state: current({ blockers: ['readiness_degraded'], nextActions: ['Founder approval decision required'] }) }).read();
    const first = await queue.syncProgramState(state);
    const auditAfterFirst = await store.listAuditEvents();
    const second = await queue.syncProgramState(state);
    const approvals = await store.listApprovals();
    const auditAfterSecond = await store.listAuditEvents();
    expect(first.createdWorkItems).toBe(2);
    expect(second.reusedWorkItems).toBe(2);
    expect(approvals).toHaveLength(1);
    expect((await store.listWorkItems()).every((item) => item.id.startsWith('cmps-') && item.evidence.sourceSha === SHA_A && item.evidence.evidenceChecksum)).toBe(true);
    expect(auditAfterSecond.length).toBeGreaterThan(auditAfterFirst.length);
  });

  test('reports missing canonical packs and never invents accounts, SKUs or quotes', () => {
    const packs = new CanonicalInputPackService();
    expect(packs.validate()).toMatchObject({ status: 'canonical_input_pack_missing', b2bAccountCount: 0, skuCount: 0, inventedData: false });
    expect(packs.buildQuoteQueue().items).toEqual([]);
  });

  test('canonical quote queue remains internal DRAFT_NOT_SENT', () => {
    const pack = { b2bAccounts: Array.from({ length: 10 }, (_, id) => ({ id: `a${id}` })), skus: Array.from({ length: 18 }, (_, id) => ({ id: `s${id}` })) };
    const queue = new CanonicalInputPackService().buildQuoteQueue(pack);
    expect(QUOTE_STATUSES).toContain('DRAFT_NOT_SENT');
    expect(queue.items.every((item) => item.sendStatus === 'DRAFT_NOT_SENT' && item.externalSendAllowed === false)).toBe(true);
  });

  test('extends the existing frontend API with no parallel API or operational mock', async () => {
    expect(CONTROL_TOWER_FRONTEND_SECTIONS).toEqual(expect.arrayContaining(['status', 'founder-daily', 'cornermex', 'work-queue', 'drafts', 'approvals', 'audit', 'capabilities', 'environment-doctor']));
    const contract = new ControlTowerFrontendContract({ programStateService: service(), canonicalInputPackService: new CanonicalInputPackService() });
    const daily = await contract.getSection('founder-daily');
    expect(daily).toMatchObject({ readOnly: true, writesBlocked: true, externalSendsBlocked: true });
    expect(daily.data.cornerMexProgramState.status).toBe('verified_current');
    expect(JSON.stringify(daily)).not.toMatch(/mock/i);
  });
});
