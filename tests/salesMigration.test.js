const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { PostgresSalesStore, SalesService } = require('../src/core/sales');
const { INTERNAL_TABLES } = require('../src/core/work-queue/workQueueTypes');

const migrations = path.join(__dirname, '../supabase/migrations');
const read = (file) => fs.readFileSync(path.join(migrations, file), 'utf8');
const raw = read('20261006110000_cornerops_sales_mvp.sql');
const sql = raw.toLowerCase().replace(/--.*$/gm, '').trim();
const TABLES = ['sales_accounts', 'sales_contacts', 'sales_opportunities', 'sales_activities'];
const USER = '11111111-1111-4111-8111-111111111111';

describe('sales migration (static)', () => {
  test('creates exactly the four private sales tables, additively', () => {
    expect([...sql.matchAll(/create table if not exists\s+cornerops_internal\.([a-z_]+)/g)].map((match) => match[1])).toEqual(TABLES);
    expect(sql).not.toMatch(/(?:from|into|update|table)\s+public\./);
    expect(sql).not.toMatch(/drop\s+(?:table|schema|column)|alter table [^;]* drop /);
    expect(sql.startsWith('begin;')).toBe(true);
    expect(sql.endsWith('commit;')).toBe(true);
    for (const table of TABLES) expect(INTERNAL_TABLES).toContain(table);
  });

  test('every table is workspace-scoped with forced row-level security', () => {
    expect(sql.match(/workspace_id uuid not null references cornerops_internal\.workspaces\(id\)/g)).toHaveLength(4);
    expect(sql).toContain('force row level security');
    expect(sql).toContain("current_setting(''app.current_workspace_id'', true)");
    expect(sql.match(/foreign key \(workspace_id, account_id\) references cornerops_internal\.sales_accounts\(workspace_id, id\)/g)).toHaveLength(3);
  });

  test('constrains stages, forbids valueless amounts and makes activities append-only and send-free', () => {
    expect(sql).toContain("stage in ('new','contacted','engaged','discovery','qualified','proposal','won','lost','nurture')");
    expect(sql).toContain('check (estimated_value is null or currency is not null)');
    expect(sql).toContain('check (external_send_performed = false)');
    expect(sql).toContain('sales_activities_append_only');
    expect(sql).toContain('grant select, insert on cornerops_internal.sales_activities to cornerops_internal_runtime');
    expect(sql).not.toMatch(/grant\s+[^;]*delete/);
    expect(sql).not.toMatch(/grant\s+.+\s+to\s+(?:public|anon|authenticated|service_role)/);
  });

  test('seeds no prospect data and has no relation to the v1.17B commercial migration', () => {
    expect(sql).not.toMatch(/insert into/);
    expect(sql).not.toMatch(/commercial_/);
    expect(fs.readdirSync(migrations).filter((file) => /v117b|activation_readiness/i.test(file))).toEqual([]);
  });
});

const connectionString = process.env.CORNEROPS_TEST_POSTGRES_URL;
const describePostgres = connectionString ? describe : describe.skip;

