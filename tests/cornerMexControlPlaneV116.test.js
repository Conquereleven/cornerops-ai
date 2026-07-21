const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { CornerMexProgramStateService, PROGRAM_STATES } = require('../src/integrations/cornermex');
const { CanonicalInputPackService } = require('../src/core/intelligence');
const { MemoryInternalOperationsStore } = require('../src/core/work-queue/MemoryInternalOperationsStore');
const { WorkQueueService } = require('../src/core/work-queue/WorkQueueService');
const { ControlTowerFrontendContract } = require('../src/api/contracts/controlTowerFrontendContract');

const ROOT = path.join(__dirname, 'fixtures/cornermex-program');
const NOW = new Date('2026-07-20T01:00:00.000Z');
const load = async (name) => JSON.parse(await fs.readFile(path.join(ROOT, name), 'utf8'));
const makeService = ({ mutateCurrent, mutateRegistry, evidenceRoot = ROOT, maxAgeMs = 86400000, now = () => NOW } = {}) => new CornerMexProgramStateService({ evidenceRoot, maxAgeMs, now, readFile: async (file) => {
  const document = await load(path.basename(file) === 'CURRENT_STATE.json' ? 'joint-program-state-v1.json' : 'deployment-registry-v2.json');
  if (path.basename(file) === 'CURRENT_STATE.json') mutateCurrent?.(document); else mutateRegistry?.(document);
  return JSON.stringify(document);
} });

