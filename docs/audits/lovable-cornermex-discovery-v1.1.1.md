# Lovable CornerMex Discovery Audit v1.1.1

Date: 2026-06-27

## Configuration status

- Lovable project URL: missing by default
- Lovable project name: missing by default
- Lovable-connected GitHub repo: missing by default
- Supabase URL/key: missing by default
- Discovery mode: `mock`
- Connector source mode: `mock` for data reads, with missing-config warnings

## Discovered routes and flows

Without founder-provided repo/Supabase config, routes and flows are template-level only:

- App routes: marketplace, product detail, request quote
- Admin routes: dashboard, quotes, orders, products, customers
- Flows: product, lead, quote, order, customer, payment, manual payment, bank transfer, COD

## Entity mapping

- Product -> CornerOps Product
- Lead -> CornerOps Lead
- Quote -> CornerOps Quote
- Order -> CornerOps Order
- Customer/User -> CornerOps Customer
- Payment/Manual Payment -> CornerOps PaymentStatus

Mapping confidence is `medium` for mock fixtures and `low` when no schema is configured.

## Risks

- Mock data is realistic but fake.
- Repo discovery does not prove database schema.
- Supabase readiness must use anon/read-only credentials only.
- Any service-role key in client code is a critical warning.

## Next steps

1. Provide Lovable project URL/name.
2. Provide the connected GitHub repo.
3. Provide Supabase URL and anon/read-only key if available.
4. Share table names or Lovable `.env.example` if known.
