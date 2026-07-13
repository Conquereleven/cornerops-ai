begin;

create table if not exists cornerops_internal.sourcing_match_runs (
  id uuid primary key default gen_random_uuid(),
  demand_request_id uuid not null references cornerops_internal.demand_requests(id),
  demand_version integer not null check (demand_version > 0),
  engine_version text not null,
  ruleset_checksum text not null check (ruleset_checksum ~ '^[a-f0-9]{64}$'),
  source_watermark text not null check (source_watermark ~ '^[a-f0-9]{64}$'),
  input_fingerprint text not null unique check (input_fingerprint ~ '^[a-f0-9]{64}$'),
  comparison_scope text not null check (comparison_scope = 'single_verified_supplier'),
  supplier_count_evaluated integer not null check (supplier_count_evaluated > 0),
  market_comparison_performed boolean not null default false check (market_comparison_performed = false),
  best_supplier_claim boolean not null default false check (best_supplier_claim = false),
  overall_match_score numeric(5,2) not null check (overall_match_score between 0 and 100),
  overall_confidence_score numeric(5,2) not null check (overall_confidence_score between 0 and 100),
  coverage_status text not null check (coverage_status in ('catalog_coverage_none','catalog_coverage_partial','catalog_coverage_complete')),
  fulfillment_readiness text not null check (fulfillment_readiness in ('insufficient_demand_information','catalog_coverage_none','catalog_coverage_partial','catalog_coverage_complete','supplier_verification_required','commercial_terms_partial','commercial_terms_verified')),
  matched_item_count integer not null check (matched_item_count >= 0),
  ambiguous_item_count integer not null check (ambiguous_item_count >= 0),
  unmatched_item_count integer not null check (unmatched_item_count >= 0),
  active_item_count integer not null check (active_item_count > 0),
  catalog_coverage_ratio numeric(6,5) not null check (catalog_coverage_ratio between 0 and 1),
  result_summary jsonb not null default '{}'::jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  check (matched_item_count + ambiguous_item_count + unmatched_item_count = active_item_count)
);

create table if not exists cornerops_internal.sourcing_match_item_results (
  id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null references cornerops_internal.sourcing_match_runs(id),
  demand_item_id uuid not null references cornerops_internal.demand_items(id),
  result_status text not null check (result_status in ('catalog_match_found','ambiguous_catalog_match','no_catalog_match')),
  selected_supplier_id uuid references cornerops_internal.supplier_profiles(id),
  selected_catalog_item_id uuid references cornerops_internal.supplier_catalog_items(id),
  selected_offer_snapshot_id uuid references cornerops_internal.supplier_offer_snapshots(id),
  match_score numeric(5,2) not null check (match_score between 0 and 100),
  confidence_score numeric(5,2) not null check (confidence_score between 0 and 100),
  candidate_count integer not null check (candidate_count >= 0),
  reason_codes jsonb not null default '[]'::jsonb,
  disqualifiers jsonb not null default '[]'::jsonb,
  unknown_facts jsonb not null default '[]'::jsonb,
  required_human_checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (match_run_id, demand_item_id)
);

