# Runbook: Database Rollback

No se ejecutan migraciones en v0.1. `src/integrations/database/migrations/schema.sql` es propuesta documentada.

Antes de activar DB real:

1. Crear migracion incremental.
2. Crear rollback SQL separado.
3. Probar en ambiente no-main.
4. Mantener `CORNEROPS_DATA_MODE=read_only`.
5. Activar writes solo con approvals, backups y audit logs persistentes.
