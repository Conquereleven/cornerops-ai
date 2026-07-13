# Lovable single-pass prompt: SupplyGraph v1.10 + v1.11

Extend the existing private CornerOps Dashboard using its current navigation, authentication, API adapter,
components and design system. Do not redesign unrelated screens and do not create mock data.

Add SupplyGraph views backed only by the authenticated production API: status, verified suppliers, catalog,
demand requests, match history and match detail. Match detail must show per-item ranked candidates, Match
Score, Confidence Score, component breakdowns, evidence age, source-checksum indicator, unknown facts,
human verification requirements, internal recommendation, Work Queue links and Approval status.

Always display `Single verified supplier`, `No market comparison`, `Supplier verification required` when
applicable, and `External actions blocked`. Never display best/optimal supplier, guaranteed availability or
delivery, automated purchasing, customer PII or credentials.

Reuse the existing Settings and API authentication model. Do not add secrets, external execution, supplier
outreach, quote generation or product activation. Preserve disabled states. Complete this in one focused
generation, then run one typecheck, one build and one visual QA pass.
