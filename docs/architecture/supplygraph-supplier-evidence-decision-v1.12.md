# SupplyGraph Supplier Evidence Decision v1.12

Status: accepted

## Decision

SupplyGraph stores reviewed commercial evidence as immutable, field-level observations. A package is an intake and approval boundary; an application is a separate immutable event. Only approved, applied, non-expired production evidence can affect current matching.

The deterministic precedence is:

1. human verified
2. source verified
3. legacy checksum-pinned catalog snapshot
4. unverified evidence

Equal-precedence contradictions fail closed. Acceptance-test evidence is persisted and auditable but is excluded from production resolution, fingerprints, confidence and rematch recommendations.

## Consequences

- Stock, MOQ, lead time, shelf life and availability remain unknown without evidence.
- Match Score continues to measure catalog compatibility; Confidence Score measures evidence completeness.
- Applying material production evidence creates an internal rematch-review recommendation, never an automatic rematch.
- No supplier/customer contact, quote, purchase, activation or external execution is introduced.
- Intermex UAE remains the only verified supplier; market comparison remains unavailable.

## Rejected Alternatives

- Mutable supplier-note records: not reproducible or field-level.
- Last-write-wins: hides conflicts.
- Environment-configurable trust weights: weakens deterministic governance.
- LLM extraction or runtime scraping: outside the verified evidence boundary.
- Rewriting historical match runs: violates immutability.
