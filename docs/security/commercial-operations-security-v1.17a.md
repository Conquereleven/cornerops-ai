# Commercial Operations Security v1.17A

- Operator auth protects every read; Founder Action auth protects every mutation.
- Writes target only `cornerops_internal` and require the disabled-by-default feature flag.
- The proposed runtime grant permits `SELECT/INSERT/UPDATE` on current commercial entities and
  `SELECT/INSERT` on append-only transition evidence. Public Supabase roles receive no access.
- Stable keys and unique constraints prevent retry duplicates.
- Commercial Work Queue scopes prevent one entity condition from clearing unrelated conditions in
  both memory and PostgreSQL paths.
- Pricing and payment transitions require evidence; critical exceptions block Daily Close.
- Intermex/carrier milestones require attributable, checksum-bearing evidence. CornerOps cannot
  imply receipt, acceptance, picking, packing or dispatch from an internal action alone.
- COD collection never counts as cash until full remittance is verified. Sensitive payment and
  carrier references are represented by presence/sanitized metadata in frontend summaries.
- Audit metadata is sanitized. No contact PII, credentials, card data or raw financial secrets are
  required by the contract.
- External sends, payment capture/refund, shipment APIs, CornerMex writes and automated purchasing
  are absent by design.