describe('CornerOps v1.16 canonical contract remediation', () => {
  test('real verbatim fixtures and provenance are compatible', async () => {
    const provenance = await load('PROVENANCE.json');
    for (const fixture of provenance.fixtures) {
      const bytes = await fs.readFile(path.join(ROOT, fixture.fixturePath));
      expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(fixture.sha256);
    }
    await expect(makeService().read()).resolves.toMatchObject({ status: 'verified_current', schemaVersions: { currentState: 'joint-program-state-v1', deploymentRegistry: 'cornermex-deployment-registry-v2' }, pendingPrs: 'not_provided', productionAutoDeploy: false });
  });

  test.each([
    ['unsupported schema', { mutateCurrent: (value) => { value.schemaVersion = 'future-v9'; } }, 'malformed', 'unsupported_canonical_schema_version'],
    ['generation mismatch', { mutateRegistry: (value) => { value.observedAt = '2026-07-20T00:02:00Z'; } }, 'drift_detected', 'canonical_evidence_generation_mismatch'],
    ['production auto-deploy', { mutateRegistry: (value) => { value.governance.contexts.find((item) => item.environment === 'production').autoDeploy = true; } }, 'drift_detected', 'production_auto_deploy_unexpectedly_active'],
    ['dangerous production trigger', { mutateRegistry: (value) => { value.governance.contexts.find((item) => item.environment === 'production').trigger = 'github_push_main'; } }, 'drift_detected', 'dangerous_production_trigger'],
    ['source SHA drift', { mutateRegistry: (value) => { value.currentSourceCommit = 'a'.repeat(40); } }, 'drift_detected', null],
  ])('%s fails closed', async (_name, options, status, blocker) => {
    const result = await makeService(options).read(); expect(result.status).toBe(status); if (blocker) expect(result.blockers).toContain(blocker);
  });

  test('future and stale timestamps have explicit precedence', async () => {
    await expect(makeService({ mutateCurrent: (value) => { value.evidence.observedAt = '2026-07-21T00:00:00Z'; value.generatedAt = value.evidence.observedAt; }, mutateRegistry: (value) => { value.observedAt = '2026-07-21T00:00:00Z'; } }).read()).resolves.toMatchObject({ status: 'stale' });
    await expect(makeService({ now: () => new Date('2026-07-25T00:00:00Z') }).read()).resolves.toMatchObject({ status: 'stale' });
  });

  test('missing root and invalid max age are observable and fail closed', async () => {
    expect((await new CornerMexProgramStateService().read()).status).toBe('unavailable');
    const result = await makeService({ maxAgeMs: -1 }).read();
    expect(result.configuration).toMatchObject({ maxAgeMs: 86400000, warnings: ['invalid_evidence_max_age_defaulted'] });
  });

  test('stable Memory identity refreshes evidence, resolves, reopens, deduplicates approvals and preserves audit', async () => {
    const store = new MemoryInternalOperationsStore(); const queue = new WorkQueueService({ store, actionEngineService: {} });
    const base = { sourceRepository: 'Conquereleven/corner-mex-uae', observedSha: 'a'.repeat(40), evidenceTimestamp: '2026-07-20T00:00:00Z', evidenceChecksum: 'one', schemaVersions: {}, blockers: [], nextActions: ['Founder decision required'] };
    const first = await queue.syncProgramState(base); const second = await queue.syncProgramState({ ...base, observedSha: 'b'.repeat(40), evidenceChecksum: 'two', evidenceTimestamp: '2026-07-20T01:00:00Z' });
    expect(first.createdWorkItems).toBe(1); expect(second.reusedWorkItems).toBe(1);
    let items = await store.listWorkItems(); expect(items).toHaveLength(1); expect(items[0].id).toMatch(/^[0-9a-f-]{36}$/); expect(items[0].evidence.evidenceChecksum).toBe('two');
    await queue.syncProgramState({ ...base, nextActions: [] }); items = await store.listWorkItems(); expect(items[0]).toMatchObject({ evidence: { conditionActive: false } });
    const returned = await queue.syncProgramState({ ...base, evidenceChecksum: 'three' }); expect(returned.reusedWorkItems).toBe(1);
    expect(await store.listApprovals()).toHaveLength(1); expect((await store.listAuditEvents()).length).toBeGreaterThan(5);
  });

  test('different kinds stay distinct and duplicate conditions collapse', async () => {
    const store = new MemoryInternalOperationsStore(); const queue = new WorkQueueService({ store, actionEngineService: {} });
    await queue.syncProgramState({ sourceRepository: 'Conquereleven/corner-mex-uae', blockers: [' Same  text '], nextActions: ['same text', 'same   text'], evidenceChecksum: 'x' });
    expect(await store.listWorkItems()).toHaveLength(2);
  });

  test('input pack integrity is exact, immutable and deterministic', () => {
    const service = new CanonicalInputPackService(); const pack = { b2bAccounts: Array.from({ length: 10 }, (_, i) => ({ id: `a${i}`, name: 'safe' })), skus: Array.from({ length: 18 }, (_, i) => ({ id: `s${i}` })) };
    const before = JSON.stringify(pack); const valid = service.validate(pack); expect(valid.status).toBe('validated'); expect(JSON.stringify(pack)).toBe(before); expect(service.validate(pack).checksum).toBe(valid.checksum);
    expect(service.validate({ ...pack, b2bAccounts: pack.b2bAccounts.map((item) => ({ ...item, id: 'duplicate' })) }).blockers).toContain('canonical_b2b_ids_duplicate');
    expect(service.validate({ ...pack, skus: [null, ...pack.skus.slice(1)] }).blockers).toContain('canonical_sku_records_invalid');
    const unsafe = JSON.parse('{"id":"unsafe","__proto__":{"polluted":true}}'); expect(service.validate({ ...pack, b2bAccounts: [unsafe, ...pack.b2bAccounts.slice(1)] }).status).toBe('canonical_input_pack_missing');
  });

  test('quote queue is wired fail-closed and frontend sanitizes malicious evidence', async () => {
    const programStateService = { read: async () => ({ status: 'drift_detected', blockers: ['<img src=x onerror=alert(1)>'], nextActions: [], writesBlocked: true, productionAutoDeploy: true, schemaVersions: {}, configuration: { evidenceRootConfigured: true } }) };
    const contract = new ControlTowerFrontendContract({ programStateService, canonicalInputPackService: new CanonicalInputPackService() });
    const daily = await contract.getSection('founder-daily'); const drafts = await contract.getSection('drafts');
    expect(daily.data.catalogAndQuoteQueue).toMatchObject({ wiringStatus: 'wired_read_only_fail_closed', quotes: [], sendStatus: 'DRAFT_NOT_SENT', externalSendAllowed: false });
    expect(drafts.data.canonicalQuoteQueue.items).toEqual([]); expect(JSON.stringify(daily)).not.toContain('<img');
  });

  test('exposes the six evidence states', () => expect(PROGRAM_STATES).toHaveLength(6));
});
