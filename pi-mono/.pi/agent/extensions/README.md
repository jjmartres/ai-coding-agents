# Pi Extensions

Custom extensions loaded automatically from `~/.pi/agent/extensions/`.
All extensions are globally active across every project.

---

## Table of Contents

| Extension | Purpose |
|---|---|
| [agents.ts](#agentsts) | Named agent personas with model, tools, and system-prompt |
| [aliases.ts](#aliasests) | Command aliases for cross-tool muscle memory |
| [git-checkpoint.ts](#git-checkpointts) | Git stash snapshots per turn for branch restore |
| [permission-gate.ts](#permission-gatets) | Confirmation prompt before dangerous bash commands |
| [piline.ts](#pilinets) | Information-dense custom footer |
| [protected-paths.ts](#protected-pathsts) | Block writes to sensitive files |
| [rules.ts](#rulests) | Inject persistent rules into the system prompt |
| [sessions-management.ts](#sessions-managementts) | Session naming, browsing, creation, deletion |
| [skills-searcher.ts](#skills-searcherts) | `$`-triggered skill picker in the editor |
| [skills.ts](#skillsts) | Auto-inject skill guidelines from context |
| [todo.ts](#todots) | LLM-managed todo list with branch-aware state |
| [tps.ts](#tpsts) | Tokens-per-second notification after each turn |
| [usage.ts](#usagets) | Interactive usage statistics dashboard |

---

## agents.ts

Defines named agent personas. Each agent can carry its own model, thinking
level, tool set, and system-prompt. Agents integrate with the Piline footer via
the `agents:changed` event bus.

### Activation modes

| Mode | How | Scope |
|---|---|---|
| `/agents` | SelectList picker | Session-wide — sets model, tools, thinking |
| `@agent-name` | Inline in any prompt | Turn-only — appends system prompt |

### Configuration (`settings.json`)

```json
{
  "agents":       ["~/.ai-agents/agents"],
  "defaultAgent": "documentation-engineer"
}
```

- `agents` — array of directories or files; subdirectories are scanned
  recursively (first-level subdir name becomes the category label in the picker).
- `defaultAgent` — agent applied automatically on startup and new sessions.
  Resuming a session preserves the agent that was active when it was last used.

### Agent file format

`~/.ai-agents/agents/<category>/<name>.md`

```markdown
---
description: Expert Python developer
model:        anthropic/claude-opus-4-7
thinkingLevel: high
tools:        read,bash,edit,write
---
You are an expert Python developer...
```

All frontmatter fields are optional. The filename without `.md` is the name
used in `@mentions` and the `/agents` picker.

### Commands

| Command | Description |
|---|---|
| `/agents` | Open SelectList to activate or clear the session agent |

### Events emitted

`agents:changed` — `{ name: string \| null }` — fired whenever the active agent
changes, allowing other extensions (Piline) to update without polling.


---

## aliases.ts

Registers short-hand command aliases for commands that exist in other tools
but are named differently in pi. All aliases are hardcoded directly in the
extension for maximum portability — add new entries there as needed.

### Commands

| Command | Alias for | Description |
|---|---|---|
| `/exit` | `ctx.shutdown()` | Graceful quit — Opencode muscle memory |
| `/q` | `ctx.shutdown()` | Short quit alias |

No configuration required.

---

## git-checkpoint.ts

Captures a `git stash create` reference before every LLM turn. When the user
navigates the session tree to an earlier branch point, they are offered the
option to restore the working-tree state to that snapshot.

### Behaviour

1. **`turn_start`** — calls `git stash create` silently; maps the ref to the current session entry ID.
2. **`session_before_branch`** — prompts (interactive mode only): *"Restore code state?"*
3. **`agent_end`** — clears the in-memory checkpoint map.

No configuration required. No commands.

---

## permission-gate.ts

Intercepts `bash` tool calls matching dangerous patterns and requires explicit
user confirmation. In non-interactive mode commands are blocked automatically.
The confirmation dialog auto-denies after **30 seconds**.

### Guarded patterns

| Pattern | Reason |
|---|---|
| `rm -rf` / `rm -r` | Recursive deletion |
| `sudo` | Privilege escalation |
| `chmod`/`chown` `777` | World-writable permission changes |

No configuration required. No commands.

---

## piline.ts

Replaces pi's default footer with a two-sided status line.

```
󱋪 12.3%  ↑45.2k  ↓8.1k   0.042          ⎈ docker-desktop -   agent - 󰘬 main -  my-session - @python-pro - 󱚥  claude-sonnet-4-6 (medium)
```

| Side | Contents |
|---|---|
| Left | Context window %, input tokens, output tokens, cost |
| Right | Kubernetes context · folder · git branch · session name · active agent · model (thinking) |

### Reactive updates

| Signal | Update |
|---|---|
| `turn_end` | Refresh git branch and Kubernetes context |
| 500 ms poll | Session name (picks up `/name` and `Ctrl+R` renames) |
| `agents:changed` event | Active agent name |
| `turn_start` | Current model |

### Commands

| Command | Description |
|---|---|
| `/piline` | Toggle the custom footer on/off |

---

## protected-paths.ts

Blocks `write` and `edit` tool calls targeting paths that contain any of the
configured protected substrings. Notifies the user in interactive mode.

### Protected paths (default)

| Substring | What it protects |
|---|---|
| `.env` | Environment variable files |
| `.git/` | Git repository internals |
| `node_modules/` | Installed npm packages |
| `.worktrees/` | Git worktree directories |

No configuration required. No commands.

---

## rules.ts

Appends the content of rule files to the LLM system prompt on every agent turn,
equivalent to Opencode's built-in "rules" feature.

### Configuration (`settings.json`)

```json
{ "rules": ["~/.ai-agents/rules", ".pi/rules"] }
```

Each path may be a directory (direct `.md` children loaded, non-recursive) or
an individual `.md` file. Global rules are injected first; project rules follow.

### Rule file format

```markdown
---
description: Human-readable label (not sent to the LLM)
---
Always respond in the same language the user writes in.
```

The registry reloads on every `/reload`.

---

## sessions-management.ts

Provides a full set of commands for managing pi sessions.

### Commands

| Command | Description |
|---|---|
| `/session-name` | Auto-generate a session name from the conversation via the active model |
| `/session-name <title>` | Set a name manually (bypasses LLM) |
| `/session-list` | Browse all sessions for the current directory; press Enter to switch |
| `/session-new` | Start a fresh session (optionally with a name) |
| `/session-delete` | Pick and permanently delete a session file (current session excluded) |

### Auto-naming

After the first `agent_end` in a new session, if no name has been set, a name
is generated silently and applied via `pi.setSessionName()`. The flag resets on
each new or resumed session.

---

## skills-searcher.ts

Augments the pi input editor with a `$`-triggered skill picker. Typing `$` (or
`$query` to pre-filter) instantly opens a `SelectList` overlay listing all
registered skills.

### Usage

1. Type `$` in the editor → the overlay opens showing all skills sorted alphabetically.
2. Type `$cav` → overlay opens pre-filtered to skills matching `"cav"`.
3. Navigate with `↑` / `↓`, close with `Enter` or `Esc`.
4. Press `Esc` *before* the overlay opens to dismiss the hint without opening it.

The picker is **browse-only** — selecting a skill does not insert anything into
the editor.

---

## skills.ts

Automatically injects relevant skill guidelines into the LLM context when
signals in the conversation match a skill's trigger patterns — no manual
invocation required.

### Detection strategies

| Strategy | Trigger | Injection method |
|---|---|---|
| Prompt scan | Patterns in the user's prompt text | `before_agent_start` system prompt append |
| File scan | File extension/path in `read`/`edit`/`write` tool calls | Follow-up message on next turn |

Each skill is injected **at most once per session**.

### Supported triggers

| Skill | Trigger patterns |
|---|---|
| `python-dev-guidelines` | `.py`, `python`, `pytest`, `pip`, `poetry` |
| `shell-script-guidelines` | `.sh`, `bash`, `shell script`, `zsh` |
| `brave-search` | "search the web", `google`, `brave search` |

---

## todo.ts

Registers a `todo` tool for the LLM and a `/todos` command for the user.
State is stored inside **tool-result details** (not external files), so todo
state automatically matches the current session branch — branching to an earlier
point in history restores the todo list to exactly what it was at that point.

### State reconstruction

On `session_start` and `session_tree` events the extension replays every `todo`
tool-result entry on the active branch in order, rebuilding the in-memory list
without touching the filesystem.

### LLM tool — `todo`

| Action | Required params | Effect |
|---|---|---|
| `list` | — | Returns all todos as `[ ] #id: text` lines |
| `add` | `text` | Appends a new todo and returns its assigned ID |
| `toggle` | `id` | Flips the done/undone state of the given todo |
| `clear` | — | Removes all todos and resets the ID counter |

### Commands

| Command | Description |
|---|---|
| `/todos` | Open an interactive overlay showing the current todo list (interactive mode only) |

### Dashboard keybindings

| Key | Action |
|---|---|
| `Esc` / `Ctrl+C` | Close the overlay |

No configuration required.

---

## tps.ts

Displays a notification after every agent turn with token throughput and
usage breakdown. Silent in non-interactive (print / RPC) mode.

### Notification format

```
TPS 42.3 tok/s. out 1,234, in 5,678, cache r/w 2,000/500, total 9,412, 29.2s
```

No configuration required. No commands.

---

## usage.ts

An interactive token and cost dashboard accessible via `/usage`.

### Command

| Command | Description |
|---|---|
| `/usage` | Open the usage statistics dashboard |

### Keybindings inside the dashboard

| Key | Action |
|---|---|
| `Tab` / `←` `→` | Cycle time period: Today · This Week · Last Week · All Time |
| `↑` / `↓` | Navigate providers |
| `Enter` / `Space` | Expand/collapse provider to show per-model breakdown |
| `q` / `Esc` | Close |

### Columns (responsive, drops columns on narrow terminals)

Sessions · Messages · Cost · Tokens · ↑In · ↓Out · Cache

---

## Adding a new extension

Drop a `.ts` file in `~/.pi/agent/extensions/` — it is auto-discovered and
loaded on the next `/reload` or pi restart. No entry in `settings.json` is
required unless the file lives outside this directory.
