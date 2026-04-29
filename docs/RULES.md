# Rules

[← Back to README](../README.md)

Rules are always-on behavioural constraints loaded from `shared/.ai-agents/rules/`. Unlike agents (which are invoked explicitly) or skills (which are triggered by task context), rules are applied to every session automatically.

---

## memory-bank

**Source:** `shared/.ai-agents/rules/memory-bank.md`

### Purpose

Compensates for the AI's complete memory reset between sessions. Because the model begins every session with no knowledge of previous work, it relies entirely on a structured set of Markdown files — the **Memory Bank** — to reconstruct project context and continue effectively.

### Storage location

All Memory Bank files are stored in `.ai-agents/memory-bank/` inside the project root. The directory is created automatically at the start of the first session if it does not exist. If a legacy `.opencode/memory-bank/` directory is found, the rule migrates it automatically.

```
.ai-agents/
└── memory-bank/
    ├── projectbrief.md
    ├── productContext.md
    ├── activeContext.md
    ├── systemPatterns.md
    ├── techContext.md
    ├── progress.md
    └── [additional context files/folders]
```

### Core files

| File | Purpose |
|------|---------|
| `projectbrief.md` | Foundation document: core requirements, goals, and scope. Created at project start if absent. |
| `productContext.md` | Why the project exists, the problems it solves, and user experience goals. |
| `activeContext.md` | Current work focus, recent changes, next steps, active decisions, and key learnings. |
| `systemPatterns.md` | System architecture, key technical decisions, design patterns, and component relationships. |
| `techContext.md` | Technologies used, development setup, technical constraints, dependencies, and tool patterns. |
| `progress.md` | What works, what remains to build, current status, known issues, and decision history. |

Additional files or sub-folders may be added inside `memory-bank/` to document complex features, integration specs, API contracts, testing strategies, or deployment procedures.

### File hierarchy

The files build on each other in a defined hierarchy:

```
projectbrief.md
├── productContext.md
├── systemPatterns.md
└── techContext.md
         └── activeContext.md
                  └── progress.md
```

### Workflows

**Plan mode** — At session start the AI reads all Memory Bank files. If any required file is missing it creates a plan and documents it in the chat. If all files are present it verifies the context, develops a strategy, and presents the approach before acting.

**Act mode** — During execution the AI checks the Memory Bank, updates documentation as work progresses, executes the task, and records significant changes.

### Update triggers

The Memory Bank is updated when:

1. A new project pattern is discovered.
2. A significant change is implemented.
3. The user explicitly requests **update memory bank** (all files are reviewed, even those that need no changes).
4. Context needs clarification.

When triggered by an explicit **update memory bank** request, `activeContext.md` and `progress.md` receive the closest attention because they track current state.

### Key behaviours

- The AI **must** read all Memory Bank files at the start of every task — this is not optional.
- The directory check and creation happen before any read or write operation.
- Memory Bank files are the AI's only link to previous sessions; their accuracy directly determines the AI's effectiveness.
- Files are maintained in plain Markdown for human readability and version control compatibility.
