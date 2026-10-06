const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PostgresWorkspaceStore } = require('../src/core/identity');
const { run } = require('../scripts/workspace-grant');

const migrations = path.join(__dirname, '../supabase/migrations');
const file = '20261006100000_cornerops_workspace_authorization.sql';
const raw = fs.readFileSync(path.join(migrations, file), 'utf8');
const sql = raw.toLowerCase().replace(/--.*$/gm, '').trim();
const USER_ID = '11111111-1111-4111-8111-111111111111';

describe('workspace authorization migration (static)', () => {
  test('is additive, private-schema only and transactional', () => {
    expect([...sql.matchAll(/create table if not exists\s+cornerops_internal\.([a-z_]+)/g)].map((match) => match[1]))
      .toEqual(['workspaces', 'workspace_memberships']);
    expect(sql).not.toMatch(/(?:from|into|update|table)\s+public\./);
    expect(sql).not.toMatch(/drop\s+(?:table|schema|column)|truncate|alter table .* drop/);
    expect(sql.startsWith('begin;')).toBe(true);
    expect(sql.trim().endsWith('commit;')).toBe(true);
  });

  test('constrains roles and statuses and seeds no user', () => {
    expect(sql).toContain("check (role in ('founder','operator','viewer'))");
    expect(sql).toContain("check (status in ('active','disabled'))");
    expect(sql).toContain('unique (workspace_id, auth_user_id)');
    expect(sql).not.toMatch(/insert into cornerops_internal\.workspace_memberships/);
    expect(raw).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });

  test('the web runtime role is read-only on both tables', () => {
    expect(sql).toContain('grant select on cornerops_internal.workspaces to cornerops_internal_runtime');
    expect(sql).toContain('grant select on cornerops_internal.workspace_memberships to cornerops_internal_runtime');
    expect(sql).not.toMatch(/grant\s+[^;]*(insert|update|delete)[^;]*workspace/);
    expect(sql).not.toMatch(/grant\s+.+\s+to\s+(?:public|anon|authenticated|service_role)/);
  });
});

const connectionString = process.env.CORNEROPS_TEST_POSTGRES_URL;
const describePostgres = connectionString ? describe : describe.skip;

describePostgres('workspace authorization migration (disposable PostgreSQL)', () => {
  let pool;
  const schema = 'cornerops_internal';
  beforeAll(async () => {
    pool = new Pool({ connectionString });
    await pool.query(`drop schema if exists ${schema} cascade`);
    for (const role of ['anon', 'authenticated', 'service_role']) {
      await pool.query(`do $$ begin if not exists (select 1 from pg_roles where rolname='${role}') then create role ${role} nologin; end if; end $$`);
    }
    await pool.query(fs.readFileSync(path.join(migrations, '20260711190000_cornerops_internal_work_queue_v19.sql'), 'utf8'));
    await pool.query(raw);
    await pool.query(raw); // idempotent
  });
  afterAll(async () => { await pool.end(); });

  const asRuntime = async (statement, params = []) => {
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query('set local role cornerops_internal_runtime');
      return await client.query(statement, params);
    } finally { await client.query('rollback'); client.release(); }
  };

  test('seeds exactly the company workspace and no membership', async () => {
    expect((await pool.query(`select slug, name, status from ${schema}.workspaces`)).rows)
      .toEqual([{ slug: 'cornerops-ai', name: 'CornerOps AI', status: 'active' }]);
    expect((await pool.query(`select count(*)::int as n from ${schema}.workspace_memberships`)).rows[0].n).toBe(0);
  });

  test('constraints reject invalid roles, statuses, slugs and duplicates', async () => {
    const { id } = (await pool.query(`select id from ${schema}.workspaces`)).rows[0];
    await expect(pool.query(`insert into ${schema}.workspace_memberships (workspace_id, auth_user_id, role) values ($1,$2,'admin')`, [id, USER_ID])).rejects.toMatchObject({ code: '23514' });
    await expect(pool.query(`insert into ${schema}.workspace_memberships (workspace_id, auth_user_id, role, status) values ($1,$2,'viewer','pending')`, [id, USER_ID])).rejects.toMatchObject({ code: '23514' });
    await expect(pool.query(`insert into ${schema}.workspaces (slug, name) values ('Bad Slug','x')`)).rejects.toMatchObject({ code: '23514' });
    await expect(pool.query(`insert into ${schema}.workspace_memberships (workspace_id, auth_user_id, role) values (gen_random_uuid(),$1,'viewer')`, [USER_ID])).rejects.toMatchObject({ code: '23503' });
  });

  test('the runtime role can read but cannot write memberships or workspaces', async () => {
    await expect(asRuntime(`select count(*) from ${schema}.workspace_memberships`)).resolves.toBeTruthy();
    await expect(asRuntime(`insert into ${schema}.workspace_memberships (workspace_id, auth_user_id, role) select id, $1, 'founder' from ${schema}.workspaces`, [USER_ID])).rejects.toMatchObject({ code: '42501' });
    await expect(asRuntime(`update ${schema}.workspace_memberships set role='founder'`)).rejects.toMatchObject({ code: '42501' });
    await expect(asRuntime(`update ${schema}.workspaces set status='disabled'`)).rejects.toMatchObject({ code: '42501' });
    await expect(asRuntime(`delete from ${schema}.workspace_memberships`)).rejects.toMatchObject({ code: '42501' });
  });

  test('workspace:grant provisions, updates and disables a membership with audit', async () => {
    const env = { CORNEROPS_WORKSPACE_ADMIN_DATABASE_URL: connectionString, CORNEROPS_WORKSPACE_ADMIN_ENVIRONMENT: 'local' };
    const base = ['--workspace', 'cornerops-ai', '--user-id', USER_ID, '--environment', 'local'];
    const log = jest.fn();
    const poolFactory = (url) => new Pool({ connectionString: url, max: 1 });
    const store = new PostgresWorkspaceStore({ internalStore: { pool, table: (name) => `${schema}.${name}` } });

    expect(await run([...base, '--role', 'founder'], { env, log, poolFactory })).toMatchObject({ dryRun: true });
    expect(await store.listActiveMemberships(USER_ID)).toEqual([]);

    await run([...base, '--role', 'founder', '--confirm'], { env, log, poolFactory });
    expect(await store.listActiveMemberships(USER_ID)).toEqual([expect.objectContaining({ slug: 'cornerops-ai', role: 'founder' })]);

    await run([...base, '--role', 'viewer', '--confirm'], { env, log, poolFactory });
    expect((await store.listActiveMemberships(USER_ID))[0].role).toBe('viewer');

    await run([...base, '--role', 'viewer', '--status', 'disabled', '--confirm'], { env, log, poolFactory });
    expect(await store.listActiveMemberships(USER_ID)).toEqual([]);

    const audit = await pool.query(`select metadata from ${schema}.audit_events where event_type='workspace_membership_granted' order by created_at`);
    expect(audit.rows).toHaveLength(3);
    await expect(run(['--workspace', 'missing-workspace', '--user-id', USER_ID, '--role', 'viewer', '--environment', 'local', '--confirm'], { env, log, poolFactory }))
      .rejects.toMatchObject({ code: 'WORKSPACE_NOT_FOUND' });
  });

  test('a disabled workspace yields no membership', async () => {
    await pool.query(`update ${schema}.workspace_memberships set status='active'`);
    await pool.query(`update ${schema}.workspaces set status='disabled'`);
    const store = new PostgresWorkspaceStore({ internalStore: { pool, table: (name) => `${schema}.${name}` } });
    expect(await store.listActiveMemberships(USER_ID)).toEqual([]);
    await pool.query(`update ${schema}.workspaces set status='active'`);
  });
});

