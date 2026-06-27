# Operator Guide: Real Source Expansion v1.1

v1.1 adds read-only readiness for the first real data source without enabling production writes or external sends.

## What It Enables

- GitHub read-only readiness and optional real reads for repo metadata, issues, PRs and workflow runs.
- Business DB/Supabase read-only readiness with row limits and PII masking.
- Control Tower v1.1 source mode visibility.
- Founder demos that run without credentials.

## Safe Commands

```bash
npm run github:read-only-check
npm run business-data:read-only-check
npm run demo:github-read-only
npm run demo:business-data-read-only
npm run demo:real-sources
npm run demo:v1.1
```

## Source Mode Labels

- `mock`: fixture/mock fallback.
- `real_read_only`: real source reads are available and write blocking is verified.
- `mixed`: more than one source mode contributed.
- `disabled`: source is off.
- `local_internal`: local CornerOps state only.
- `dry_run`: simulated execution, no real mutation.

## Still Disabled

GitHub writes, Business DB writes, migrations, WhatsApp, customer channels, external emails, native tools and ClawHub execution remain disabled.
