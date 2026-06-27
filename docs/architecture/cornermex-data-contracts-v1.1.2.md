# CornerMex Data Contracts v1.1.2

v1.1.2 upgrades contract confidence based on discovery level.

## Confidence rules

- `low`: mock/template only, no repo or Supabase discovery.
- `medium`: Lovable-connected repo discovered references, no live schema.
- `high`: Supabase read-only schema discovered and mapped.

## Contracts

| Contract | Source modes | PII | Required fields |
| --- | --- | --- | --- |
| Product | mock, repo_discovered, real_read_only | low | id, name, sku, category, status |
| Lead | mock, repo_discovered, real_read_only | medium | id, companyName, status, source |
| Quote | mock, repo_discovered, real_read_only | medium | id, leadId, status, currency |
| Order | mock, repo_discovered, real_read_only | medium | id, customerId, status, paymentStatus |
| Customer | mock, repo_discovered, real_read_only | high | id, name, email |
| Payment | mock, repo_discovered, real_read_only | medium | id, orderId, status, method |

## Reporting

Each contract reports:

- current confidence
- source mode
- canonical fields
- missing fields
- PII classification
- warnings

Contracts remain read models. They do not grant mutation capability.
