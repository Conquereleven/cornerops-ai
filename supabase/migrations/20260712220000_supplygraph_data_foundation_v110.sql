begin;

create schema if not exists cornerops_internal;
revoke all on schema cornerops_internal from public, anon, authenticated;

create table if not exists cornerops_internal.supplier_profiles (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  canonical_name text not null,
  legal_name text,
  supplier_type text not null check (supplier_type in ('distributor','manufacturer','wholesaler','marketplace','unknown')),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  emirate text,
  status text not null check (status in ('active','inactive','under_review')),
  website text,
  source_type text not null,
  source_reference text,
  observed_at timestamptz not null,
  verified_at timestamptz,
  verification_status text not null check (verification_status in ('unverified','source_verified','human_verified')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0)
);

create table if not exists cornerops_internal.supplier_catalog_items (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references cornerops_internal.supplier_profiles(id),
  identity_key text not null,
  external_product_id text,
  supplier_sku text,
  normalized_name text not null,
  display_name text not null,
  brand text,
  category text,
  pack_size text,
  unit_of_measure text,
  temperature_zone text,
  source_type text not null,
  source_reference text,
  source_checksum text,
  active_observation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  unique (supplier_id, identity_key)
);

create table if not exists cornerops_internal.supplier_offer_snapshots (
  id uuid primary key default gen_random_uuid(),
  supplier_catalog_item_id uuid not null references cornerops_internal.supplier_catalog_items(id),
  idempotency_key text not null unique,
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  unit_price numeric(14,4) check (unit_price is null or unit_price >= 0),
  stock_status text not null check (stock_status in ('unknown','in_stock','out_of_stock','limited','preorder')),
  stock_quantity numeric(14,3) check (stock_quantity is null or stock_quantity >= 0),
  minimum_order_quantity numeric(14,3) check (minimum_order_quantity is null or minimum_order_quantity > 0),
  minimum_order_unit text,
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  shelf_life_days integer check (shelf_life_days is null or shelf_life_days >= 0),
  valid_until timestamptz,
  observed_at timestamptz not null,
  source_type text not null,
  source_reference text,
  source_checksum text not null,
  verification_status text not null check (verification_status in ('unverified','source_verified','human_verified')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists cornerops_internal.demand_requests (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  customer_reference text,
  customer_segment text not null,
  emirate text not null,
  status text not null check (status in ('needs_information','ready_for_matching','closed')),
  priority text not null check (priority in ('critical','high','medium','low')),
  required_by timestamptz,
  requested_currency text check (requested_currency is null or requested_currency ~ '^[A-Z]{3}$'),
  source_type text not null,
  source_reference text,
  internal_notes text,
  missing_fields jsonb not null default '{}'::jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  closed_at timestamptz
);

create table if not exists cornerops_internal.demand_items (
  id uuid primary key default gen_random_uuid(),
  demand_request_id uuid not null references cornerops_internal.demand_requests(id),
  item_key text not null,
  product_query text not null,
  normalized_query text not null,
  requested_quantity numeric(14,3) check (requested_quantity is null or requested_quantity > 0),
  requested_unit text,
  pack_preference text,
  brand_required boolean not null default false,
  preferred_brand text,
  substitutes_allowed boolean,
  maximum_unit_price numeric(14,4) check (maximum_unit_price is null or maximum_unit_price >= 0),
  temperature_zone text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0)
);

create unique index if not exists supplier_profiles_canonical_lookup_idx
  on cornerops_internal.supplier_profiles(canonical_key);
create index if not exists supplier_profiles_status_idx
  on cornerops_internal.supplier_profiles(status, verification_status);
create index if not exists supplier_catalog_items_supplier_idx
  on cornerops_internal.supplier_catalog_items(supplier_id, active_observation);
create index if not exists supplier_catalog_items_normalized_name_idx
  on cornerops_internal.supplier_catalog_items(normalized_name);
create unique index if not exists supplier_catalog_items_external_id_idx
  on cornerops_internal.supplier_catalog_items(supplier_id, external_product_id)
  where external_product_id is not null;
create unique index if not exists supplier_catalog_items_sku_idx
  on cornerops_internal.supplier_catalog_items(supplier_id, supplier_sku)
  where supplier_sku is not null;
create index if not exists supplier_offer_snapshots_freshness_idx
  on cornerops_internal.supplier_offer_snapshots(supplier_catalog_item_id, observed_at desc);
create index if not exists supplier_offer_snapshots_verification_idx
  on cornerops_internal.supplier_offer_snapshots(verification_status, observed_at desc);
create index if not exists demand_requests_status_idx
  on cornerops_internal.demand_requests(status, updated_at desc);
create index if not exists demand_requests_priority_idx
  on cornerops_internal.demand_requests(priority, created_at desc);
create index if not exists demand_requests_emirate_idx
  on cornerops_internal.demand_requests(emirate, status);
create index if not exists demand_requests_segment_idx
  on cornerops_internal.demand_requests(customer_segment, status);
create index if not exists demand_items_request_idx
  on cornerops_internal.demand_items(demand_request_id, active);
create unique index if not exists demand_items_one_active_key_idx
  on cornerops_internal.demand_items(demand_request_id, item_key) where active;

create or replace function cornerops_internal.reject_offer_snapshot_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'cornerops_internal.supplier_offer_snapshots is append-only';
end
$$;

create or replace trigger supplier_offer_snapshots_append_only
before update or delete on cornerops_internal.supplier_offer_snapshots
for each row execute function cornerops_internal.reject_offer_snapshot_mutation();

revoke all on all tables in schema cornerops_internal from public, anon, authenticated, service_role;
revoke all on function cornerops_internal.reject_offer_snapshot_mutation()
  from public, anon, authenticated, service_role;

grant select, insert, update on cornerops_internal.supplier_profiles to cornerops_internal_runtime;
grant select, insert, update on cornerops_internal.supplier_catalog_items to cornerops_internal_runtime;
grant select, insert on cornerops_internal.supplier_offer_snapshots to cornerops_internal_runtime;
grant select, insert, update on cornerops_internal.demand_requests to cornerops_internal_runtime;
grant select, insert, update on cornerops_internal.demand_items to cornerops_internal_runtime;

revoke delete on cornerops_internal.supplier_profiles from cornerops_internal_runtime;
revoke delete on cornerops_internal.supplier_catalog_items from cornerops_internal_runtime;
revoke update, delete on cornerops_internal.supplier_offer_snapshots from cornerops_internal_runtime;
revoke delete on cornerops_internal.demand_requests from cornerops_internal_runtime;
revoke delete on cornerops_internal.demand_items from cornerops_internal_runtime;

alter default privileges in schema cornerops_internal
  revoke all on tables from public, anon, authenticated, service_role;

commit;
