# CornerMex Table Mapping Intake v1.4.5

Status: `manual_table_mapping_required`

## Why This Is Needed

CornerOps can reach the configured CornerMex Supabase project with a safe publishable key, but the reviewed v1.4.4 read-model SQL is still a template. It contains `<base_*_table>` placeholders because the real CornerMex base table names and column availability are not confirmed in this repo.

Do not run `docs/supabase/cornermex-readonly-views.v1.4.4.sql` until every placeholder is replaced with confirmed table names and unavailable columns are removed.

## Safety Rules

- Do not share Supabase keys, database passwords, JWT secrets, Railway tokens, or service-role keys.
- Do not use a service-role key for CornerOps.
- Do not run SQL automatically from CornerOps or Codex.
- Do not create executable SQL from guesses.
- Keep raw customer PII masked or omitted.
- Keep Supabase writes, external sends, WhatsApp sends, email sends, customer channels, and production mutations disabled.

## Founder Input Needed

Provide only non-secret schema information.

### Products

- Base table name:
- Primary key column:
- Available columns:
  - name:
  - sku:
  - category:
  - price:
  - currency:
  - stock:
  - image URL:
  - description:
  - status:
  - updated timestamp:
- Columns missing or named differently:

### B2B Leads

- Base table name:
- Primary key column:
- Available columns:
  - company name:
  - lead type:
  - status:
  - interest summary:
  - requested products:
  - last contacted timestamp:
  - next follow-up timestamp:
  - created timestamp:
  - updated timestamp:
- Columns missing or named differently:

### Orders

- Base table name:
- Primary key column:
- Available columns:
  - order number:
  - status:
  - payment method:
  - payment status:
  - fulfillment status:
  - total amount:
  - currency:
  - created timestamp:
  - updated timestamp:
- Columns missing or named differently:

### Customers

- Base table name:
- Primary key column:
- Available columns:
  - customer name:
  - email:
  - customer type:
  - last order timestamp:
  - created timestamp:
  - updated timestamp:
- PII handling requirement:
  - expose masked email only:
  - omit email entirely:
- Columns missing or named differently:

### Payments

- Base table name:
- Primary key column:
- Available columns:
  - order ID:
  - payment method:
  - payment status:
  - amount:
  - currency:
  - requires manual review:
  - reviewed timestamp:
  - created timestamp:
  - updated timestamp:
- Columns missing or named differently:

### Fulfillment

- Base table name:
- Primary key column:
- Available columns:
  - order ID:
  - fulfillment status:
  - carrier:
  - tracking status:
  - requires attention:
  - created timestamp:
  - updated timestamp:
- Columns missing or named differently:

## Optional Existing Read Model

If CornerMex already has safe public read views, provide their names instead:

```env
CORNERMEX_SUPABASE_TABLE_MAP_JSON={"products":"","b2bLeads":"","orders":"","customers":"","payments":"","fulfillment":""}
```

Leave unknown entities blank. Do not include secrets in this JSON.

## Next Gate

After this mapping is provided, create a reviewed concrete SQL file for the `cornerops_*_v` views or configure `CORNERMEX_SUPABASE_TABLE_MAP_JSON`. Then rerun:

```bash
npm run supabase:key-compatibility-check
npm run cornermex:supabase-readonly-check
```

Proceed to Railway activation only after local validation reports `real_read_only` or `real_read_only_partial`.
