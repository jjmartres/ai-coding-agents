# Architecture

[← Back to README](../README.md)

This document describes the structure of `ai-coding-agents`, how the three Stow packages are deployed to `$HOME`, and how the pi-mono extensions interact at runtime.

## Table of contents

- [Repository layout](#repository-layout)
- [Stow deployment model](#stow-deployment-model)
- [Shared package structure](#shared-package-structure)
- [Pi-mono extensions](#pi-mono-extensions)
- [Extension interaction map](#extension-interaction-map)
- [Memory bank location](#memory-bank-location)

---

## Repository layout

The repository contains three independent [GNU Stow](https://www.gnu.org/software/stow/) packages. Each package mirrors the directory structure under `$HOME`, so `stow <package>` creates the corresponding symlinks.

```
ai-coding-agents/
├── shared/          # → $HOME  (agents, skills, commands, rules)
├── opencode/        # → $HOME  (opencode-specific config and themes)
├── pi-mono/         # → $HOME  (pi settings and TypeScript extensions)
├── scripts/         # Utility scripts (JSONC validator)
├── docs/            # Project documentation
├── Makefile
└── .pre-commit-config.yaml
```

---

## Stow deployment model

```mermaid
flowchart TD
    repo["ai-coding-agents/"]

    subgraph packages["Stow packages"]
        shared["shared/"]
        opencode["opencode/"]
        pi_mono["pi-mono/"]
    end

    subgraph home["$HOME (symlinks)"]
        ai_agents["~/.ai-agents/\nagents/ · skills/\ncommands/ · rules/"]
        oc_config["~/.config/opencode/\nopencode.jsonc · themes/\nplugins/ · agents → symlink"]
        pi_config["~/.pi/agent/\nsettings.json · models.json\nextensions/*.ts"]
    end

    repo --> packages
    shared -->|stow| ai_agents
    opencode -->|stow| oc_config
    pi_mono -->|stow| pi_config

    ai_agents -->|symlink ×4| oc_agents["~/.config/opencode/\nagents · skills · commands · rules\n(created by make link-shared)"]

    style repo fill:#1e1e2e,color:#cdd6f4
    style packages fill:#181825,color:#cdd6f4
    style home fill:#181825,color:#cdd6f4
```

`make install` runs `stow` for all three packages and then creates four
symlinks under `~/.config/opencode/` pointing to `~/.ai-agents/` (agents,
skills, commands, rules), because Stow cannot map the same source directory to
two different destinations. Use `make link-shared` to create these symlinks
independently.

---

## Shared package structure

The `shared/` package provides everything that both opencode and pi-mono consume:
agents, skills, commands, and rules.

```mermaid
flowchart LR
    subgraph shared["shared/.ai-agents/"]
        direction TB
        agents["agents/\n(80+ .md files\nin 11 categories)"]
        skills["skills/\n(19 skill packs\neach with SKILL.md)"]
        commands["commands/\n(12 slash commands\n.md files)"]
        rules["rules/\n(always-on\nbehavioural rules)"]
    end

    subgraph consumers["Consumers"]
        oc["opencode\n(reads ~/.ai-agents/)"]
        pi["pi-mono\n(reads ~/.ai-agents/\nvia extensions)"]
    end

    agents --> oc
    agents --> pi
    skills --> oc
    skills --> pi
    commands --> oc
    commands --> pi
    rules --> pi
```

### Agent categories

Agents are organised into 11 numbered directories under `agents/`. The prefix
controls display order in the picker:

| Directory | Domain |
|-----------|--------|
| `00-general/` | General-purpose and communication |
| `01-core/` | Backend, API, fullstack, microservices |
| `02-languages/` | Language-specific experts (Python, Go, TS, …) |
| `03-infrastructure/` | DevOps, Kubernetes, cloud, SRE |
| `04-quality-and-security/` | QA, code review, penetration testing |
| `05-data-ai/` | Data engineering, ML, LLM architecture |
| `06-developer-experience/` | DX, CLI, build, documentation |
| `07-specialized-domains/` | Fintech, blockchain, music, payments |
| `08-business-product/` | Product, legal, UX, marketing |
| `09-meta-orchestration/` | Multi-agent coordination and context |
| `10-curiosity/` | Research, trend analysis, market intelligence |

---

## Pi-mono extensions

Extensions in `pi-mono/.pi/agent/extensions/` are TypeScript files loaded
automatically by pi on startup. Each file exports a default function that
receives the `ExtensionAPI` and registers hooks, commands, and tools.

```mermaid
flowchart TD
    pi["pi runtime"]

    subgraph extensions["~/.pi/agent/extensions/"]
        agents_ext["agents.ts\nAgent registry + /agents picker"]
        aliases_ext["aliases.ts\n/exit · /q"]
        git_ext["git-checkpoint.ts\ngit stash per turn"]
        gate_ext["permission-gate.ts\nDangerous command guard"]
        piline_ext["piline.ts\nCustom footer"]
        paths_ext["protected-paths.ts\nWrite guard"]
        rules_ext["rules.ts\nSystem prompt injection"]
        sessions_ext["sessions-management.ts\n/session-* commands"]
        searcher_ext["skills-searcher.ts\n$ trigger picker"]
        skills_ext["skills.ts\nAuto-skill injection"]
        todo_ext["todo.ts\ntodo tool + /todos"]
        tps_ext["tps.ts\nTPS notification"]
        usage_ext["usage.ts\n/usage dashboard"]
    end

    pi -->|loads| extensions
```

---

## Extension interaction map

Some extensions communicate with each other rather than operating in isolation.
The primary coupling is between `agents.ts` and `piline.ts` via the event bus.

```mermaid
sequenceDiagram
    participant User
    participant pi as pi runtime
    participant agents as agents.ts
    participant piline as piline.ts
    participant rules as rules.ts
    participant skills as skills.ts

    User->>pi: /agents → select @python-pro
    pi->>agents: command handler
    agents->>pi: pi.setModel() · pi.setThinkingLevel()
    agents->>pi: pi.events.emit("agents:changed", {name})
    pi->>piline: agents:changed event
    piline->>pi: tui.requestRender()
    Note over piline: Footer updates to show @python-pro

    User->>pi: Send prompt with .py file reference
    pi->>skills: before_agent_start
    skills->>pi: Append python-dev-guidelines to system prompt

    pi->>rules: before_agent_start
    rules->>pi: Append rules content to system prompt

    pi->>agents: before_agent_start
    agents->>pi: Append @python-pro system prompt
```

### Event bus usage

| Event emitted | Source | Consumers |
|---------------|--------|-----------|
| `agents:changed` | `agents.ts` | `piline.ts` |

All other inter-extension communication happens through pi's built-in lifecycle
events (`session_start`, `turn_start`, `before_agent_start`, `tool_call`, etc.).

---

## Memory bank location

The memory bank rule (`shared/.ai-agents/rules/memory-bank.md`) stores session
context in `.ai-agents/memory-bank/` inside the project root. If a legacy
`.opencode/memory-bank/` directory is found, the rule migrates it automatically.

```
<project-root>/
└── .ai-agents/
    └── memory-bank/
        ├── projectbrief.md      # Core requirements and goals
        ├── productContext.md    # Why the project exists
        ├── activeContext.md     # Current focus and next steps
        ├── systemPatterns.md    # Architecture and design decisions
        ├── techContext.md       # Technologies, constraints, dependencies
        └── progress.md          # Status, known issues, decision history
```

The files build on each other in a defined hierarchy — `projectbrief.md` is
the foundation; `progress.md` and `activeContext.md` change most frequently.
