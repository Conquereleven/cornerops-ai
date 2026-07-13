# Lovable Single-Pass Prompt: SupplyGraph v1.12

Status: prepared, intentionally unexecuted. Use at most once in a future authorized UI sprint.

Extend the existing CornerOps Dashboard without redesigning or refactoring unrelated components. Reuse its navigation, cards, tables, status pills, API adapter, authentication and error states.

Add SupplyGraph evidence package list and detail views. Include deterministic preview/diff, linked Approval state, Apply availability, field-level provenance, source type, observation age, expiry, conflicts, explicit unknowns, evidence scope and match-confidence impact. Clearly isolate `acceptance_test` records and label them as unable to affect production matching.

Use only the existing CornerOps backend evidence endpoints. Create no mock supplier facts. Store no credentials. Expose no raw notes or PII. Never call supplier/customer contact, WhatsApp, email, quote, purchasing, activation, CornerMex mutation or OpenClaw APIs. Keep Apply disabled unless the backend reports an approved package, current version and matching preview fingerprint. Display all backend warnings and audit IDs.

Preserve the current visual language and responsive behavior. Make one cohesive implementation pass and avoid dependency additions or broad refactors.
