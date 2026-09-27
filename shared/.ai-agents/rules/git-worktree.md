# Git Worktree Policy & Multi-Session Isolation

All development tasks, bugfixes, features, and refactoring MUST use isolated `git worktree` instances instead of traditional in-place branch switching. This enables multiple concurrent OpenCode sessions to run on the same repository without branch conflicts, unstaged file collisions, or environment churn.

## 1. Storage Location: `.worktree/`

All worktrees MUST be created inside the `.worktree/` directory at the project root:

```
<repo-root>/
├── .git/
├── .worktree/
│   ├── feature-auth/       # Worktree for feature-auth branch
│   └── bugfix-login/       # Worktree for bugfix-login branch
├── .gitignore              # MUST ignore /.worktree/
└── ... (primary workspace files)
```

- Target path format: `<repo-root>/.worktree/<sanitized-branch-name>`
- Always ensure `.worktree` (or `/.worktree/`) is present in `.gitignore`. If missing, add it immediately.

## 2. In-Place Branch Switching Prohibited

- **NEVER** run `git checkout -b <branch>`, `git switch -c <branch>`, or switch branches directly in the primary workspace root.
- The primary repository root must remain on the default branch (e.g., `main` or `staging`) and clean.
- All branch-specific edits, tests, and commits must take place exclusively inside the respective `.worktree/<branch-name>` folder.

## 3. Mandatory Session Relocation (`session_move`)

Whenever a worktree is created or switched to:

1. Create or navigate to `<repo-root>/.worktree/<branch-name>`.
2. **IMMEDIATELY** reposition the active OpenCode session into the worktree directory using `execute`:

   ```javascript
   await tools.opencode.session_move({ directory: "<repo-root>/.worktree/<branch-name>" });
   ```

3. All subsequent tool calls (`read`, `edit`, `write`, `shell`, terminal execution) must operate within the worktree directory.

## 4. Worktree Creation Workflow

When starting work on any task, branch, or ticket:

1. Verify if `.worktree/<branch>` already exists using `git worktree list`.
2. If it does not exist:
   - Create the worktree:

     ```bash
     git worktree add .worktree/<branch-name> -b <branch-name>
     ```

     *(Or if `worktrunk` (`wt`) is preferred, use `wt switch --create <branch-name>` configured for `.worktree/`)*.
3. Copy local environment configurations from repository root if applicable (e.g. `.env`, `.env.local` if not committed).
4. Relocate the OpenCode session:

   ```javascript
   await tools.opencode.session_move({ directory: "<repo-root>/.worktree/<branch-name>" });
   ```

## 5. Auto-Deletion of Worktrees on PR / MR Merge

Whenever a Pull Request (GitHub) or Merge Request (GitLab) is merged (e.g., via `glab mr merge`, `gh pr merge`, or when detecting a merged status):

1. **Reposition session if needed**:
   - Check if the current session is inside `.worktree/<branch-name>`.
   - If yes, move the session back to the primary repository root before deleting:

     ```javascript
     await tools.opencode.session_move({ directory: "<repo-root>" });
     ```

2. **Remove the worktree directory**:

   ```bash
   git worktree remove .worktree/<branch-name> --force
   ```

3. **Prune stale worktree metadata**:

   ```bash
   git worktree prune
   ```

4. **Delete the local branch**:

   ```bash
   git branch -d <branch-name> || git branch -D <branch-name>
   ```

5. If the `.worktree/` folder is empty, preserve it or clean up empty subfolders.
