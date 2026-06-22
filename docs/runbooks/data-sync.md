# Runbook: Data Sync

`DataSyncService` existe en v0.1 como dry-run/status service. `CORNEROPS_SYNC_ENABLED=false` por defecto.

Para probar simulacion:

```js
await dataSyncService.dryRunSync('github')
```

No hay jobs programados ni escrituras reales en esta fase.
