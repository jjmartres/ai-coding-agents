# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-27

### Added

- **Git Worktree Workflow & Automation**:
  - Added unified slash command `/worktree` to manage, create, list, and delete isolated git worktrees.
  - Added `/worktree.create` to spin up isolated worktrees under `.worktree/<branch>`, copy project `.env` configurations, and relocate the active session via `tools.opencode.session_move`.
  - Added `/worktree.list` to display all active worktrees with git clean/dirty status and live GitHub/GitLab PR/MR status.
  - Added `/worktree.delete` to safely prune worktrees and branches, automatically relocating active sessions back to repository root before deletion.
  - Added always-on behavioural rule `shared/.ai-agents/rules/git-worktree.md` requiring worktree isolation under `.worktree/` and preventing in-place branch churn.
  - Updated `/commit-and-create-mr` and `work-on-ticket` skill to follow worktree conventions.
  - Added `.worktree/` to `.gitignore`.
- **Universal Subagent Mode (`mode: all`) Across All 103 Agents**:
  - Configured `mode: all` across all 103 agent personas in `shared/.ai-agents/agents/` across categories `00-general` through `10-curiosity`.
  - Enables agents to be invoked both interactively (via `@mention`, `/agents`, or CLI `--agent`) and as delegated subagents in isolated child sessions via OpenCode's `subagent` tool.

### Changed

- **Standardized Slash Command Names**:
  - Renamed worktree slash commands to standard dot notation (`worktree.create`, `worktree.delete`, `worktree.list`).
- **Documentation Updates**:
  - Updated `README.md` and `docs/ARCHITECTURE.md` to reflect 103 agents, 18 slash commands, and the worktree architecture.
  - Updated `docs/COMMANDS.md` with full reference documentation for `/worktree*` commands.
  - Removed deprecated `/speckit.model-selector` command reference from `docs/COMMANDS.md`.
  - Updated `CONTRIBUTING.md` frontmatter specifications to document `mode: all`.

## [1.1.0] - 2026-09-27

### Added

- **On-Demand Google Cloud Skills Ecosystem (~129 Skills)**:
  - Vendored upstream `github.com/google/skills` at `vendor/google-skills` (isolated from Stow).
  - Offline router skill (`google-skills`) querying pre-indexed local catalog (`generated/google-skills-index.local.json`) with `jq`.
  - Direct symlink guardrail for `gcloud` CLI command safety and validation.
  - Interactive sync scripts: `scripts/google-skills-gen-index.fish` and `scripts/update-google-skills.fish`.
  - Always-on rule `shared/.ai-agents/rules/google-cloud.md`.
- **Knowledge Graph Extraction (`graphify`)**:
  - Added `graphify` skill generating interactive HTML visualizations, GraphRAG JSON, and community summaries.
- **Autonomous Operations MCP (`nibbler`)**:
  - Enabled `nibbler` remote MCP server by default in `opencode.jsonc` for GCP infrastructure triage, runbooks, and PAM access.
- **OpenCode V2 Native Architecture**:
  - Migrated configuration to native V2 schemas (`opencode.jsonc`, `cli.json`).
  - Added dynamic session namer plugin (`plugins/session-namer`) using Gemini 3.8 Flash with emoji badges.
  - Added live TUI clock plugin (`plugins/tui-clock`) rendered with Solid.js in the prompt footer.
  - Added `make link-agents` to flatten agent symlinks into `~/.config/opencode/agents/`.

### Removed

- Deprecated legacy plugins `@tarquinen/opencode-dcp` and `opencode-cost-guard`.
- Removed legacy configuration files (`tui.jsonc`, `dcp.jsonc`, `cost-guard.config.jsonc`).
- Removed legacy slash command `speckit.model-selector.md`.

## [1.0.1] - 2026-06-10

### Fixed

- Updated OpenRouter and OpenAI model prefix conventions across commands and plugins.
- Fixed EOF newlines, trailing whitespace, and markdown lint formatting across shared resources.
- Corrected LRGB processing workflow in `astro-dso-doc` checklist.

### Added

- AstroBin post JSON generation and PixInsight process icon set (`.xpsm`) export to `astro-dso-doc`.
- Added Karpathy coding guidelines skill and polish command.
- Integrated memory bank rules and pi-mono settings.

## [1.0.0] - 2026-04-20

### Added

- Initial release of shared AI agent configurations managed with GNU Stow.
- Multi-client support for both OpenCode and pi-mono.
- Over 80 specialized agent personas across 11 functional domains.
- Core slash commands for committing, testing, reviews, and documentation.
- Extensible skill pack foundation for robotics, diagramming, Jira, and Datadog.

[1.2.0]: https://github.com/jjmartres/ai-coding-agents/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/jjmartres/ai-coding-agents/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/jjmartres/ai-coding-agents/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/jjmartres/ai-coding-agents/releases/tag/v1.0.0