create table if not exists cornerops_internal.sourcing_match_candidates (
  id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null references cornerops_internal.sourcing_match_runs(id),
  item_result_id uuid not null references cornerops_internal.sourcing_match_item_results(id),
  demand_item_id uuid not null references cornerops_internal.demand_items(id),
  supplier_id uuid not null references cornerops_internal.supplier_profiles(id),
  supplier_catalog_item_id uuid not null references cornerops_internal.supplier_catalog_items(id),
  supplier_offer_snapshot_id uuid references cornerops_internal.supplier_offer_snapshots(id),
  rank integer not null check (rank > 0),
  match_score numeric(5,2) not null check (match_score between 0 and 100),
  confidence_score numeric(5,2) not null check (confidence_score between 0 and 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  reason_codes jsonb not null default '[]'::jsonb,
  disqualifiers jsonb not null default '[]'::jsonb,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (match_run_id, demand_item_id, supplier_catalog_item_id),
  unique (match_run_id, demand_item_id, rank)
);

create table if not exists cornerops_internal.sourcing_recommendations (
  id uuid primary key default gen_random_uuid(),
  match_run_id uuid not null unique references cornerops_internal.sourcing_match_runs(id),
  recommendation_type text not null check (recommendation_type in ('verify_supplier_facts','review_catalog_match','clarify_customer_demand','alternative_supplier_search_required','mixed_coverage_review','insufficient_evidence')),
  summary text not null,
  next_actions jsonb not null default '[]'::jsonb,
  approval_required boolean not null,
  executed boolean not null default false check (executed = false),
  external_action_allowed boolean not null default false check (external_action_allowed = false),
  supplier_contact_allowed boolean not null default false check (supplier_contact_allowed = false),
  customer_contact_allowed boolean not null default false check (customer_contact_allowed = false),
  created_at timestamptz not null default now()
);

create index if not exists sourcing_match_runs_demand_history_idx on cornerops_internal.sourcing_match_runs(demand_request_id,created_at desc);
create index if not exists sourcing_match_runs_created_idx on cornerops_internal.sourcing_match_runs(created_at desc);
create index if not exists sourcing_match_runs_coverage_idx on cornerops_internal.sourcing_match_runs(coverage_status,created_at desc);
create index if not exists sourcing_match_runs_readiness_idx on cornerops_internal.sourcing_match_runs(fulfillment_readiness,created_at desc);
create index if not exists sourcing_match_item_results_status_idx on cornerops_internal.sourcing_match_item_results(result_status,created_at desc);
create index if not exists sourcing_match_item_results_selected_idx on cornerops_internal.sourcing_match_item_results(selected_supplier_id,selected_catalog_item_id);
create index if not exists sourcing_match_candidates_rank_idx on cornerops_internal.sourcing_match_candidates(match_run_id,demand_item_id,rank);
create index if not exists sourcing_match_candidates_identity_idx on cornerops_internal.sourcing_match_candidates(supplier_id,supplier_catalog_item_id);
create index if not exists sourcing_recommendations_type_idx on cornerops_internal.sourcing_recommendations(recommendation_type,created_at desc);

create or replace function cornerops_internal.reject_sourcing_match_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'SupplyGraph match evidence is append-only';
end
$$;

create or replace trigger sourcing_match_runs_append_only before update or delete on cornerops_internal.sourcing_match_runs for each row execute function cornerops_internal.reject_sourcing_match_mutation();
create or replace trigger sourcing_match_item_results_append_only before update or delete on cornerops_internal.sourcing_match_item_results for each row execute function cornerops_internal.reject_sourcing_match_mutation();
create or replace trigger sourcing_match_candidates_append_only before update or delete on cornerops_internal.sourcing_match_candidates for each row execute function cornerops_internal.reject_sourcing_match_mutation();
create or replace trigger sourcing_recommendations_append_only before update or delete on cornerops_internal.sourcing_recommendations for each row execute function cornerops_internal.reject_sourcing_match_mutation();

revoke all on cornerops_internal.sourcing_match_runs, cornerops_internal.sourcing_match_item_results,
  cornerops_internal.sourcing_match_candidates, cornerops_internal.sourcing_recommendations
  from public, anon, authenticated, service_role;
revoke all on function cornerops_internal.reject_sourcing_match_mutation() from public, anon, authenticated, service_role;

grant select, insert on cornerops_internal.sourcing_match_runs, cornerops_internal.sourcing_match_item_results,
  cornerops_internal.sourcing_match_candidates, cornerops_internal.sourcing_recommendations
  to cornerops_internal_runtime;
revoke update, delete, truncate on cornerops_internal.sourcing_match_runs, cornerops_internal.sourcing_match_item_results,
  cornerops_internal.sourcing_match_candidates, cornerops_internal.sourcing_recommendations
  from cornerops_internal_runtime;

commit;
