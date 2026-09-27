---
description: Delete a git worktree under .worktree/ or clean up all merged worktrees
---

# Worktree Delete Command

Removes an isolated git worktree from `.worktree/` and deletes the associated branch. Supports deleting a specific worktree or auto-cleaning all worktrees whose PRs/MRs have been merged.

## Instructions for Agent

1. **Parse Arguments**:
   - Inspect `$ARGUMENTS`.
   - Supported modes:
     - Specific branch or folder: e.g. `/worktree-delete feature-auth` or `/worktree-delete .worktree/feature-auth`.
     - Merged cleanup: `/worktree-delete --merged`, `/worktree-delete merged`, or no argument if asking to prune merged trees.

2. **Handle Merged Worktrees Cleanup (`--merged`)**:
   When cleaning merged trees:
   - Identify default branch (e.g. `main` or `staging`):
     `DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@' || echo "main")`
   - Update remote refs: `git fetch --prune`
   - Get list of merged branches:
     - Via git: `git branch --merged origin/$DEFAULT_BRANCH`
     - Via GitLab (if available): `glab mr list --state merged`
     - Via GitHub (if available): `gh pr list --state merged`
   - For every worktree located in `.worktree/`:
     - If its branch is merged:
       - If active OpenCode session is inside this worktree, move session to repository root first:

         ```javascript
         await tools.opencode.session_move({ directory: "<repo-root>" });
         ```

       - Remove worktree: `git worktree remove "<worktree-path>" --force`
       - Delete local branch: `git branch -d "<branch>" || git branch -D "<branch>"`
   - Run `git worktree prune`.
   - Report all deleted worktrees to user.

3. **Handle Specific Worktree Deletion**:
   When targeting a specific branch or directory:
   - Determine target path: `.worktree/<branch>` (or verify against `git worktree list`).
   - Check for uncommitted work:
     `git -C "<worktree-path>" status --porcelain`
     - If uncommitted changes exist, alert user with summary and confirm deletion.
   - **Session Safety**:
     - Check if current OpenCode working directory matches the target worktree.
     - If yes, **MOVE THE SESSION TO REPOSITORY ROOT FIRST**:

       ```javascript
       await tools.opencode.session_move({ directory: "<repo-root>" });
       ```

   - **Remove Worktree**:

     ```bash
     git worktree remove "<worktree-path>" --force
     ```

   - **Prune Metadata**:

     ```bash
     git worktree prune
     ```

   - **Delete Local Branch**:

     ```bash
     git branch -d "<branch>" || git branch -D "<branch>"
     ```

   - Confirm removal to the user.
