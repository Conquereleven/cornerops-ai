# Local-First Archives

The archive layer stores normalized context records locally with provenance. v0.2 uses a mock adapter with fixtures; the SQLite adapter is stubbed and documented until a safe local driver is added.

## Principles

- Local-first.
- Source metadata and checksums on every record.
- PII level on every record.
- Searchable snippets, not external upload.
- Retention warnings before deletion.
- No real sync by default.

## SQLite Strategy

Future SQLite path: `./.cornerops/archives/context.sqlite`. It must stay inside `CLAWSAFE_ROOT`, be backed up intentionally and never contain unmasked secrets in audit logs.

## Mock vs Real

Mock records are clearly sourced from `tests/fixtures/context`. Real adapters must label original source, import time, source timestamps and checksum.
