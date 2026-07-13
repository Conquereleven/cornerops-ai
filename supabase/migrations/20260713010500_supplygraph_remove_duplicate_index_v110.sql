begin;

-- canonical_key already has a unique constraint-backed index.
drop index if exists cornerops_internal.supplier_profiles_canonical_lookup_idx;

commit;
