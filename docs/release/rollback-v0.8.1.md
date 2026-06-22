# Rollback v0.8.1

## Immediate containment

Stop the server, then set these flags before restarting:

```env
CORNEROPS_WEB_CONSOLE_ENABLED=false
CORNEROPS_PERSISTENCE_PROVIDER=memory
CORNEROPS_APPROVAL_STORE_PROVIDER=memory
CORNEROPS_AUDIT_STORE_PROVIDER=memory
CORNEROPS_SESSION_STORE_PROVIDER=memory
CORNEROPS_TELEGRAM_ACTIVATION_ENABLED=false
CORNEROPS_TELEGRAM_REAL_MODE=false
TELEGRAM_OPERATOR_ENABLED=false
CORNEROPS_FIRST_REAL_SOURCE_ENABLED=false
CORNEROPS_REAL_DATA_ENABLED=false
```

Memory mode is a temporary containment option and loses state on restart.

## Preserve or clear local state

With the server stopped, preserve evidence before clearing:

```bash
cp -R .cornerops/state .cornerops/state-audit-backup
mv .cornerops/state .cornerops/state-disabled
```

Do not print corrupted files or attach them to tickets. They may contain operational metadata even though normal writes are sanitized.

## Code rollback

Create a rollback branch from current `main`. Revert merge commits in reverse dependency order and open a reviewed PR:

```bash
git switch main
git pull --ff-only origin main
git switch -c rollback/v0.8.1
git revert -m 1 b3c729cb57fbaa44f7ac792e0165b71dcb71fbc5
git revert -m 1 775726333122840fc3e32cfe451af8931c7159dc
```

Revert #20 only when the issue is limited to Control Tower v0.8. Revert #19 as well only when Telegram/source foundations must also be removed. Run full QA before merging the rollback.

To discard an uncommitted local experiment without touching user work, create a fresh clone or worktree from `origin/main`; do not use destructive reset commands.
