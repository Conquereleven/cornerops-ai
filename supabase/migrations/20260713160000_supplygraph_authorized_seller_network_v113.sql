begin;

alter table cornerops_internal.supplier_profiles
  add column if not exists seller_type text,
  add column if not exists channel_type text,
  add column if not exists official_website text,
  add column if not exists website_hostname text,
  add column if not exists authorization_status text check(authorization_status is null or authorization_status in('founder_attested','documented','suspended','revoked')),
  add column if not exists authorization_basis text,
  add column if not exists authorization_reference text,
  add column if not exists authorized_at timestamptz,
  add column if not exists source_verification_status text,
  add column if not exists catalog_capture_status text,
  add column if not exists pipeline_source text,
  add column if not exists pipeline_score integer check(pipeline_score is null or pipeline_score between 0 and 100),
  add column if not exists pipeline_priority text,
  add column if not exists pipeline_wave text,
  add column if not exists pipeline_segment text,
  add column if not exists pipeline_onboarding_model text,
  add column if not exists pipeline_channel_target text,
  add column if not exists product_count integer not null default 0 check(product_count>=0),
  add column if not exists primary_logo_source_url text,
  add column if not exists managed_logo_url text,
  add column if not exists profile_source_checksum text check(profile_source_checksum is null or profile_source_checksum~'^[a-f0-9]{64}$'),
  add column if not exists profile_observed_at timestamptz;

create table cornerops_internal.supplier_onboarding_packages (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  supplier_canonical_key text not null,
  evidence_scope text not null check(evidence_scope in('production','acceptance_test')),
  onboarding_model_version text not null,
  onboarding_ruleset_checksum text not null check(onboarding_ruleset_checksum~'^[a-f0-9]{64}$'),
  snapshot_schema_version text not null,
  snapshot_key text not null,
  snapshot_checksum text not null check(snapshot_checksum~'^[a-f0-9]{64}$'),
  proposed_profile jsonb not null check(jsonb_typeof(proposed_profile)='object'),
  status text not null default 'pending_review' check(status in('pending_review','applied','rejected','cancelled','expired')),
  verification_status text not null check(verification_status in('unverified','source_verified','human_verified')),
  authorization_status text not null check(authorization_status in('founder_attested','documented','suspended','revoked')),
  catalog_item_count integer not null default 0 check(catalog_item_count between 0 and 250),
  image_reference_count integer not null default 0 check(image_reference_count between 0 and 750),
  payload_fingerprint text not null unique check(payload_fingerprint~'^[a-f0-9]{64}$'),
  work_item_id uuid references cornerops_internal.work_items(id),
  approval_request_id uuid references cornerops_internal.approval_requests(id),
  created_by text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  version integer not null default 1 check(version>0), applied_at timestamptz, closed_at timestamptz,
  check((status='applied')=(applied_at is not null)),
  check((status in('rejected','cancelled','expired'))=(closed_at is not null))
);

create table cornerops_internal.supplier_onboarding_catalog_items (
  id uuid primary key default gen_random_uuid(), package_id uuid not null references cornerops_internal.supplier_onboarding_packages(id),
  item_key text not null, identity_key text not null,
  product_type text not null check(product_type in('grocery_product','fresh_produce','prepared_food','meal_kit','catering_product','beverage','bakery_product','frozen_product','packaged_food','restaurant_menu_item','service_bundle')),
  external_product_id text, supplier_sku text, display_name text not null, normalized_name text not null, description text,
  brand text, category text, pack_size text, unit_of_measure text, public_price numeric(14,4) check(public_price is null or public_price>=0),
  currency text check(currency is null or currency~'^[A-Z]{3}$'), price_type text check(price_type is null or price_type='public_web_price'),
  public_availability_label text, product_page_url text not null, primary_image_url text,
  gallery_image_urls jsonb not null default '[]'::jsonb check(jsonb_typeof(gallery_image_urls)='array' and jsonb_array_length(gallery_image_urls)<=2),
  source_checksum text not null check(source_checksum~'^[a-f0-9]{64}$'), observed_at timestamptz not null,
  active_observation boolean not null default true, created_at timestamptz not null default now(), unique(package_id,item_key), unique(package_id,identity_key)
);

