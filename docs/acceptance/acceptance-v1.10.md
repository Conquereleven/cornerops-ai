# Acceptance v1.10

- Starting main: `b29b3d217ba7ca1c250cb438400dbf98a22301cb`
- Branch: `feature/supplygraph-data-foundation-v1.10`
- Lovable credits/actions: 0
- Source: checksum-pinned 190-row repository snapshot
- Source checksum: `90f8585196507fbe3663586d5a902449828d67b52ca7db436dd06867c13f1934`
- Synthetic stock policy: discarded; stored as unknown/null
- Migration review: `approved_for_application`
- Migration checksum: `bc9f1968fe7fc2883f2353a0b2b5a8f5b64ea0a2badfcf4ac8ff9f6c6f9fdcec`
- Safety: CornerMex writes, activation, external actions, outreach, purchasing and OpenClaw blocked
- Current status: implementation_validation_in_progress
- Advisor remediation: redundant canonical lookup index removal prepared; no table/data changes
- Runtime remediation: PostgreSQL date values are serialized to ISO strings before API sanitization

## Initial capability matrix

| Capability | Available | Elevation | Planned use |
|---|---:|---|---|
| Repository read/write and tests | yes | repository write | implementation and validation |
| GitHub read/write/merge | yes | authenticated network | PR, CI and merge |
| Supabase read/admin | yes | authenticated connector | migration, advisors and probes |
| Railway read/variables/deploy | yes | authenticated network | flags, deployment and restart |
| Production API verification | yes | authenticated network | status, sync and demand gates |
| Lovable | available but excluded | none | zero actions |

Production evidence, exact sync summaries, demand IDs, restart proof, advisor results, test counts and
final status are recorded after activation. No secrets or raw business rows belong in this document.
