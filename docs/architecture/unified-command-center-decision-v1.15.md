# Unified Command Center Decision v1.15

- The React application in this repository is the only canonical frontend.
- GitHub `main` is the source of truth and Railway is the production host.
- Lovable is an archived visual reference, not an execution or rollback platform.
- One typed registry supplies desktop navigation, mobile navigation and route availability.
- Legacy routes redirect to canonical routes without duplicating pages.
- Overview is a live read-only operating summary; it does not host fake conversations or fixtures.
- Control Tower is an executive summary linking to first-class governance modules.
- Data states are `live`, `live_read_only`, `partial`, `empty`, `configuration_required`, `disabled`, `unavailable`, `stale` or `error`. `mock` is forbidden in production UI.
- Existing APIs are reused. The frontend contract is the aggregation boundary; no second API client or persistence stack is added.
- Marketing v1.15 is a read-only foundation over assets, drafts, Work Queue and Approvals. Publishing, spend and contacts remain blocked. Full persistence is deferred to v1.16.
- Capability cards are status-only. OpenClaw and every external action remain visibly disabled.
- Rollback uses four bounded feature flags and the last stable Railway deployment. Lovable and mock data are not rollback targets.

No database migration is required because current Work Queue, Draft, Approval, Audit, SupplyGraph and read-only CornerMex structures are sufficient.