create table cornerops_internal.supplier_onboarding_applications (
  id uuid primary key default gen_random_uuid(), package_id uuid not null references cornerops_internal.supplier_onboarding_packages(id),
  application_fingerprint text not null unique check(application_fingerprint~'^[a-f0-9]{64}$'),
  preview_fingerprint text not null check(preview_fingerprint~'^[a-f0-9]{64}$'), expected_package_version integer not null check(expected_package_version>0),
  result_status text not null check(result_status in('applied','applied_partial_catalog','no_material_change','acceptance_test_only','blocked_by_identity_conflict','blocked_by_catalog_conflict','blocked_by_approval','blocked_by_stale_preview')),
  supplier_id uuid references cornerops_internal.supplier_profiles(id), created_catalog_items integer not null default 0 check(created_catalog_items>=0),
  reused_catalog_items integer not null default 0 check(reused_catalog_items>=0), updated_catalog_items integer not null default 0 check(updated_catalog_items>=0),
  skipped_catalog_items integer not null default 0 check(skipped_catalog_items>=0), conflict_count integer not null default 0 check(conflict_count>=0),
  reason_codes jsonb not null default '[]'::jsonb check(jsonb_typeof(reason_codes)='array'), applied_by text not null, created_at timestamptz not null default now()
);

create table cornerops_internal.seller_product_media (
  id uuid primary key default gen_random_uuid(), seller_id uuid not null references cornerops_internal.supplier_profiles(id),
  supplier_catalog_item_id uuid not null references cornerops_internal.supplier_catalog_items(id),
  media_type text not null check(media_type in('logo','primary','gallery')), position integer not null default 0 check(position between 0 and 2),
  source_image_url text not null, source_hostname text not null, source_checksum text not null check(source_checksum~'^[a-f0-9]{64}$'),
  managed_storage_path text, managed_asset_url text, asset_checksum text check(asset_checksum is null or asset_checksum~'^[a-f0-9]{64}$'),
  mime_type text check(mime_type is null or mime_type in('image/jpeg','image/png','image/webp')), file_size_bytes integer check(file_size_bytes is null or file_size_bytes between 1 and 5242880),
  usage_basis text not null check(usage_basis in('seller_authorization_founder_attestation','seller_authorization_documented')),
  status text not null check(status in('source_verified','imported','missing','blocked','failed_validation')),
  observed_at timestamptz not null, imported_at timestamptz, created_at timestamptz not null default now()
);
create unique index seller_product_media_one_primary_idx on cornerops_internal.seller_product_media(supplier_catalog_item_id) where media_type='primary' and status in('source_verified','imported');
create unique index seller_product_media_source_identity_idx on cornerops_internal.seller_product_media(supplier_catalog_item_id,media_type,position,source_checksum);

create table cornerops_internal.seller_inventory_ledger (
  id uuid primary key default gen_random_uuid(), seller_id uuid not null references cornerops_internal.supplier_profiles(id),
  supplier_catalog_item_id uuid not null references cornerops_internal.supplier_catalog_items(id), movement_type text not null check(movement_type in('initial_seed','correction')),
  quantity_delta numeric(14,3) not null, unit text not null, source_type text not null, source_reference text,
  idempotency_key text not null unique, authorization_basis text not null, physical_count_verified boolean not null default false,
  created_by text not null, reason text not null, created_at timestamptz not null default now()
);
create table cornerops_internal.seller_inventory_balances (
  seller_id uuid not null references cornerops_internal.supplier_profiles(id), supplier_catalog_item_id uuid not null references cornerops_internal.supplier_catalog_items(id),
  on_hand_quantity numeric(14,3) not null check(on_hand_quantity>=0), reserved_quantity numeric(14,3) not null default 0 check(reserved_quantity>=0),
  available_quantity numeric(14,3) generated always as (on_hand_quantity-reserved_quantity) stored,
  unit text not null, physical_count_verified boolean not null default false, initialization_source text not null,
  last_ledger_event_id uuid not null references cornerops_internal.seller_inventory_ledger(id), updated_at timestamptz not null default now(), version integer not null default 1 check(version>0),
  primary key(seller_id,supplier_catalog_item_id), check(on_hand_quantity>=reserved_quantity)
);

