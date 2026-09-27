---
description: Commit and create MR on Gitlab, with post-merge worktree cleanup
---

Use glab skill and cli.

When command invoked, ALWAYS follow those steps:

1. Use the `/commit` command to commit your changes inside the current branch or worktree.
2. Create the merge request with `glab mr create`.
3. Add detailed description of the merge request.
4. Assign it to me.
5. Open the merge request in my browser.
6. **Worktree Lifecycle**:
   - If operating inside a `.worktree/<branch>` folder, the worktree remains active while the MR is open.
   - Once the MR is merged (or when user merges via `glab mr merge`), execute the post-merge worktree cleanup:
     1. Move the OpenCode session back to the primary repository root using `tools.opencode.session_move`.
     2. Remove the worktree: `git worktree remove .worktree/<branch> --force`.
     3. Prune worktrees: `git worktree prune`.
     4. Delete local branch: `git branch -d <branch> || git branch -D <branch>`.
