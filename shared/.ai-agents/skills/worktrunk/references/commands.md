# Worktrunk Commands Reference

## wt switch

Switch to or create a worktree.

```bash
wt switch <branch>                    # Switch to existing worktree
wt switch --create <branch>           # Create branch + worktree, then switch
wt switch -c -x claude <branch>       # Create + launch Claude
wt switch -c -x claude <branch> -- '<prompt>'  # With initial prompt
wt switch -                           # Previous worktree
wt switch @                           # Current worktree (no-op, useful with --execute)
```

### Key flags

| Flag | Short | Description |
|---|---|---|
| `--create` | `-c` | Create new branch and worktree |
| `--execute <cmd>` | `-x` | Run command after switching (after post-create hooks) |
| `--base <branch>` | | Base branch for creation (default: default branch) |
| `--base=@` | | Base from current HEAD (stacked branches) |
| `--no-verify` | | Skip hooks |
| `--yes` | | Skip approval prompts |

### Interactive Picker

`wt switch` with no arguments opens an interactive picker with:

- Tab 1: Worktrees (live diff preview)
- Tab 2: All branches (log preview)
- Tab 3: Remote branches
- Tab 4: PRs (if gh/glab configured)
- Tab 5: LLM branch summaries (if configured)

### Shortcuts

```bash
wt switch - prefix-*         # Fuzzy match on branch prefix
wt switch --create hotfix --base=@   # Branch from current HEAD
```

## wt list

Show all worktrees with rich status.

```bash
wt list                    # All worktrees
wt list --full             # Add CI status, PR links, LLM summaries
wt list --branches         # Include remote branches without worktrees
wt list --format=json      # JSON output
wt list statusline --format=claude-code  # Single-line for Claude Code statusline
```

### Status Column Indicators

| Symbol | Meaning |
|---|---|
| `@` | Current worktree |
| `+` / `-` | Staged / unstaged changes |
| `?` | Untracked files |
| `↑` / `↓` | Ahead / behind remote |
| `⇡` / `⇣` | Ahead / behind default branch |
| `^` | Up to date with remote |
| `🤖` | Claude working (plugin) |
| `💬` | Claude waiting for input (plugin) |

### Custom URL Column

```toml
# .config/wt.toml
[list]
url = "http://localhost:{{ branch | hash_port }}"
```

## wt merge

Squash, rebase, merge, and clean up in one command.

```bash
wt merge main              # Merge current branch into main
wt merge staging           # Merge into staging
```

### Pipeline

1. Run `pre-commit` hooks (optional lint/format)
2. Stage any remaining changes + generate LLM commit message
3. Squash all commits if needed
4. Rebase onto target branch
5. Run `pre-merge` hooks (tests, builds)
6. Fast-forward merge to target
7. Remove worktree + branch (`pre-remove` / `post-remove` hooks)
8. Run `post-merge` hooks in target worktree

### Flags

| Flag | Description |
|---|---|
| `--no-squash` | Keep individual commits |
| `--no-rebase` | Skip rebase step |
| `--no-verify` | Skip all hooks |
| `--yes` | Skip prompts |

## wt remove

Remove worktree and branch.

```bash
wt remove                  # Remove current worktree
wt remove <branch>         # Remove specific worktree
wt remove @                # Remove current (same as no args)
wt remove --all            # Remove all non-default worktrees
```

Runs `pre-remove` (blocking) and `post-remove` (background) hooks.

## wt step

Utility commands for worktree workflows.

```bash
wt step commit             # Commit staged changes (with optional LLM message)
wt step commit --all       # Stage all + commit
wt step copy-ignored       # Copy gitignored files from nearest worktree (deps, caches, .env)
```

### copy-ignored

Copies gitignored files between worktrees to eliminate cold starts.

Control scope with `.worktreeinclude`:

```
# Only copy files matching these patterns (must also be gitignored)
node_modules/
.env.local
target/
.venv/
```

Without `.worktreeinclude`, all gitignored files are copied.

## wt config

Manage configuration and state.

```bash
# Shell integration
wt config shell install    # Install shell function (enables directory changes)

# State inspection
wt config state default-branch              # Show detected default branch
wt config state logs get                    # List all hook log files
wt config state logs get --hook=project:post-start:server  # Specific log
wt config state marker set "🚧"            # Set status marker for current branch
wt config state marker set "✅" --branch feat  # Set for specific branch

# Hook approvals
wt config state approvals  # Alias for wt hook approvals
```

### Config File Locations

| File | Scope |
|---|---|
| `~/.config/worktrunk/config.toml` | User/global |
| `.config/wt.toml` | Project (checked into repo) |

### Global Config Options

```toml
# ~/.config/worktrunk/config.toml

# Worktree path template (default: sibling directory)
worktree-path = "../{{ repo }}.{{ branch | sanitize }}"

# Bare repo layout (worktrees as subdirectories)
# worktree-path = "../{{ branch | sanitize }}"

[commit.generation]
provider = "anthropic"
model = "claude-opus-4-5"

[list]
summary = true   # LLM branch summaries (sends diffs to LLM)
```

### Setting Overrides (per-repo user hooks)

```toml
# ~/.config/worktrunk/config.toml
[settings_overrides.myrepo]
[settings_overrides.myrepo.post-create]
special = "echo 'myrepo-specific setup'"
```

## wt hook

Run hooks manually. See `references/hooks.md` for full documentation.

```bash
wt hook <type>                    # Run all hooks of that type
wt hook <type> <name>             # Run specific hook
wt hook <type> user:              # Only user hooks
wt hook <type> project:<name>     # Specific project hook
wt hook <type> --var branch=feat  # Override template variable
wt hook approvals add             # Pre-approve all project hooks
wt hook approvals clear           # Reset approvals
```

## Global Flags (all commands)

| Flag | Description |
|---|---|
| `-C <path>` | Set working directory |
| `--config <path>` | Use alternate config file |
| `-v` / `-vv` | Verbose / debug output |
| `-h` / `--help` | Help |

## Useful Aliases

```bash
# ~/.config/fish/config.fish (or .bashrc/.zshrc)
alias wsc='wt switch --create --execute=claude'
alias wtlog='f() { tail -f "$(wt config state logs get --hook="$1")"; }; f'

# Usage
wsc feature-auth                           # Create worktree + launch Claude
wsc feature-auth -- 'Implement OAuth2'     # With prompt
wtlog project:post-start:server            # Follow dev server log
```

## Bare Repository Layout

Alternative layout with worktrees as subdirectories:

```bash
git clone --bare <url> myproject/.git
cd myproject
```

```toml
# ~/.config/worktrunk/config.toml
worktree-path = "../{{ branch | sanitize }}"
```

```bash
wt switch --create main   # Creates myproject/main/
wt switch --create feat   # Creates myproject/feat/
```
