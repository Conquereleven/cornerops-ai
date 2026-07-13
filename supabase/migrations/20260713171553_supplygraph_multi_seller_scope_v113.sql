begin;

alter table cornerops_internal.sourcing_match_runs
  drop constraint sourcing_match_runs_comparison_scope_check;

alter table cornerops_internal.sourcing_match_runs
  add constraint sourcing_match_runs_comparison_scope_check
  check (comparison_scope in ('single_verified_supplier', 'authorized_verified_seller_set'));

commit;
