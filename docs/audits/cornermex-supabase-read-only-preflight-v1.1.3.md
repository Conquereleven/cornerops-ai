# CornerMex Supabase Read-Only Preflight v1.1.3

Date: 2026-06-27

## Gate

- PR #26: `feat: add CornerMex Lovable real config onboarding v1.1.2`
- PR #26 status: merged during this workflow
- PR #26 merge commit: `89a125953a37814c09630954a8910471e963fc31`
- Latest `origin/main` after merge: `89a125953a37814c09630954a8910471e963fc31`
- v1.1.2 commit included: `7169de5d109114d3bad99e065b97bb267b715927`

## Current State

- CornerMex connector mode before live credentials: `schema_discovered` when Lovable repo config is present.
- Lovable repo discovery: `Conquereleven/corner-mex-uae`, read-only.
- Supabase credentials: missing.
- Migration discovery: enabled from repo evidence only; migrations are not executed.
- Write blocking: enabled by default.
- Telegram v1.2: not started.

## Safety Risks

- Service role keys must not be used.
- Supabase RLS must be verified before `real_read_only`.
- RPCs such as `admin_update_order_state` are write-risk paths and remain documentation only.
- Live Supabase reads remain disabled until URL and anon/read-only key are provided.

## Implementation Plan

- Add migration/schema discovery services.
- Add schema evidence model and contract confidence upgrade.
- Add Supabase read-only check and v1.1.3 demos.
- Extend Control Tower and founder daily with schema discovery status.
- Keep all tests/demos credential-free.
