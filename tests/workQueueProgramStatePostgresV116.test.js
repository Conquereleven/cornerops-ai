const { Pool } = require('pg');
const { PostgresInternalOperationsStore } = require('../src/core/work-queue/PostgresInternalOperationsStore');
const { WorkQueueService } = require('../src/core/work-queue/WorkQueueService');

const connectionString = process.env.CORNEROPS_TEST_POSTGRES_URL;
const describePostgres = connectionString ? describe : describe.skip;
const schema = 'cornerops_internal';
const state = (overrides = {}) => ({ sourceRepository: 'Conquereleven/corner-mex-uae', observedSha: 'a'.repeat(40), evidenceTimestamp: '2026-07-20T00:00:00Z', evidenceChecksum: 'one', schemaVersions: { currentState: 'joint-program-state-v1' }, blockers: ['program blocker'], nextActions: ['Founder decision required'], ...overrides });

describePostgres('CornerOps v1.16 PostgreSQL program-state parity', () => {
  let pool; let store; let queue;
  beforeAll(async () => {
    pool = new Pool({ connectionString });
    await pool.query(`create schema if not exists ${schema}`);
    await pool.query(`create table if not exists ${schema}.work_items (id uuid primary key default gen_random_uuid(), idempotency_key text not null unique, source_type text not null, source_id text, source_flow text, action_type text not null, title text not null, description text, priority text not null, status text not null, operating_stage text, owner_type text, owner_id text, approval_required boolean not null default false, approval_status text, evidence jsonb not null default '{}', safe_payload jsonb not null default '{}', due_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz, dismissed_at timestamptz, version integer not null default 1)`);
    await pool.query(`create table if not exists ${schema}.approval_requests (id uuid primary key default gen_random_uuid(), work_item_id uuid not null references ${schema}.work_items(id), approval_type text not null, status text not null, requested_by text, requested_at timestamptz not null default now(), decided_by text, decided_at timestamptz, decision_reason text, expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`);
    await pool.query(`create unique index if not exists approvals_pending_v116 on ${schema}.approval_requests(work_item_id) where status='pending'`);
    await pool.query(`create table if not exists ${schema}.audit_events (id uuid primary key default gen_random_uuid(), event_type text not null, entity_type text not null, entity_id uuid, actor_type text, actor_id text, correlation_id text, metadata jsonb not null default '{}', created_at timestamptz not null default now())`);
    store = new PostgresInternalOperationsStore({ pool, schema }); queue = new WorkQueueService({ store, actionEngineService: {} });
  });
  beforeEach(async () => { await pool.query(`truncate ${schema}.approval_requests, ${schema}.audit_events, ${schema}.work_items`); });
  afterAll(async () => { await pool.end(); });

  test('checksum, timestamp and SHA refresh reuse UUID rows and deduplicate approvals', async () => {
    await Promise.all([queue.syncProgramState(state()), queue.syncProgramState(state())]);
    await queue.syncProgramState(state({ observedSha: 'b'.repeat(40), evidenceChecksum: 'two', evidenceTimestamp: '2026-07-20T01:00:00Z' }));
    const items = await store.listWorkItems(); expect(items).toHaveLength(2); expect(items.every((item) => /^[0-9a-f-]{36}$/.test(item.id))).toBe(true); expect(items.every((item) => item.evidence.evidenceChecksum === 'two')).toBe(true);
    expect(await store.listApprovals()).toHaveLength(1);
  });

  test('disappearance and return reconcile in repository scope with append-only audit', async () => {
    await queue.syncProgramState(state({ blockers: ['same text'], nextActions: ['same text', 'same   text'] }));
    expect(await store.listWorkItems()).toHaveLength(2);
    await queue.syncProgramState(state({ blockers: [], nextActions: [] })); expect((await store.listWorkItems()).every((item) => item.evidence.conditionActive === false)).toBe(true);
    await queue.syncProgramState(state({ blockers: ['same text'], nextActions: [] }));
    const items = await store.listWorkItems(); expect(items).toHaveLength(2); expect(items.find((item) => item.actionType === 'blocker').evidence.conditionActive).toBe(true);
    expect((await store.listAuditEvents()).some((event) => event.eventType === 'work_item_condition_returned')).toBe(true);
  });
});
