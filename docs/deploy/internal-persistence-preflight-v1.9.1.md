# Internal Persistence Preflight v1.9.1

- Project: `cornerops-ai` (`nhxpujypqxbjiqqddxqt`), region `ap-south-1`
- Starting main SHA: `528eb2ceec6db7c7eaa83d0282a716d009e37cd0`
- PR #47: merged; CI successful
- Target migration before activation: absent
- `cornerops_internal` before activation: absent
- Existing migration history: `20260707174603_create_cornerops_readonly_views_v146`
- Public table count before activation: 17
- Public business row-count baseline: products 199; customers, orders, order items, B2B leads, conversations, messages, worker runs, and worker events 0
- Raw business rows were not read.
- Recovery: disable `CORNEROPS_INTERNAL_PERSISTENCE_ENABLED`, redeploy, and preserve the schema and audit evidence.
- Known security advisory: historical backup table `public.products_backup_pre_intermex_import` has RLS disabled. It is outside this activation and remains unchanged.
