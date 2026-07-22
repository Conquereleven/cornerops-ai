-- CO-1.17A proposed private migration. REVIEW ONLY: do not apply without separate approval.
begin;

create schema if not exists cornerops_internal;
revoke all on schema cornerops_internal from public, anon, authenticated, service_role;

create table if not exists cornerops_internal.commercial_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'input_pack','account','sku','opportunity','quote','order','payment',
    'fulfillment','exception','daily_close'
  )),
  stable_key text not null check (length(stable_key) between 1 and 160),
  payload jsonb not null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_type, stable_key)
);

create table if not exists cornerops_internal.commercial_transition_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_stable_key text not null,
  previous_state text,
  new_state text,
  actor_id text not null,
  reason text not null,
  evidence jsonb not null default '{}'::jsonb,
  correlation_id text,
  external_send_performed boolean not null default false check (external_send_performed=false),
  payment_capture_performed boolean not null default false check (payment_capture_performed=false),
  cornermex_write_performed boolean not null default false check (cornermex_write_performed=false),
  created_at timestamptz not null default now(),
  foreign key(entity_type, entity_stable_key)
    references cornerops_internal.commercial_entities(entity_type, stable_key)
);

create index if not exists commercial_entities_type_status_idx
  on cornerops_internal.commercial_entities(entity_type, (payload->>'status'), updated_at desc);
create index if not exists commercial_entities_account_idx
  on cornerops_internal.commercial_entities((payload->>'accountId'), entity_type);
create index if not exists commercial_transition_entity_idx
  on cornerops_internal.commercial_transition_events(entity_type, entity_stable_key, created_at desc);

create or replace function cornerops_internal.reject_commercial_transition_mutation()
returns trigger language plpgsql set search_path='' as $$
begin
  raise exception 'commercial transition evidence is append-only' using errcode='42501';
end $$;

drop trigger if exists commercial_transition_events_append_only on cornerops_internal.commercial_transition_events;
create trigger commercial_transition_events_append_only before update or delete
on cornerops_internal.commercial_transition_events for each row
execute function cornerops_internal.reject_commercial_transition_mutation();

revoke all on all tables in schema cornerops_internal from public, anon, authenticated, service_role;
grant select, insert, update on cornerops_internal.commercial_entities to cornerops_internal_runtime;
grant select, insert on cornerops_internal.commercial_transition_events to cornerops_internal_runtime;
revoke delete, truncate on cornerops_internal.commercial_entities, cornerops_internal.commercial_transition_events from cornerops_internal_runtime;
revoke update, delete, truncate on cornerops_internal.commercial_transition_events from cornerops_internal_runtime;
revoke all on function cornerops_internal.reject_commercial_transition_mutation() from public,anon,authenticated,service_role;

commit;