create table cornerops_internal.sourcing_supplier_coverage_results (
  id uuid primary key default gen_random_uuid(), match_run_id uuid not null references cornerops_internal.sourcing_match_runs(id), supplier_id uuid not null references cornerops_internal.supplier_profiles(id),
  comparison_policy_version text not null, comparison_ruleset_checksum text not null check(comparison_ruleset_checksum~'^[a-f0-9]{64}$'),
  active_item_count integer not null check(active_item_count>=0), matched_item_count integer not null check(matched_item_count>=0), ambiguous_item_count integer not null check(ambiguous_item_count>=0), unmatched_item_count integer not null check(unmatched_item_count>=0),
  coverage_ratio numeric(7,6) not null check(coverage_ratio between 0 and 1), average_match_score numeric(6,2) check(average_match_score between 0 and 100), average_confidence_score numeric(6,2) check(average_confidence_score between 0 and 100),
  full_catalog_coverage boolean not null default false, operational_inventory_coverage boolean not null default false, commercially_verified_coverage boolean not null default false,
  price_comparable_item_count integer not null default 0, available_inventory_item_count integer not null default 0, verified_stock_item_count integer not null default 0, moq_compatible_item_count integer not null default 0, lead_time_compatible_item_count integer not null default 0,
  unknown_facts jsonb not null default '[]'::jsonb check(jsonb_typeof(unknown_facts)='array'), reason_codes jsonb not null default '[]'::jsonb check(jsonb_typeof(reason_codes)='array'),
  created_at timestamptz not null default now(), unique(match_run_id,supplier_id)
);

alter table cornerops_internal.sourcing_match_runs
  add column comparison_policy_version text, add column comparison_ruleset_checksum text,
  add column supplier_comparison_performed boolean not null default false,
  add column market_completeness_claim boolean not null default false check(market_completeness_claim=false),
  add column preferred_within_verified_scope boolean not null default false,
  add column tie_detected boolean not null default false,
  add column single_supplier_full_coverage_available boolean not null default false,
  add column split_sourcing_may_be_required boolean not null default false;
alter table cornerops_internal.sourcing_match_candidates
  add column candidate_tier text check(candidate_tier is null or candidate_tier in('match_ready','match_verification_required','ambiguous','not_matched'));

create index supplier_profiles_authorization_idx on cornerops_internal.supplier_profiles(authorization_status,canonical_key);
create index supplier_onboarding_status_idx on cornerops_internal.supplier_onboarding_packages(status,created_at desc);
create index supplier_onboarding_supplier_idx on cornerops_internal.supplier_onboarding_packages(supplier_canonical_key,created_at desc);
create index seller_media_catalog_idx on cornerops_internal.seller_product_media(supplier_catalog_item_id,status);
create index seller_inventory_ledger_catalog_idx on cornerops_internal.seller_inventory_ledger(supplier_catalog_item_id,created_at desc);
create index sourcing_coverage_run_idx on cornerops_internal.sourcing_supplier_coverage_results(match_run_id,coverage_ratio desc);

create function cornerops_internal.reject_v113_append_only_mutation() returns trigger language plpgsql set search_path=cornerops_internal,pg_temp as $$ begin raise exception 'SupplyGraph v1.13 record is append-only' using errcode='42501'; end $$;
create function cornerops_internal.guard_v113_package_update() returns trigger language plpgsql set search_path=cornerops_internal,pg_temp as $$ begin
  if tg_op='DELETE' then raise exception 'onboarding packages cannot be deleted' using errcode='42501'; end if;
  if (to_jsonb(old)-'status'-'work_item_id'-'approval_request_id'-'updated_at'-'version'-'applied_at'-'closed_at') is distinct from (to_jsonb(new)-'status'-'work_item_id'-'approval_request_id'-'updated_at'-'version'-'applied_at'-'closed_at') or new.version<>old.version+1 or old.status<>'pending_review' or new.status not in('pending_review','applied','rejected','cancelled','expired') then raise exception 'onboarding package update denied' using errcode='42501'; end if; return new; end $$;
create function cornerops_internal.guard_v113_media_update() returns trigger language plpgsql set search_path=cornerops_internal,pg_temp as $$ begin
  if tg_op='DELETE' or (to_jsonb(old)-'managed_storage_path'-'managed_asset_url'-'asset_checksum'-'mime_type'-'file_size_bytes'-'status'-'imported_at') is distinct from (to_jsonb(new)-'managed_storage_path'-'managed_asset_url'-'asset_checksum'-'mime_type'-'file_size_bytes'-'status'-'imported_at') or old.status<>'source_verified' or new.status not in('imported','blocked','failed_validation') then raise exception 'seller media update denied' using errcode='42501'; end if; return new; end $$;
