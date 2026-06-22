# Internal Beta Readiness Checklist v0.4

- [x] Business-data readiness audit exists.
- [x] Mock mode works without credentials.
- [x] SELECT-only policy and identifier validation exist.
- [x] Query timeout and maximum rows are enforced.
- [x] Every business/schema read is audited.
- [x] PII is masked before agent consumption.
- [x] Lead, quote and order contracts are high-confidence against mock schema.
- [x] Lead, quote and order read-only repositories exist.
- [x] Control Tower beta reports writes and external sends blocked.
- [x] Agents show source modes and no mutation path.
- [x] Three beta demo commands work without credentials.
- [ ] Dedicated production/staging read-only credential provisioned.
- [ ] Real schema discovered and contracts operator-approved.
- [ ] Database-level write denial verified against staging.
- [ ] Control Tower authentication enabled before network exposure.

Current release decision: **ready for controlled mock internal beta; not approved for real production database connection yet**.
