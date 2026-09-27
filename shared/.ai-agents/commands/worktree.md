---
description: Manage git worktrees under .worktree/ (create, list, delete, clean-merged)
---

# Worktree Manager Command

Unified command to manage isolated git worktrees in `.worktree/` and handle session relocations.

## Syntax

```
/worktree <action> [options]
```

- `/worktree create <branch>`: Creates `.worktree/<branch>` and relocates OpenCode session.
- `/worktree list`: Lists all active worktrees and PR/MR status.
- `/worktree delete <branch>`: Removes a specific worktree and prunes branch.
- `/worktree clean` or `/worktree delete --merged`: Cleans up all worktrees whose PR/MR is merged.

## Instructions for Agent

1. Parse action from `$ARGUMENTS`:
   - If action is `create` or starts with `add` / `new`:
     - Delegate to `/worktree.create` workflow with remaining arguments.
   - If action is `list` or `ls` or empty:
     - Delegate to `/worktree.list` workflow.
   - If action is `delete`, `rm`, `remove`:
     - Delegate to `/worktree.delete` workflow with remaining arguments.
   - If action is `clean`, `prune`, `clean-merged`, or `merged`:
     - Delegate to `/worktree.delete --merged` workflow.
   - If an argument is given without an action verb (e.g. `/worktree feature-foo`):
     - Check if it matches an existing worktree -> switch session there using `tools.opencode.session_move`.
     - Otherwise, assume creation -> run `/worktree.create` workflow.