create function cornerops_internal.guard_v113_balance_write() returns trigger language plpgsql set search_path=cornerops_internal,pg_temp as $$ declare ledger cornerops_internal.seller_inventory_ledger; begin
  if tg_op='DELETE' then raise exception 'inventory balances cannot be deleted' using errcode='42501'; end if;
  select * into ledger from cornerops_internal.seller_inventory_ledger where id=new.last_ledger_event_id;
  if ledger.id is null or ledger.seller_id<>new.seller_id or ledger.supplier_catalog_item_id<>new.supplier_catalog_item_id then raise exception 'inventory balance requires matching ledger event' using errcode='42501'; end if;
  if tg_op='INSERT' and (new.on_hand_quantity<>ledger.quantity_delta or new.reserved_quantity<>0 or new.unit<>ledger.unit or new.version<>1) then raise exception 'initial inventory balance does not match ledger event' using errcode='42501'; end if;
  if tg_op='UPDATE' and (new.version<>old.version+1 or new.last_ledger_event_id=old.last_ledger_event_id or new.on_hand_quantity<>old.on_hand_quantity+ledger.quantity_delta or new.reserved_quantity<>old.reserved_quantity or new.unit<>old.unit or new.physical_count_verified<>old.physical_count_verified or new.initialization_source<>old.initialization_source) then raise exception 'inventory balance version/ledger transition denied' using errcode='42501'; end if; return new; end $$;

create trigger supplier_onboarding_packages_guard before update or delete on cornerops_internal.supplier_onboarding_packages for each row execute function cornerops_internal.guard_v113_package_update();
create trigger supplier_onboarding_catalog_append_only before update or delete on cornerops_internal.supplier_onboarding_catalog_items for each row execute function cornerops_internal.reject_v113_append_only_mutation();
create trigger supplier_onboarding_app_append_only before update or delete on cornerops_internal.supplier_onboarding_applications for each row execute function cornerops_internal.reject_v113_append_only_mutation();
create trigger seller_media_guard before update or delete on cornerops_internal.seller_product_media for each row execute function cornerops_internal.guard_v113_media_update();
create trigger seller_inventory_ledger_append_only before update or delete on cornerops_internal.seller_inventory_ledger for each row execute function cornerops_internal.reject_v113_append_only_mutation();
create trigger seller_inventory_balance_guard before insert or update or delete on cornerops_internal.seller_inventory_balances for each row execute function cornerops_internal.guard_v113_balance_write();
create trigger sourcing_coverage_append_only before update or delete on cornerops_internal.sourcing_supplier_coverage_results for each row execute function cornerops_internal.reject_v113_append_only_mutation();

revoke all on cornerops_internal.supplier_onboarding_packages,cornerops_internal.supplier_onboarding_catalog_items,cornerops_internal.supplier_onboarding_applications,cornerops_internal.seller_product_media,cornerops_internal.seller_inventory_ledger,cornerops_internal.seller_inventory_balances,cornerops_internal.sourcing_supplier_coverage_results from public,anon,authenticated,service_role,cornerops_internal_runtime;
grant select,insert,update on cornerops_internal.supplier_onboarding_packages,cornerops_internal.seller_product_media,cornerops_internal.seller_inventory_balances to cornerops_internal_runtime;
grant select,insert on cornerops_internal.supplier_onboarding_catalog_items,cornerops_internal.supplier_onboarding_applications,cornerops_internal.seller_inventory_ledger,cornerops_internal.sourcing_supplier_coverage_results to cornerops_internal_runtime;
revoke delete,truncate on cornerops_internal.supplier_onboarding_packages,cornerops_internal.supplier_onboarding_catalog_items,cornerops_internal.supplier_onboarding_applications,cornerops_internal.seller_product_media,cornerops_internal.seller_inventory_ledger,cornerops_internal.seller_inventory_balances,cornerops_internal.sourcing_supplier_coverage_results from cornerops_internal_runtime;
revoke update on cornerops_internal.supplier_onboarding_catalog_items,cornerops_internal.supplier_onboarding_applications,cornerops_internal.seller_inventory_ledger,cornerops_internal.sourcing_supplier_coverage_results from cornerops_internal_runtime;
revoke execute on function cornerops_internal.reject_v113_append_only_mutation(),cornerops_internal.guard_v113_package_update(),cornerops_internal.guard_v113_media_update(),cornerops_internal.guard_v113_balance_write() from public,anon,authenticated,service_role;

commit;
