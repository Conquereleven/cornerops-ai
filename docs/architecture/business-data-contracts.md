# Business Data Contracts

The contract registry maps discovered source columns to stable CornerOps models. Agents depend on canonical Lead, Quote and Order objects rather than provider-specific rows.

## Mapping model

Each mapping records source table, canonical/source fields, required status, transformation name, PII level, unmapped source fields, missing required fields, warnings and confidence.

| Entity | Required examples | Sensitive examples |
| --- | --- | --- |
| Lead | id, companyName, status, createdAt | contactName, email, phone, notes |
| Quote | id, quoteNumber, status, currency, total, createdAt | customerName |
| Order | id, orderNumber, status, paymentStatus, paymentMethod, currency, total, createdAt | customerName, notes |
| AuditLog | id, eventType, status, createdAt | userId and sanitized payload metadata |
| Approval | id, actionType, status, createdAt | createdBy |

QuoteItem and OrderItem are normalized from the mapped `items` field in v0.4. A future child-table adapter can preserve the same canonical contract.

## Confidence

- `high`: every required field is mapped.
- `medium`: at least 60% of required fields are mapped.
- `low`: fewer than 60% are mapped or the source table is absent.

Low-confidence mappings are report-only and must not drive real reads. Missing fields and transformation TODOs appear in Control Tower.

## Transformations

Named transformations include status normalization, number coercion, ISO timestamps, arrays and item normalization. The current JS normalizer performs these operations after contract projection. Unknown source fields are retained only in mapping metadata, not exposed to agents.
