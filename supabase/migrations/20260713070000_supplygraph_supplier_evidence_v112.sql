begin;

create table if not exists cornerops_internal.supplier_evidence_packages (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique check (length(idempotency_key) between 1 and 160),
  supplier_id uuid not null references cornerops_internal.supplier_profiles(id),
  evidence_scope text not null check (evidence_scope in ('production','acceptance_test')),
  evidence_model_version text not null check (evidence_model_version='supplygraph-evidence-v1.12.0'),
  ruleset_checksum text not null check (ruleset_checksum ~ '^[a-f0-9]{64}$'),
  source_type text not null check (source_type in ('supplier_quote','supplier_price_list','supplier_email_summary','supplier_call_summary','supplier_portal_observation','public_catalog_snapshot','internal_manual_verification','production_acceptance_test')),
  source_reference text check (source_reference is null or length(source_reference)<=500),
  source_checksum text not null check (source_checksum ~ '^[a-f0-9]{64}$'),
  observed_at timestamptz not null,
  valid_until timestamptz,
  verification_status text not null check (verification_status in ('unverified','source_verified','human_verified')),
  status text not null default 'pending_review' check (status in ('pending_review','applied','rejected','cancelled','expired')),
  reviewer_reference text check (reviewer_reference is null or length(reviewer_reference)<=160),
  notes text check (notes is null or length(notes)<=500),
  work_item_id uuid references cornerops_internal.work_items(id),
  approval_request_id uuid references cornerops_internal.approval_requests(id),
  created_by text not null check (length(created_by) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version>0),
  applied_at timestamptz,
  closed_at timestamptz,
  check (valid_until is null or valid_until>observed_at),
  check (observed_at<=created_at+interval '5 minutes'),
  check (verification_status<>'human_verified' or nullif(reviewer_reference,'') is not null),
  check (evidence_scope<>'production' or verification_status<>'unverified'),
  check (evidence_scope<>'acceptance_test' or source_type='production_acceptance_test'),
  check ((status='applied' and applied_at is not null) or (status<>'applied' and applied_at is null)),
  check ((status in ('rejected','cancelled','expired') and closed_at is not null) or (status not in ('rejected','cancelled','expired') and closed_at is null))
);

create table if not exists cornerops_internal.supplier_fact_observations (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references cornerops_internal.supplier_evidence_packages(id),
  supplier_id uuid not null references cornerops_internal.supplier_profiles(id),
  supplier_catalog_item_id uuid not null references cornerops_internal.supplier_catalog_items(id),
  idempotency_key text not null unique check (length(idempotency_key) between 1 and 320),
  fact_type text not null check (fact_type in ('price','stock_status','stock_quantity','minimum_order','lead_time_days','shelf_life_days','temperature_zone')),
  fact_known boolean not null,
  fact_value jsonb,
  unit text check (unit is null or length(unit)<=40),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  observed_at timestamptz not null,
  valid_until timestamptz,
  source_type text not null check (source_type in ('supplier_quote','supplier_price_list','supplier_email_summary','supplier_call_summary','supplier_portal_observation','public_catalog_snapshot','internal_manual_verification','production_acceptance_test')),
  source_reference text check (source_reference is null or length(source_reference)<=500),
  source_checksum text not null check (source_checksum ~ '^[a-f0-9]{64}$'),
  verification_status text not null check (verification_status in ('unverified','source_verified','human_verified')),
  evidence_scope text not null check (evidence_scope in ('production','acceptance_test')),
  created_at timestamptz not null default now(),
  unique(package_id,supplier_catalog_item_id,fact_type),
  check ((fact_known and fact_value is not null) or (not fact_known and fact_value is null)),
  check (valid_until is null or valid_until>observed_at),
  check (observed_at<=created_at+interval '5 minutes'),
  check (fact_type<>'price' or not fact_known or (currency is not null and unit is not null)),
  check (fact_type not in ('stock_quantity','minimum_order') or not fact_known or unit is not null)
);

create table if not exists cornerops_internal.supplier_evidence_applications (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references cornerops_internal.supplier_evidence_packages(id),
  application_fingerprint text not null unique check (application_fingerprint ~ '^[a-f0-9]{64}$'),
  preview_fingerprint text not null check (preview_fingerprint ~ '^[a-f0-9]{64}$'),
  expected_package_version integer not null check (expected_package_version>0),
  result_status text not null check (result_status in ('applied','no_material_change','acceptance_test_only','blocked_by_conflict','blocked_by_approval','blocked_by_stale_preview')),
  applied_fact_count integer not null default 0 check (applied_fact_count>=0),
  unchanged_fact_count integer not null default 0 check (unchanged_fact_count>=0),
  conflict_count integer not null default 0 check (conflict_count>=0),
  reason_codes jsonb not null default '[]'::jsonb check (jsonb_typeof(reason_codes)='array'),
  applied_by text not null check (length(applied_by) between 1 and 120),
  created_at timestamptz not null default now()
);

