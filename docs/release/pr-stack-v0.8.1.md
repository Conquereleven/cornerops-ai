# PR Stack v0.8.1

## Final status

| PR | Dependency | Effective change | Result |
| --- | --- | --- | --- |
| #19 `feat: activate Telegram operator path and first read-only source v0.7` | `main` at `7f46608` | 406 files, 20,857 additions, 27 deletions | Merged first as `7757263`; CI passed |
| #20 `feat: add Control Tower web console and approval center v0.8` | PR #19 / commit `418e41a` | 49 files, 2,014 additions, 9 deletions after #19 | Merged second as `b3c729c`; CI passed |

PR #20 contained the full v0.7 history while #19 was open. Merge-tree simulations showed no conflicts and reproduced each branch tree exactly. After #19 merged, #20 was synchronized with `main` through merge commit `cac9c21`; no rebase or history rewrite was needed.

At the start of the audit, `main` at `7f46608` was 12 commits behind the v0.7 branch and 13 commits behind the v0.8 branch. After the ordered merges, `main` matched the v0.8 tree exactly. Package scripts and release documentation were checked together; the documented `qa`, `demo:v0.8`, `build`, and `start` commands exist and match `package.json`.

## Merge order and validation

1. Merge #19.
2. Verify `main` CI and that its tree matches v0.7.
3. Recalculate #20 against the updated base and run CI.
4. Merge #20.
5. Verify `main` CI and that its tree matches v0.8.

All five checks completed successfully. The post-merge `main` run was GitHub Actions run `27982422402`.

## Risk summary

- #19 prepares a real Telegram path and real read-only source selection. Both remain disabled without explicit flags and credentials.
- #20 adds a localhost console and approval decisions. Auth, local-only, read-only and dry-run controls remain mandatory when enabled.
- JSON state is safe only for one process. It is not suitable for horizontal deployment or shared network filesystems.
- Authentication remains single-operator token auth.

## Rollback

Revert #20 before #19, each through a reviewed rollback PR. Disable the console, Telegram and real sources before reverting. Preserve `.cornerops/state` if audit evidence is needed. Detailed commands are in `docs/release/rollback-v0.8.1.md`.
