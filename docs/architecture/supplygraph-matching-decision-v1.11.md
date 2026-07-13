# SupplyGraph matching decision v1.11

SupplyGraph matching is deterministic because procurement evidence must be reproducible, testable and
auditable. It uses no LLM, embeddings, internet access or mutable runtime weights.

## Scope

- Engine: `supplygraph-match-v1.11.0`; the committed rules produce a SHA-256 checksum.
- Supplier scope: one verified supplier, Intermex UAE.
- Responses always state `single_verified_supplier`, no market comparison and no best-supplier claim.
- A catalog match means textual/catalog compatibility only. It does not prove stock, MOQ, lead time,
  shelf life, delivery or commercial acceptance.

## Match Score

The 0–100 score combines identity 40, brand 20, pack/unit 15, price 10, temperature 5 and source
integrity 10. Identity uses normalized significant-token recall and precision. Generic tokens carry no
identity weight. Required-brand mismatch, material temperature conflict, inactive catalog evidence and
source-integrity failure override the numeric score.

`70–100` is `catalog_match_found`, `55–69` is `ambiguous_catalog_match`, and lower values are
`no_catalog_match`. Ties use the stable supplier/catalog identity key.

Price is compared only when currency and unit basis match. v1.11 performs no FX or unit conversion.

## Confidence Score

Confidence measures evidence, separately from compatibility: demand 15, provenance 20, price freshness
15, stock 20, MOQ 10, lead time 10, and shelf-life/temperature 10. Unknown stock caps confidence at 65;
unknown MOQ plus lead time caps it at 60; stale price at 55; ambiguous identity at 50. Source-integrity
failure fails closed.

Overall scores use quantity weighting only when every active demand item has the same explicit unit;
otherwise items are equally weighted. Unmatched items score zero, ambiguous items do not count as
coverage, and confidence retains the most restrictive evidence cap.

## Reproducibility

The input fingerprint hashes canonical demand/version data, active items, engine/ruleset identity,
supplier set, catalog and latest-offer watermarks, and freshness policy. It excludes timestamps, row
ordering, correlation IDs, notes and PII. Identical inputs reuse one immutable run; material evidence or
demand changes create a new run.

Match records and recommendations are append-only in `cornerops_internal`. Approval accepts or rejects
an internal assessment only and always remains `executed:false`.

## Future extension

v1.12 may add additional verified suppliers and explicit comparison policy. It must not reinterpret
single-supplier v1.11 history or weaken provenance and confidence requirements.