create index if not exists supplier_evidence_packages_supplier_status_idx on cornerops_internal.supplier_evidence_packages(supplier_id,status,created_at desc);
create index if not exists supplier_evidence_packages_scope_idx on cornerops_internal.supplier_evidence_packages(evidence_scope,status);
create index if not exists supplier_evidence_packages_checksum_idx on cornerops_internal.supplier_evidence_packages(source_checksum);
create index if not exists supplier_evidence_packages_pending_idx on cornerops_internal.supplier_evidence_packages(created_at) where status='pending_review';
create index if not exists supplier_evidence_packages_expiry_idx on cornerops_internal.supplier_evidence_packages(valid_until) where valid_until is not null;
create index if not exists supplier_evidence_packages_work_item_idx on cornerops_internal.supplier_evidence_packages(work_item_id) where work_item_id is not null;
create index if not exists supplier_evidence_packages_approval_idx on cornerops_internal.supplier_evidence_packages(approval_request_id) where approval_request_id is not null;
create index if not exists supplier_fact_catalog_type_idx on cornerops_internal.supplier_fact_observations(supplier_catalog_item_id,fact_type,observed_at desc);
create index if not exists supplier_fact_supplier_idx on cornerops_internal.supplier_fact_observations(supplier_id,observed_at desc);
create index if not exists supplier_fact_freshness_idx on cornerops_internal.supplier_fact_observations(observed_at desc,valid_until);
create index if not exists supplier_fact_verification_idx on cornerops_internal.supplier_fact_observations(verification_status,fact_type);
create index if not exists supplier_fact_expiry_idx on cornerops_internal.supplier_fact_observations(valid_until) where valid_until is not null;
create index if not exists supplier_fact_source_idx on cornerops_internal.supplier_fact_observations(source_type,source_checksum);
create index if not exists supplier_evidence_applications_package_idx on cornerops_internal.supplier_evidence_applications(package_id,created_at desc);
create index if not exists supplier_evidence_applications_conflicts_idx on cornerops_internal.supplier_evidence_applications(package_id) where conflict_count>0;

create or replace function cornerops_internal.guard_supplier_evidence_package_mutation()
returns trigger language plpgsql set search_path=cornerops_internal,pg_temp as $$
begin
  if tg_op='DELETE' then raise exception 'supplier evidence packages cannot be deleted' using errcode='42501'; end if;
  if old.id is distinct from new.id or old.idempotency_key is distinct from new.idempotency_key
     or old.supplier_id is distinct from new.supplier_id or old.evidence_scope is distinct from new.evidence_scope
     or old.evidence_model_version is distinct from new.evidence_model_version or old.ruleset_checksum is distinct from new.ruleset_checksum
     or old.source_type is distinct from new.source_type or old.source_reference is distinct from new.source_reference
     or old.source_checksum is distinct from new.source_checksum or old.observed_at is distinct from new.observed_at
     or old.valid_until is distinct from new.valid_until or old.verification_status is distinct from new.verification_status
     or old.reviewer_reference is distinct from new.reviewer_reference or old.notes is distinct from new.notes
     or old.created_by is distinct from new.created_by or old.created_at is distinct from new.created_at then
    raise exception 'immutable supplier evidence package fields cannot change' using errcode='42501';
  end if;
  if new.version<>old.version+1 then raise exception 'supplier evidence package version must increment once' using errcode='23514'; end if;
  if old.status<>'pending_review' or new.status not in ('pending_review','applied','rejected','cancelled','expired') then
    raise exception 'supplier evidence package status transition denied' using errcode='23514';
  end if;
  return new;
end $$;

create or replace function cornerops_internal.reject_supplier_evidence_append_only_mutation()
returns trigger language plpgsql set search_path=cornerops_internal,pg_temp as $$
begin raise exception 'supplier evidence records are append-only' using errcode='42501'; end $$;

create trigger supplier_evidence_packages_guard before update or delete on cornerops_internal.supplier_evidence_packages for each row execute function cornerops_internal.guard_supplier_evidence_package_mutation();
create trigger supplier_fact_observations_append_only before update or delete on cornerops_internal.supplier_fact_observations for each row execute function cornerops_internal.reject_supplier_evidence_append_only_mutation();
create trigger supplier_evidence_applications_append_only before update or delete on cornerops_internal.supplier_evidence_applications for each row execute function cornerops_internal.reject_supplier_evidence_append_only_mutation();

revoke all on cornerops_internal.supplier_evidence_packages,cornerops_internal.supplier_fact_observations,cornerops_internal.supplier_evidence_applications from public,anon,authenticated,service_role,cornerops_internal_runtime;
grant select,insert,update on cornerops_internal.supplier_evidence_packages to cornerops_internal_runtime;
grant select,insert on cornerops_internal.supplier_fact_observations,cornerops_internal.supplier_evidence_applications to cornerops_internal_runtime;
revoke delete,truncate on cornerops_internal.supplier_evidence_packages from cornerops_internal_runtime;
revoke update,delete,truncate on cornerops_internal.supplier_fact_observations,cornerops_internal.supplier_evidence_applications from cornerops_internal_runtime;
revoke execute on function cornerops_internal.guard_supplier_evidence_package_mutation() from public,anon,authenticated,service_role;
revoke execute on function cornerops_internal.reject_supplier_evidence_append_only_mutation() from public,anon,authenticated,service_role;

commit;
