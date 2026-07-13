# Multi-Seller Comparison v1.13

Comparison is deterministic and limited to authorized, verified sellers with active catalog evidence. Candidate order is `match_ready`, `match_verification_required`, `ambiguous`, then `not_matched`, followed by match score, confidence and stable identity. Two or more sellers use `authorized_verified_seller_set`; one seller preserves v1.12 semantics.

`marketComparisonPerformed=false`, `marketCompleteness=false` and `bestSupplierClaim=false` always. Split sourcing is a review signal only; a basket optimizer is not implemented.
