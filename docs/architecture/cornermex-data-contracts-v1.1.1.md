# CornerMex Data Contracts v1.1.1

CornerMex contracts map Lovable app/backend structures into canonical CornerOps entities. They are templates until the founder provides the connected repo and/or Supabase schema.

## Contracts

| CornerMex entity | CornerOps contract | Required fields | PII | Default confidence |
| --- | --- | --- | --- | --- |
| Product | Product | id, name, sku, category, status | low | medium in mock, low missing config |
| Lead | Lead | id, companyName, status, source | medium | medium in mock, low missing config |
| Quote | Quote | id, leadId, status, currency | medium | medium in mock, low missing config |
| Order | Order | id, customerId, status, paymentStatus | medium | medium in mock, low missing config |
| Customer/User | Customer | id, name, email | high | medium in mock, low missing config |
| Payment/Manual Payment | PaymentStatus | id, orderId, status, method | medium | medium in mock, low missing config |

## Source references

- `mock/template`: local fake fixtures only.
- `lovable-connected-repo`: repo structure discovered read-only.
- Supabase table references: only after read-only schema discovery is explicitly enabled.

## Missing fields

When source mode is `missing_config`, required fields are treated as missing and contracts report confidence `low`. CornerOps must not infer production schema from template contracts.

## Safety

Contracts do not provide write methods. They only describe read models for agents, Control Tower and daily briefing.
