# Contributing to ai-coding-agents

This is a personal dotfiles/AI-agent configuration repository. Contributions are informal — there is no formal review process, but the standards below are what the repo actually enforces, so follow them to keep things consistent.

Issues and suggestions are welcome at <https://github.com/jjmartres/ai-coding-agents/issues>.

## Table of Contents

- [What this repo is](#what-this-repo-is)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Adding an agent](#adding-an-agent)
- [Adding a skill](#adding-a-skill)
- [Adding a command](#adding-a-command)
- [Adding a rule](#adding-a-rule)
- [Coding standards](#coding-standards)
- [Pre-commit hooks](#pre-commit-hooks)
- [Testing changes locally](#testing-changes-locally)
- [License](#license)

## What this repo is

A **GNU Stow**-managed configuration repository that provisions shared AI agent personas, skills, slash commands, and rules across two coding agent tools: **opencode** and **pi-mono**.

Three Stow packages are managed:

| Package | Stow target | Contents |
|---------|-------------|----------|
| `shared/` | `$HOME` | Agents, skills, commands, rules (tool-agnostic) |
| `opencode/` | `$HOME` | opencode-specific config (`opencode.jsonc`, MCP, themes) |
| `pi-mono/` | `$HOME` | pi-mono config and TypeScript extensions |

`make install` stows all three packages and creates a convenience symlink:

```
~/.config/opencode/agents  →  ~/.ai-agents/agents
```

## Project structure

```
ai-coding-agents/
├── shared/                        # Stow package → $HOME
│   └── .ai-agents/
│       ├── agents/                # Agent .md files in 11 categories (00–10)
│       ├── skills/                # Skill packs (each: SKILL.md + optional refs)
│       ├── commands/              # Slash command .md files
│       └── rules/                 # Rule files (e.g. memory-bank.md)
├── opencode/                      # Stow package → $HOME
│   └── .config/opencode/          # opencode-specific config
├── pi-mono/                       # Stow package → $HOME
│   └── .pi/
│       └── agent/extensions/      # TypeScript extensions (*.ts)
├── scripts/
│   └── validate-jsonc.js          # JSONC validation script
├── docs/
│   ├── AGENTS.md
│   ├── SKILLS.md
│   ├── COMMANDS.md
│   └── RULES.md
├── .pre-commit-config.yaml        # Hook config (runs on git push)
├── .markdownlint.yaml             # Markdown lint rules
├── .stowrc                        # Stow configuration
├── Makefile                       # Automation
├── README.md
└── CONTRIBUTING.md
```

### File naming conventions

- **kebab-case** for all files and directories: `python-pro.md`, `marp-slide/`
- **Numeric category prefixes** for agent directories: `02-languages/`, `03-infrastructure/`
- **Skills** use a directory named after the skill with `SKILL.md` inside: `skills/marp-slide/SKILL.md`

## Development workflow

```bash
# 1. Clone
git clone https://github.com/jjmartres/ai-coding-agents.git
cd ai-coding-agents
git checkout -b feat/your-thing

# 2. Install symlinks and hooks
make install
make install-hooks

# 3. Make changes, then refresh symlinks if you added/removed files
make restow

# 4. Verify symlink state
make status

# 5. Run hooks manually before pushing
make run-hooks

# 6. Commit and push (hooks run automatically on push)
git add .
git commit -m "feat: add X agent"
git push origin feat/your-thing
```

## Adding an agent

Agents live under `shared/.ai-agents/agents/` in a numbered category directory.

**File path pattern:**

```
shared/.ai-agents/agents/XX-category/agent-name.md
```

**Frontmatter format:**

```markdown
---
description: One-line description of what this agent does
model: provider/model-id        # optional — omit to use tool default
thinkingLevel: medium           # optional — none | low | medium | high
tools: read,bash,edit,write     # optional — comma-separated tool list
---

System prompt body goes here...
```

Only `description` is required. All other frontmatter keys are optional.

**Rules:**

- File name in kebab-case: `payment-integration.md`
- Place in the most appropriate existing category directory
- The system prompt is the entire body after the frontmatter — no heading structure required
- Agents are invoked with `@agent-name` inline or via `/agents` in the tool

**Existing categories:**

```
00-general/
01-core/
02-languages/
03-infrastructure/
04-quality-and-security/
05-data-ai/
06-developer-experience/
07-specialized-domains/
08-business-product/
09-meta-orchestration/
10-curiosity/
```

## Adding a skill

Skills live under `shared/.ai-agents/skills/` in a named directory.

**Directory layout:**

```
shared/.ai-agents/skills/skill-name/
├── SKILL.md          # Required — skill definition and instructions
└── references/       # Optional — reference docs, examples, templates
```

**`SKILL.md` frontmatter:**

```markdown
---
name: skill-name
description: One-line description
license: MIT          # or other
compatibility:        # optional — list of compatible tools
  - opencode
  - pi-mono
---

Skill instructions and workflow...
```

Skills are loaded by the agent tool on demand and injected into the conversation context. They are invoked with the skill name referenced in an agent's instructions or triggered manually.

## Adding a command

Commands live under `shared/.ai-agents/commands/`.

**File path:**

```
shared/.ai-agents/commands/command-name.md
```

**Format:**

```markdown
---
description: One-line description
---

# Command Name

Workflow and instructions for the command...
```

Commands are invoked with `/command-name` inside the agent tool.

## Adding a rule

Rules live under `shared/.ai-agents/rules/`.

```
shared/.ai-agents/rules/rule-name.md
```

No required frontmatter. Rules are plain Markdown files loaded as persistent context by the agent tool.

## Coding standards

### Markdown

- markdownlint-compliant; config is in `.markdownlint.yaml`
- Long lines are fine (MD013 disabled) — do not wrap code examples
- No first-heading requirement (MD041 disabled)
- Run `make run-hooks` to check before pushing

### JSONC

- Comments are welcome and encouraged to explain non-obvious config
- Validate locally: `pre-commit run validate-jsonc --hook-stage pre-push`

### TypeScript (pi-mono extensions)

- Strict mode, ES2022 target, NodeNext module resolution
- Must pass `tsc --noEmit` — the `typecheck-extensions` hook enforces this on push
- Install `tsc` with `npm install -g typescript` if not present

### Shell scripts

- POSIX-compatible
- Must pass `shellcheck --severity=warning`

### Commit messages

[Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat:      new agent, skill, command, or capability
fix:       broken config, bad symlink, hook failure
docs:      README, CONTRIBUTING, inline docs
chore:     dependency updates, hook version bumps
refactor:  restructuring without behavior change
style:     formatting-only changes
```

## Pre-commit hooks

Hooks are configured in `.pre-commit-config.yaml` with `default_stages: [pre-push]`. They run on `git push`, **not** on `git commit`.

### Install

```bash
make install-hooks
# equivalent to: pre-commit install
```

Because `default_stages: [pre-push]` is set in the config, hooks automatically attach to the pre-push stage.

### Run manually

```bash
make run-hooks
# equivalent to: pre-commit run --all-files
```

To run a single hook:

```bash
pre-commit run <hook-id> --hook-stage pre-push --all-files

# Examples:
pre-commit run validate-jsonc --hook-stage pre-push --all-files
pre-commit run markdownlint --hook-stage pre-push --all-files
pre-commit run typecheck-extensions --hook-stage pre-push --all-files
```

### Update hook versions

```bash
make update-hooks
# equivalent to: pre-commit autoupdate
```

### Hook inventory

| Hook | What it checks |
|------|----------------|
| `check-stowrc-exists` | `.stowrc` is present |
| `validate-makefile` | Makefile parses without errors (`make -n help`) |
| `typecheck-extensions` | `tsc --noEmit` on `pi-mono/.pi/agent/extensions/*.ts` |
| `validate-jsonc` | All `*.jsonc` files via `node scripts/validate-jsonc.js` |
| `trailing-whitespace` | Trims trailing whitespace |
| `end-of-file-fixer` | Files end with a newline |
| `check-yaml` | YAML syntax |
| `check-added-large-files` | Rejects files > 1 MB |
| `check-merge-conflict` | Leftover conflict markers |
| `detect-private-key` | Accidentally committed secrets |
| `mixed-line-ending` | Enforces LF line endings |
| `check-json` | JSON syntax (`.jsonc` files excluded) |
| `markdownlint` | Markdown under `shared/` against `.markdownlint.yaml` |
| `shellcheck` | Shell scripts at `--severity=warning` |

## Testing changes locally

```bash
# 1. Reinstall symlinks after adding or removing files
make restow

# 2. Check symlink state
make status

# 3. Remove broken symlinks if any
make clean

# 4. Run all hooks manually
make run-hooks

# 5. Full reinstall cycle if needed
make uninstall && make install
```

### Verify an agent loads correctly

After `make restow`, open your agent tool and invoke the agent with `@agent-name`. Confirm:

- The description appears correctly
- The system prompt renders as expected
- Any referenced tools or skills are accessible

### Verify Makefile changes

```bash
make check    # verify stow + package dirs
make help     # confirm all targets listed and syntax is valid
make status   # show symlink state
```

## License

Contributions are licensed under the same [MIT License](LICENSE) that covers the project.
