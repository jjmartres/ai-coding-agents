---
description: Create a git worktree under .worktree/<branch> and relocate the OpenCode session there
---

# Worktree Create Command

Creates an isolated git worktree in the `.worktree/` directory for the given branch and relocates the current OpenCode session into it.

## Instructions for Agent

1. **Parse Branch Name**:
   - Extract branch name from `$ARGUMENTS`.
   - If no branch is supplied, prompt user for branch or ticket name.
   - Sanitize branch name for folder path (replace characters unsafe for directories while keeping git branch name clean).

2. **Repository Root & Gitignore Check**:
   - Determine repository root directory: `git rev-parse --show-toplevel`.
   - Ensure `.worktree` is ignored: check `.gitignore` at the repo root. If missing, append `.worktree/` to `.gitignore`.

3. **Check Existing Worktree**:
   - Run `git worktree list`.
   - If a worktree for this branch or at `.worktree/<branch>` already exists:
     - Relocate the session there using `tools.opencode.session_move({ directory: "<path>" })`.
     - Inform user that the existing worktree was reused.
     - Skip creation.

4. **Create Worktree**:
   - Check if the branch exists locally or remotely:
     - If remote branch exists: `git worktree add .worktree/<branch> <branch>`
     - If branch does not exist: `git worktree add .worktree/<branch> -b <branch>`
   - If local uncommitted `.env` / `.env.local` files exist in repository root, copy them into `.worktree/<branch>/` so dev environments remain functional.

5. **Relocate Session**:
   - Relocate this OpenCode session into `.worktree/<branch>` using `execute`:

     ```javascript
     await tools.opencode.session_move({ directory: "<repo-root>/.worktree/<branch>" });
     ```

6. **Confirm to User**:
   - Display:
     - Branch name
     - Worktree path: `.worktree/<branch>`
     - Confirmation that OpenCode session has been moved into the worktree.