describePostgres('sales migration (disposable PostgreSQL)', () => {
  const schema = 'cornerops_internal';
  let admin; let runtime; let service; let workspaceA; let workspaceB;
  const context = (workspaceId) => ({ workspaceId, userId: USER, correlationId: 'test' });

  beforeAll(async () => {
    admin = new Pool({ connectionString });
    await admin.query(`drop schema if exists ${schema} cascade`);
    for (const role of ['anon', 'authenticated', 'service_role']) {
      await admin.query(`do $$ begin if not exists (select 1 from pg_roles where rolname='${role}') then create role ${role} nologin; end if; end $$`);
    }
    await admin.query(read('20260711190000_cornerops_internal_work_queue_v19.sql'));
    await admin.query(read('20261006100000_cornerops_workspace_authorization.sql'));
    await admin.query(raw);
    await admin.query(raw); // idempotent
    workspaceA = (await admin.query(`select id from ${schema}.workspaces where slug='cornerops-ai'`)).rows[0].id;
    workspaceB = (await admin.query(`insert into ${schema}.workspaces (slug, name) values ('second-workspace','Second') returning id`)).rows[0].id;

    // The application connects as the least-privileged runtime role.
    runtime = new Pool({ connectionString, options: '-c role=cornerops_internal_runtime' });
    const internalStore = {
      pool: runtime,
      table: (name) => `${schema}.${name}`,
      async withTransaction(callback) {
        const client = await runtime.connect();
        try { await client.query('begin'); const result = await callback(client); await client.query('commit'); return result; }
        catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
      },
      async appendAudit(client, event) {
        await client.query(
          `insert into ${schema}.audit_events (event_type, entity_type, entity_id, actor_type, actor_id, correlation_id, metadata) values ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
          [event.eventType, event.entityType, event.entityId, event.actorType, event.actorId, event.correlationId, JSON.stringify(event.metadata)],
        );
      },
    };
    service = new SalesService({ store: new PostgresSalesStore({ internalStore }) });
  });
  afterAll(async () => { await runtime.end(); await admin.end(); });

  test('full record lifecycle through the runtime role', async () => {
    const account = await service.createAccount(context(workspaceA), { name: 'Example Trading LLC', priority: 'high' });
    const contact = await service.createContact(context(workspaceA), account.id, { name: 'Ana Ejemplo', email: 'ana@example.test', isPrimary: true });
    const second = await service.createContact(context(workspaceA), account.id, { name: 'Second Example', isPrimary: true });
    const opportunity = await service.createOpportunity(context(workspaceA), account.id, { estimatedValue: 1500.5, currency: 'AED', nextStep: 'Call', nextStepAt: '2020-01-01T00:00:00Z' });
    await service.createActivity(context(workspaceA), account.id, { type: 'call', contactId: contact.id, opportunityId: opportunity.id });
    await service.updateOpportunity(context(workspaceA), opportunity.id, { stage: 'qualified' });

    const detail = await service.getAccount(context(workspaceA), account.id);
    expect(detail.contacts.filter((item) => item.isPrimary).map((item) => item.id)).toEqual([second.id]);
    expect(detail.opportunities[0]).toMatchObject({ stage: 'qualified', estimatedValue: 1500.5, currency: 'AED' });
    expect(detail.activities).toHaveLength(1);
    const summary = await service.summary(context(workspaceA));
    expect(summary.pipelineValue).toEqual([{ currency: 'AED', total: 1500.5, opportunities: 1 }]);
    expect(summary.nextActionsDue).toHaveLength(1);

    const audit = await admin.query(`select event_type, metadata from ${schema}.audit_events where event_type like 'sales_%' order by created_at`);
    expect(audit.rows.map((row) => row.event_type)).toEqual([
      'sales_account_created', 'sales_contact_created', 'sales_contact_created', 'sales_opportunity_created', 'sales_activity_created', 'sales_opportunity_updated',
    ]);
    expect(JSON.stringify(audit.rows)).not.toContain('ana@example.test');
  });

  test('workspace B sees nothing from workspace A, through the service and through raw SQL', async () => {
    const [account] = await service.listAccounts(context(workspaceA));
    expect(await service.listAccounts(context(workspaceB))).toEqual([]);
    await expect(service.getAccount(context(workspaceB), account.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.updateAccount(context(workspaceB), account.id, { name: 'Hijacked' })).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.createContact(context(workspaceB), account.id, { name: 'Planted' })).rejects.toMatchObject({ statusCode: 404 });

    const client = await runtime.connect();
    try {
      // No workspace bound: row-level security hides everything.
      expect((await client.query(`select count(*)::int as n from ${schema}.sales_accounts`)).rows[0].n).toBe(0);
      await client.query('begin');
      await client.query("select set_config('app.current_workspace_id', $1, true)", [workspaceB]);
      expect((await client.query(`select count(*)::int as n from ${schema}.sales_accounts`)).rows[0].n).toBe(0);
      expect((await client.query(`update ${schema}.sales_accounts set name='Hijacked'`)).rowCount).toBe(0);
      // Writing a row for another workspace is refused by the policy.
      await expect(client.query(`insert into ${schema}.sales_accounts (workspace_id, name, created_by, updated_by) values ($1,'Planted',$2,$2)`, [workspaceA, USER])).rejects.toMatchObject({ code: '42501' });
      await client.query('rollback');
      // A contact cannot point at an account of another workspace.
      await client.query('begin');
      await client.query("select set_config('app.current_workspace_id', $1, true)", [workspaceB]);
      await expect(client.query(`insert into ${schema}.sales_contacts (workspace_id, account_id, name, created_by, updated_by) values ($1,$2,'Planted',$3,$3)`, [workspaceB, account.id, USER])).rejects.toMatchObject({ code: '23503' });
    } finally { await client.query('rollback'); client.release(); }
    expect((await service.getAccount(context(workspaceA), account.id)).account.name).toBe('Example Trading LLC');
  });

  test('database constraints back up the API validation', async () => {
    const [account] = await service.listAccounts(context(workspaceA));
    const insert = (statement, params) => admin.query(statement, params);
    await expect(insert(`insert into ${schema}.sales_opportunities (workspace_id, account_id, stage, created_by, updated_by) values ($1,$2,'closing',$3,$3)`, [workspaceA, account.id, USER])).rejects.toMatchObject({ code: '23514' });
    await expect(insert(`insert into ${schema}.sales_opportunities (workspace_id, account_id, estimated_value, created_by, updated_by) values ($1,$2,100,$3,$3)`, [workspaceA, account.id, USER])).rejects.toMatchObject({ code: '23514' });
    await expect(insert(`insert into ${schema}.sales_activities (workspace_id, account_id, type, occurred_at, created_by) values ($1,$2,'sms',now(),$3)`, [workspaceA, account.id, USER])).rejects.toMatchObject({ code: '23514' });
    await expect(insert(`insert into ${schema}.sales_activities (workspace_id, account_id, type, occurred_at, created_by, external_send_performed) values ($1,$2,'email',now(),$3,true)`, [workspaceA, account.id, USER])).rejects.toMatchObject({ code: '23514' });
    await expect(insert(`insert into ${schema}.sales_contacts (workspace_id, account_id, name, is_primary, created_by, updated_by) values ($1,$2,'Dup Primary',true,$3,$3)`, [workspaceA, account.id, USER])).rejects.toMatchObject({ code: '23505' });
  });

  test('activities are append-only and the runtime role cannot delete sales records', async () => {
    await expect(admin.query(`update ${schema}.sales_activities set notes='edited'`)).rejects.toMatchObject({ code: '42501' });
    await expect(admin.query(`delete from ${schema}.sales_activities`)).rejects.toMatchObject({ code: '42501' });
    const client = await runtime.connect();
    try {
      await client.query('begin');
      await client.query("select set_config('app.current_workspace_id', $1, true)", [workspaceA]);
      await expect(client.query(`delete from ${schema}.sales_accounts`)).rejects.toMatchObject({ code: '42501' });
    } finally { await client.query('rollback'); client.release(); }
  });

  test('a failed transaction leaves nothing behind', async () => {
    const [account] = await service.listAccounts(context(workspaceA));
    const before = (await admin.query(`select (select count(*) from ${schema}.sales_activities)::int as activities, (select count(*) from ${schema}.audit_events)::int as audit`)).rows[0];
    await expect(service.createActivity(context(workspaceA), account.id, { type: 'note', contactId: '99999999-9999-4999-8999-999999999999' })).rejects.toMatchObject({ statusCode: 404 });
    const after = (await admin.query(`select (select count(*) from ${schema}.sales_activities)::int as activities, (select count(*) from ${schema}.audit_events)::int as audit`)).rows[0];
    expect(after).toEqual(before);
  });
});
