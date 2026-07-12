begin;

create schema if not exists cornerops_internal;
revoke all on schema cornerops_internal from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'cornerops_internal_runtime') then
    create role cornerops_internal_runtime nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end
$$;

grant usage on schema cornerops_internal to cornerops_internal_runtime;

create table if not exists cornerops_internal.work_items (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique not null,
  source_type text not null,
  source_id text,
  source_flow text,
  action_type text not null,
  title text not null,
  description text,
  priority text not null check (priority in ('critical','high','medium','low')),
  status text not null check (status in (
    'recommended','drafted','queued_for_approval','approved','rejected',
    'in_progress','manually_completed','dismissed','expired'
  )),
  operating_stage text,
  owner_type text,
  owner_id text,
  approval_required boolean not null default false,
  approval_status text check (approval_status is null or approval_status in (
    'pending','approved','rejected','cancelled','expired'
  )),
  evidence jsonb,
  safe_payload jsonb,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  dismissed_at timestamptz,
  version integer not null default 1 check (version > 0)
);

create table if not exists cornerops_internal.approval_requests (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references cornerops_internal.work_items(id),
  approval_type text not null,
  status text not null check (status in ('pending','approved','rejected','cancelled','expired')),
  requested_by text not null,
  requested_at timestamptz not null default now(),
  decided_by text,
  decided_at timestamptz,
  decision_reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cornerops_internal.audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  actor_type text not null,
  actor_id text,
  correlation_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists approval_requests_one_pending_per_work_item
  on cornerops_internal.approval_requests(work_item_id) where status = 'pending';
create index if not exists work_items_queue_idx
  on cornerops_internal.work_items(status, priority, created_at desc);
create index if not exists work_items_source_flow_idx
  on cornerops_internal.work_items(source_flow, action_type);
create index if not exists approval_requests_status_idx
  on cornerops_internal.approval_requests(status, requested_at desc);
create index if not exists audit_events_entity_idx
  on cornerops_internal.audit_events(entity_type, entity_id, created_at desc);
create index if not exists audit_events_correlation_idx
  on cornerops_internal.audit_events(correlation_id, created_at desc);

create or replace function cornerops_internal.reject_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'cornerops_internal.audit_events is append-only';
end
$$;

drop trigger if exists audit_events_append_only on cornerops_internal.audit_events;
create trigger audit_events_append_only
before update or delete on cornerops_internal.audit_events
for each row execute function cornerops_internal.reject_audit_mutation();

revoke all on function cornerops_internal.reject_audit_mutation() from public, anon, authenticated, service_role;

revoke all on all tables in schema cornerops_internal from public, anon, authenticated, service_role;
grant select, insert, update on cornerops_internal.work_items to cornerops_internal_runtime;
grant select, insert, update on cornerops_internal.approval_requests to cornerops_internal_runtime;
grant select, insert on cornerops_internal.audit_events to cornerops_internal_runtime;
revoke delete on all tables in schema cornerops_internal from cornerops_internal_runtime;
revoke update, delete on cornerops_internal.audit_events from cornerops_internal_runtime;

alter default privileges in schema cornerops_internal revoke all on tables from public, anon, authenticated, service_role;

commit;
