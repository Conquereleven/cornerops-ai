# Internal Runtime Least-Privilege Proof v1.9.1

## Runtime identity

- Login role: `cornerops_internal_app`
- Group role: `cornerops_internal_runtime`
- Login attributes: `LOGIN`, `INHERIT`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, `NOBYPASSRLS`
- Role defaults: `search_path=cornerops_internal,pg_catalog`, `statement_timeout=8000ms`, `idle_in_transaction_session_timeout=15000ms`, `application_name=cornerops-internal-production`
- Password location: local secret file with mode `0600`; no value is stored in Git.

## Introspection matrix

| Capability | Expected | Verified |
| --- | --- | --- |
| Use `cornerops_internal` | allowed | yes |
| Create in `cornerops_internal` | denied | yes |
| Create in `public` | denied | yes |
| Select/insert/update work items | allowed | yes |
| Delete work items | denied | yes |
| Select/insert/update approvals | allowed | yes |
| Delete approvals | denied | yes |
| Select/insert audit events | allowed | yes |
| Update/delete audit events | denied | yes |
| Access products/orders/customers/leads | denied | yes |
| Use `auth` schema | denied | yes |
| Create roles/databases or bypass RLS | denied | yes |

The grants were inspected against PostgreSQL catalogs after migration. An allowed write probe through the administrative connector could not impersonate the login because that connector itself cannot `SET ROLE`. The mandatory direct-login, rolled-back write probe remains pending from Railway, where IPv6 direct database connectivity can be exercised without administrative credentials.

## Activation gate

Do not set `CORNEROPS_INTERNAL_PERSISTENCE_ENABLED=true` until all direct-login probes pass. If any forbidden operation succeeds, stop with `blocked_by_runtime_role_privilege_leak`.
