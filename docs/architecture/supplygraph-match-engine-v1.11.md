# SupplyGraph Match Engine v1.11

## Flow

`ready_for_matching` demand -> active verified catalog -> deterministic candidates -> score and confidence
-> immutable match graph -> internal recommendation -> Work Queue -> Founder Approval -> audit.

Four private tables store runs, per-item results, ranked candidates and recommendations. Runtime receives
only `SELECT` and `INSERT`; triggers reject updates and deletes. Match persistence, Work Queue materialization,
pending approval creation and audit use the existing PostgreSQL transaction boundary.

## Results

Per item, the engine stores rank, score breakdown, reason codes, disqualifiers, source evidence, unknown
facts and human checks. Per run, it stores coverage, conservative aggregate scores, engine/ruleset identity,
source watermark and deterministic input fingerprint.

Recommendations are internal only: clarify demand, verify supplier facts, review a catalog match, research
alternatives or review mixed coverage. They never contact a party, create a quote, purchase or activate.

Demand text is bounded and normalized as untrusted product data. It cannot execute instructions or alter
rules. Existing sanitizers protect persisted evidence and API output.
