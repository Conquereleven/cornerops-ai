# Unified Command Center Production Activation v1.15

## Flags

Enable after green CI:

```env
CORNEROPS_UNIFIED_COMMAND_CENTER_ENABLED=true
CORNEROPS_LIVE_OVERVIEW_ENABLED=true
CORNEROPS_MARKETING_FOUNDATION_ENABLED=true
CORNEROPS_CAPABILITY_STATUS_ENABLED=true
```

Preserve all valid v1.14 SupplyGraph flags. Do not change external-action or CornerMex write controls.

## Acceptance

Deploy once; verify health, static assets and all 35 registry routes. Authenticate the operator session and confirm live Overview, source separation, governance links, marketing empty/configuration states and blocked capabilities. Restart once and verify routes plus persistent Work Queue, Approvals, Audit, seller catalogs and inventory.

## Rollback

Disable Live Overview, Marketing, capability status and finally Unified Command Center. Redeploy the last stable repository frontend. Do not restore mocks, delete history or use Lovable.
