---
description: List all git worktrees under .worktree/ with branch status and PR/MR state
---

# Worktree List Command

Lists all git worktrees associated with the current repository, focusing on active worktrees located in `.worktree/`.

## Instructions for Agent

1. **Locate Repository Root**:
   - Determine repository root: `REPO_ROOT=$(git rev-parse --show-toplevel)`.

2. **Inspect Git Worktrees**:
   - Run `git worktree list --porcelain`.
   - Parse each worktree entry: path, HEAD commit, active branch name.

3. **Check Status per Worktree**:
   For each worktree in `.worktree/`:
   - Check if the working tree has uncommitted changes:
     `git -C "<worktree-path>" status --porcelain`
   - Check PR / MR status if CLI tools are available:
     - GitLab (`glab`): `glab mr list --source-branch "<branch>" --output json` (or `glab mr list`)
     - GitHub (`gh`): `gh pr list --head "<branch>" --json number,title,state`
     - Mark whether the branch has an active PR/MR or is already `MERGED`.
   - Identify which worktree currently hosts the active OpenCode session.

4. **Format and Present Output**:
   Render a clean summary table or list:
   - **Active Session Marker**: Mark `[CURRENT]` on the directory where the active session is located.
   - **Branch**: Branch name.
   - **Path**: Path relative to repo root (e.g., `.worktree/<branch>`).
   - **Git Status**: Clean / Uncommitted changes (`+` / `-`).
   - **PR / MR Status**: `Open`, `Merged`, `Closed`, or `No PR/MR`.
   - **Action Recommendation**: If `Merged`, recommend `/worktree-delete <branch>` or highlight auto-deletion.
