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

The grants were inspected against PostgreSQL catalogs after migration. The runtime login then connected from the Railway production container through the exact Supabase Session Pooler host `aws-1-ap-south-1.pooler.supabase.com:5432` with certificate verification enabled.

The direct-login probe proved select/insert/update on work items and approvals plus select/insert on audit events. Fourteen forbidden probes were denied with PostgreSQL `42501`, including deletes, audit mutation, schema/object creation, public business-table access, role creation, and auth administration. The complete transaction was rolled back and a follow-up query confirmed zero probe rows persisted.

## Activation gate

Direct-login probes pass. Enabling application persistence remains a separate production gate. If a future forbidden operation succeeds, stop with `blocked_by_runtime_role_privilege_leak`.
