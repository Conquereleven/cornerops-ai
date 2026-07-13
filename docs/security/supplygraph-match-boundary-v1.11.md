# SupplyGraph match security boundary v1.11

- All writes target `cornerops_internal`; CornerMex public business tables remain read-only.
- Runtime uses the restricted internal PostgreSQL role, never service-role, anon or publishable credentials.
- Match tables are immutable through grants, revokes and database triggers.
- Match POST requires operator and separate Founder Action authentication; reads require operator auth.
- Product text is untrusted data. Normalization does not interpret prompts, HTML, SQL or tool instructions.
- Evidence excludes raw notes and PII. Audit metadata contains opaque IDs, counts, statuses and short hashes.
- Approval is an internal decision with `executed:false`; supplier/customer contact and external execution
  remain structurally disabled.
- `SUPPLYGRAPH_MATCHING_ENABLED=false` fails closed while preserving v1.10 reads.

Rollback disables the Railway matching flag and redeploys. No destructive SQL rollback is used; immutable
history remains readable.
