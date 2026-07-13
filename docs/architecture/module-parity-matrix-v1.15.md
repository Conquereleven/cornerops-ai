# Module Parity Matrix v1.15

Canonical source: typed registry in `frontend/src/config/moduleRegistry.ts`. All modules are read-only surfaces; writes and external actions remain blocked.

| Module | Canonical route | Previous route/component | API/source | v1.15 state | Persistence | Mock dependency | Outcome |
|---|---|---|---|---|---|---|---|
| Overview | `/overview` | `/`, Dashboard | frontend contract + SupplyGraph | live_read_only | PostgreSQL/API | removed | live KPI separation |
| Control Tower | `/control-tower` | same, monolith | frontend status | live_read_only | internal services | removed | executive summary |
| AI Chat Center | `/ai-chat` | `/chat` | `/api/chat` | live | conversation store | removed | empty new session |
| CornerMex Ops | `/cornermex-ops` | embedded | frontend cornermex | live_read_only | CornerMex read-only | removed | first-class |
| Orders | `/orders` | same | `/api/orders` | empty/live_read_only | CornerMex repository | removed | no fallback |
| Products | `/products` | same | `/api/products` | live_read_only | CornerMex repository | removed | separate semantics |
| B2B Leads | `/b2b-leads` | `/leads` | `/api/leads` | empty/live_read_only | CornerMex repository | removed | canonical alias |
| Conversations | `/conversations` | same | `/api/conversations` | empty/live_read_only | internal repository | removed | no sample rows |
| Authorized Sellers | `/authorized-sellers` | same | SupplyGraph | live_read_only | PostgreSQL | none | preserved |
| Seller Catalog | `/seller-catalog` | same | SupplyGraph | live_read_only | PostgreSQL | none | preserved |
| Seller Inventory | `/seller-inventory` | same | SupplyGraph ledger | live_read_only | PostgreSQL | none | preserved |
| Seller Comparison | `/seller-comparison` | same | SupplyGraph match | live_read_only | PostgreSQL | none | preserved |
| Marketing Hub | `/marketing` | missing | frontend status | partial | existing services | none | foundation |
| Campaign Planner | `/marketing/campaigns` | missing | Work Queue | configuration_required | v1.16 deferred | none | no publishing |
| Content Studio | `/marketing/content` | missing | Drafts | empty/live_read_only | internal drafts | none | local only |
| Brand Studio | `/marketing/brand` | missing | status | partial | current evidence | none | no mutation |
| Asset Library | `/marketing/assets` | missing | SupplyGraph/CornerMex | live_read_only | private media | none | managed evidence |
| Promotions | `/marketing/promotions` | missing | Approvals | disabled | approval engine | none | activation blocked |
| Audience Segments | `/marketing/audiences` | missing | CornerMex aggregate | partial | read-only source | none | no PII |
| Marketing Calendar | `/marketing/calendar` | missing | Work Queue | empty | existing queue | none | internal only |
| Performance Analytics | `/marketing/analytics` | missing | status | configuration_required | v1.16 deferred | none | no invented metrics |
| Flow Engine | `/flow-engine` | embedded | frontend flows | live_read_only | current connector | none | first-class |
| Intelligence | `/intelligence` | hidden | intelligence API | live_read_only | PostgreSQL | none | first-class |
| Work Queue | `/work-queue` | embedded | frontend work-queue | live_read_only | PostgreSQL | none | first-class |
| Drafts | `/drafts` | embedded | frontend drafts | empty/live_read_only | internal store | none | unsendable |
| Worker Settings | `/worker-settings` | same | workers API | live | current repository | none | preserved |
| Product Activation | `/product-activation` | embedded | frontend actions | disabled | approval engine | none | visibly blocked |
| Approvals | `/approvals` | embedded | frontend approvals | live_read_only | PostgreSQL | none | first-class |
| Audit Log | `/audit-log` | embedded | frontend audit | live_read_only | PostgreSQL | none | append-only |
| Security | `/security` | embedded | frontend security | live_read_only | internal controls | none | first-class |
| Capability Status | `/capabilities` | embedded | frontend security | live_read_only | internal controls | none | non-executing registry |
| Environment Doctor | `/environment-doctor` | embedded | security/status | live_read_only | configuration | none | no secret values |
| Telegram | `/telegram` | embedded | frontend telegram | live_read_only | local operator state | none | first-class |
| Integrations | `/integrations` | same | integrations API | live_read_only | configuration | none | preserved |
| Settings | `/settings` | same | settings API | live | current repository | none | unified |

Migration required: no. Duplicate route declarations are replaced by the registry. Legacy `/`, `/chat` and `/leads` redirect to canonical routes.