describe('workspace:grant guards', () => {
  const valid = ['--workspace', 'cornerops-ai', '--user-id', USER_ID, '--role', 'founder', '--environment', 'staging'];
  const poolFactory = jest.fn();
  const attempt = (argv, env) => run(argv, { env, poolFactory, log: jest.fn() });

  test('validates identifiers and role before anything else', async () => {
    await expect(attempt(['--workspace', 'cornerops-ai', '--user-id', 'joel@example.test', '--role', 'founder', '--environment', 'local'], {})).rejects.toMatchObject({ code: 'WORKSPACE_USER_ID_INVALID' });
    await expect(attempt(['--workspace', 'cornerops-ai', '--user-id', USER_ID, '--role', 'owner', '--environment', 'local'], {})).rejects.toMatchObject({ code: 'WORKSPACE_ROLE_INVALID' });
    await expect(attempt(['--workspace', 'X', '--user-id', USER_ID, '--role', 'viewer', '--environment', 'local'], {})).rejects.toMatchObject({ code: 'WORKSPACE_SLUG_INVALID' });
  });

  test('requires an explicit, matching environment and an admin URL', async () => {
    await expect(attempt(valid.slice(0, 6), {})).rejects.toThrow(/--environment must be one of/);
    await expect(attempt(valid, { CORNEROPS_WORKSPACE_ADMIN_ENVIRONMENT: 'production', CORNEROPS_WORKSPACE_ADMIN_DATABASE_URL: 'postgres://x' })).rejects.toThrow(/does not match/);
    await expect(attempt(valid, { CORNEROPS_WORKSPACE_ADMIN_ENVIRONMENT: 'staging', CORNEROPS_INTERNAL_DATABASE_URL: 'postgres://runtime' })).rejects.toThrow(/ADMIN_DATABASE_URL is not set/);
    expect(poolFactory).not.toHaveBeenCalled();
  });

  test('without --confirm it never opens a connection', async () => {
    const result = await attempt(valid, { CORNEROPS_WORKSPACE_ADMIN_ENVIRONMENT: 'staging', CORNEROPS_WORKSPACE_ADMIN_DATABASE_URL: 'postgres://admin@db.example/x' });
    expect(result.dryRun).toBe(true);
    expect(poolFactory).not.toHaveBeenCalled();
  });
});
