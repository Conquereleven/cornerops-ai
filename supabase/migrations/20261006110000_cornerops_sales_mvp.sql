-- CornerOps Sales MVP: workspace-scoped accounts, contacts, opportunities, activities.
-- Additive. Depends on 20261006100000_cornerops_workspace_authorization.sql.
-- Rollback: drop the four sales_* tables and reject_sales_activity_mutation().
-- Internal records only: nothing here sends, schedules or queues an external message.
begin;

create table if not exists cornerops_internal.sales_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references cornerops_internal.workspaces(id),
  name text not null check (length(btrim(name)) between 1 and 200),
  website text check (website is null or length(website) <= 300),
  segment text check (segment is null or length(segment) <= 80),
  source text check (source is null or length(source) <= 80),
  priority text check (priority is null or priority in ('high','medium','low')),
  fit_score integer check (fit_score is null or fit_score between 0 and 100),
  status text not null default 'prospect' check (status in ('prospect','active','customer','disqualified','archived')),
  owner_user_id uuid,
  problem_hypothesis text check (problem_hypothesis is null or length(problem_hypothesis) <= 2000),
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table if not exists cornerops_internal.sales_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references cornerops_internal.workspaces(id),
  account_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 200),
  title text check (title is null or length(title) <= 160),
  email text check (email is null or (length(email) <= 320 and email ~ '^[^@[:space:]]+@[^@[:space:]]+$')),
  phone text check (phone is null or length(phone) <= 40),
  linkedin_url text check (linkedin_url is null or length(linkedin_url) <= 300),
  contact_confidence text check (contact_confidence is null or contact_confidence in ('verified','likely','unverified')),
  is_primary boolean not null default false,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, account_id) references cornerops_internal.sales_accounts(workspace_id, id)
);

create table if not exists cornerops_internal.sales_opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references cornerops_internal.workspaces(id),
  account_id uuid not null,
  stage text not null default 'new' check (stage in ('new','contacted','engaged','discovery','qualified','proposal','won','lost','nurture')),
  problem_summary text check (problem_summary is null or length(problem_summary) <= 2000),
  solution_hypothesis text check (solution_hypothesis is null or length(solution_hypothesis) <= 2000),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  estimated_value numeric(14,2) check (estimated_value is null or estimated_value >= 0),
  qualification_score integer check (qualification_score is null or qualification_score between 0 and 100),
  next_step text check (next_step is null or length(next_step) <= 500),
  next_step_at timestamptz,
  owner_user_id uuid,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, account_id) references cornerops_internal.sales_accounts(workspace_id, id),
  -- A value without a currency is not a value. A missing value stays null, never zero-filled.
  check (estimated_value is null or currency is not null)
);

create table if not exists cornerops_internal.sales_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references cornerops_internal.workspaces(id),
  account_id uuid not null,
  contact_id uuid,
  opportunity_id uuid,
  type text not null check (type in ('email','call','whatsapp','linkedin','meeting','note')),
  direction text not null default 'internal' check (direction in ('inbound','outbound','internal')),
  occurred_at timestamptz not null,
  outcome text check (outcome is null or length(outcome) <= 200),
  notes text check (notes is null or length(notes) <= 5000),
  external_ref text check (external_ref is null or length(external_ref) <= 300),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  -- A logged activity is a record of something that happened. It never causes a send.
  external_send_performed boolean not null default false check (external_send_performed = false),
  foreign key (workspace_id, account_id) references cornerops_internal.sales_accounts(workspace_id, id),
  foreign key (workspace_id, contact_id) references cornerops_internal.sales_contacts(workspace_id, id),
  foreign key (workspace_id, opportunity_id) references cornerops_internal.sales_opportunities(workspace_id, id)
);

create unique index if not exists sales_contacts_one_primary_per_account_idx
  on cornerops_internal.sales_contacts(account_id) where is_primary;
create index if not exists sales_accounts_workspace_updated_idx
  on cornerops_internal.sales_accounts(workspace_id, updated_at desc);
create index if not exists sales_contacts_workspace_account_idx
  on cornerops_internal.sales_contacts(workspace_id, account_id);
create index if not exists sales_opportunities_workspace_account_idx
  on cornerops_internal.sales_opportunities(workspace_id, account_id);
create index if not exists sales_opportunities_workspace_stage_idx
  on cornerops_internal.sales_opportunities(workspace_id, stage);
create index if not exists sales_activities_workspace_account_occurred_idx
  on cornerops_internal.sales_activities(workspace_id, account_id, occurred_at desc);
create index if not exists sales_activities_contact_idx
  on cornerops_internal.sales_activities(workspace_id, contact_id) where contact_id is not null;
create index if not exists sales_activities_opportunity_idx
  on cornerops_internal.sales_activities(workspace_id, opportunity_id) where opportunity_id is not null;

create or replace function cornerops_internal.reject_sales_activity_mutation()
returns trigger language plpgsql set search_path='' as $$
begin
  raise exception 'sales activities are append-only' using errcode='42501';
end $$;

drop trigger if exists sales_activities_append_only on cornerops_internal.sales_activities;
create trigger sales_activities_append_only before update or delete
on cornerops_internal.sales_activities for each row
execute function cornerops_internal.reject_sales_activity_mutation();
drop trigger if exists sales_activities_reject_truncate on cornerops_internal.sales_activities;
create trigger sales_activities_reject_truncate before truncate
on cornerops_internal.sales_activities for each statement
execute function cornerops_internal.reject_sales_activity_mutation();

-- Workspace isolation is enforced by the database as well as by every query:
-- the runtime role only sees rows of the workspace set for the transaction.
do $$
declare t text;
begin
  foreach t in array array['sales_accounts','sales_contacts','sales_opportunities','sales_activities'] loop
    execute format('alter table cornerops_internal.%I enable row level security', t);
    execute format('alter table cornerops_internal.%I force row level security', t);
    execute format('drop policy if exists %I on cornerops_internal.%I', t || '_runtime_workspace', t);
    execute format(
      'create policy %I on cornerops_internal.%I for all to cornerops_internal_runtime
         using (workspace_id = nullif((select current_setting(''app.current_workspace_id'', true)), '''')::uuid)
         with check (workspace_id = nullif((select current_setting(''app.current_workspace_id'', true)), '''')::uuid)',
      t || '_runtime_workspace', t);
    execute format('revoke all on cornerops_internal.%I from public, anon, authenticated, service_role, cornerops_internal_runtime', t);
  end loop;
end $$;

grant select, insert, update on cornerops_internal.sales_accounts to cornerops_internal_runtime;
grant select, insert, update on cornerops_internal.sales_contacts to cornerops_internal_runtime;
grant select, insert, update on cornerops_internal.sales_opportunities to cornerops_internal_runtime;
grant select, insert on cornerops_internal.sales_activities to cornerops_internal_runtime;
revoke all on function cornerops_internal.reject_sales_activity_mutation() from public, anon, authenticated, service_role;

commit;
