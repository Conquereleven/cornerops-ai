-- Commerce OS private multi-tenant order intake persistence.
begin;

create schema if not exists cornerops_internal;
revoke all on schema cornerops_internal from public, anon, authenticated, service_role;

create table if not exists cornerops_internal.commerce_order_intakes (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null check (tenant_id ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  source_system text not null check (length(source_system) between 1 and 80),
  external_order_id text not null check (length(external_order_id) between 1 and 160),
  source_key text not null check (length(source_key) between 5 and 320),
  source_updated_at timestamptz not null,
  fingerprint text not null check (fingerprint ~ '^[a-f0-9]{64}$'),
  revision integer not null default 1 check (revision > 0),
  assessment_status text not null check (assessment_status in ('accepted','approval_required','configuration_required')),
  assessment_issues jsonb not null default '[]'::jsonb check (jsonb_typeof(assessment_issues)='array'),
  canonical_order jsonb not null check (jsonb_typeof(canonical_order)='object'),
  actor_id text not null,
  correlation_id text,
  received_at timestamptz not null default now(),
  external_writes_performed boolean not null default false check (external_writes_performed=false),
  payment_capture_performed boolean not null default false check (payment_capture_performed=false),
  customer_messages_sent boolean not null default false check (customer_messages_sent=false),
  unique(tenant_id, source_system, external_order_id),
  unique(source_key),
  check (source_updated_at <= received_at + interval '5 minutes')
);

create table if not exists cornerops_internal.commerce_order_intake_events (
  id bigint generated always as identity primary key,
  order_intake_id uuid not null references cornerops_internal.commerce_order_intakes(id),
  tenant_id text not null,
  event_type text not null check (event_type in (
    'order_intake_created','order_intake_revised','order_intake_idempotent_replay','order_intake_source_version_conflict'
  )),
  previous_fingerprint text check (previous_fingerprint is null or previous_fingerprint ~ '^[a-f0-9]{64}$'),
  new_fingerprint text not null check (new_fingerprint ~ '^[a-f0-9]{64}$'),
  revision integer not null check (revision > 0),
  actor_id text not null,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now()
);

create index if not exists commerce_order_intakes_tenant_status_received_idx
  on cornerops_internal.commerce_order_intakes(tenant_id, assessment_status, received_at desc);
create index if not exists commerce_order_intakes_tenant_source_updated_idx
  on cornerops_internal.commerce_order_intakes(tenant_id, source_system, source_updated_at desc);
create index if not exists commerce_order_intake_events_order_created_idx
  on cornerops_internal.commerce_order_intake_events(order_intake_id, created_at desc);
create index if not exists commerce_order_intake_events_tenant_created_idx
  on cornerops_internal.commerce_order_intake_events(tenant_id, created_at desc);

alter table cornerops_internal.commerce_order_intakes enable row level security;
alter table cornerops_internal.commerce_order_intakes force row level security;
alter table cornerops_internal.commerce_order_intake_events enable row level security;
alter table cornerops_internal.commerce_order_intake_events force row level security;

drop policy if exists commerce_order_intakes_runtime_tenant on cornerops_internal.commerce_order_intakes;
create policy commerce_order_intakes_runtime_tenant on cornerops_internal.commerce_order_intakes
  for all to cornerops_internal_runtime
  using (tenant_id = nullif((select current_setting('app.current_tenant_id', true)), ''))
  with check (tenant_id = nullif((select current_setting('app.current_tenant_id', true)), ''));

drop policy if exists commerce_order_intake_events_runtime_tenant on cornerops_internal.commerce_order_intake_events;
create policy commerce_order_intake_events_runtime_tenant on cornerops_internal.commerce_order_intake_events
  for select to cornerops_internal_runtime
  using (tenant_id = nullif((select current_setting('app.current_tenant_id', true)), ''));
drop policy if exists commerce_order_intake_events_runtime_insert on cornerops_internal.commerce_order_intake_events;
create policy commerce_order_intake_events_runtime_insert on cornerops_internal.commerce_order_intake_events
  for insert to cornerops_internal_runtime
  with check (tenant_id = nullif((select current_setting('app.current_tenant_id', true)), ''));

create or replace function cornerops_internal.reject_commerce_order_event_mutation()
returns trigger language plpgsql set search_path='' as $$
begin
  if TG_OP = 'TRUNCATE' then
    raise exception 'immutable commerce order events cannot be truncated' using errcode='42501';
  end if;
  raise exception 'commerce order intake events are append-only' using errcode='42501';
end $$;

drop trigger if exists commerce_order_intake_events_append_only on cornerops_internal.commerce_order_intake_events;
create trigger commerce_order_intake_events_append_only before update or delete
on cornerops_internal.commerce_order_intake_events for each row
execute function cornerops_internal.reject_commerce_order_event_mutation();
drop trigger if exists commerce_order_intake_events_reject_truncate on cornerops_internal.commerce_order_intake_events;
create trigger commerce_order_intake_events_reject_truncate before truncate
on cornerops_internal.commerce_order_intake_events for each statement
execute function cornerops_internal.reject_commerce_order_event_mutation();

revoke all on cornerops_internal.commerce_order_intakes, cornerops_internal.commerce_order_intake_events from public, anon, authenticated, service_role;
grant select, insert, update on cornerops_internal.commerce_order_intakes to cornerops_internal_runtime;
grant select, insert on cornerops_internal.commerce_order_intake_events to cornerops_internal_runtime;
grant usage, select on sequence cornerops_internal.commerce_order_intake_events_id_seq to cornerops_internal_runtime;
revoke delete, truncate on cornerops_internal.commerce_order_intakes from cornerops_internal_runtime;
revoke update, delete, truncate on cornerops_internal.commerce_order_intake_events from cornerops_internal_runtime;
revoke all on function cornerops_internal.reject_commerce_order_event_mutation() from public, anon, authenticated, service_role;

commit;
