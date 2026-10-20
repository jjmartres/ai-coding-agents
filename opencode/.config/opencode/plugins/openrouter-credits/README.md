# opencode-openrouter-credits

OpenCode extension that displays real-time OpenRouter account credits, spending limits, usage breakdowns, and quota statuses directly inside OpenCode (TUI status badges, interactive dashboard, and agent tools).

## Overview

When using [OpenRouter](https://openrouter.ai) as an LLM provider, API keys frequently have hard spending limits or prepaid credit ceilings. Hitting these limits mid-session results in sudden HTTP 402/403 failures that disrupt coding workflows.

`openrouter-credits` solves this by giving you:
1. **Right Sidebar Widget**: Located cleanly between the Workspaces section and the Context section on the right side.
2. **Interactive Dashboard**: Accessible via `/openrouter`, `/credits`, or clicking the sidebar widget to view detailed spend breakdowns, budget reset times, and free-model daily quotas.
3. **Agent Tool (`openrouter_credits`)**: Enables AI agents to proactively verify credit headroom before kicking off token-heavy tasks.
4. **Proactive Toast Alerts**: Warns you with desktop TUI toasts when your credits transition to low or when your spending limit is reached.
5. **Zero-Configuration Key Discovery**: Automatically detects your OpenRouter API key from OpenCode's stored credentials (`auth.json`), environment variables, or config options.

---

## Features

### 1. Right Sidebar Widget (Between Workspaces and Context)

Placed cleanly in the right pane (`sidebar.content` slot) immediately between **Workspaces** and the built-in **Context** panel:

```text
OpenRouter
  Weekly: $96.26 / $100.00
  Spend: $3.74 today • $979.80 total
  Credit: $420.20 available
```

- **Header**: Clean **OpenRouter** section title matching the native sidebar style.
- **Weekly / Monthly / Daily**: Dynamic spending limit line showing remaining amount out of configured key cap (e.g. `Weekly: $96.26 / $100.00` or `Monthly: ...`).
- **Spend**: Daily spend today and cumulative key spend (`Spend: $3.74 today • $979.80 total`).
- **Credit**: Net account-wide credits available (`Credit: $420.20 available`).

### 2. Live Consumption Refresh

The widget automatically synchronizes live token consumption:
- Listens to execution and usage events (`session.step.ended`, `session.execution.succeeded`, `session.usage.updated`, `session.idle`).
- Automatically queries OpenRouter in the background to reflect newly billed tokens.
- Periodic 15-second background refresh ensures figures remain fresh without manual intervention.

### 3. Agent Tool (`openrouter_credits`)

The extension registers an agent tool allowing coding agents in OpenCode to inspect balances:

```json
{
  "name": "openrouter_credits",
  "input": {
    "refresh": false
  }
}
```

Returns structured JSON containing `status`, `limit_usd`, `remaining_usd`, `limit_reached`, `usage_daily_usd`, `usage_weekly_usd`, `usage_monthly_usd`, and `free_model_daily_requests`.

### 4. Background Polling & Smart Event Refresh

- **Background Interval**: Queries OpenRouter every 60 seconds (configurable) in the background with cached responses.
- **Event-Driven Sync**: Listens to OpenCode execution events (`session.execution.succeeded`, `session.idle`) and automatically refreshes 1.5s after model completions so your displayed credits reflect recent token consumption without manual intervention.

---

## Configuration & Key Discovery

The extension resolves your OpenRouter API key using the following precedence:

1. **Plugin Options**: Explicitly set in `opencode.jsonc` or `cli.json`.
2. **Environment Variable**: `OPENROUTER_API_KEY` (or `OPENROUTER_KEY`).
3. **OpenCode Auth Store**: Read from `~/.local/share/opencode/auth.json` (or `$XDG_DATA_HOME/opencode/auth.json`) under `"openrouter": { "key": "..." }`.

### Configuration Options

You can customize the extension behavior in `cli.json` or `opencode.jsonc`:

```jsonc
{
  "plugins": [
    {
      "package": "./plugins/openrouter-credits",
      "options": {
        "pollIntervalSeconds": 60,
        "lowCreditThresholdUsd": 2.00,
        "lowCreditThresholdPercent": 10,
        "badgeFormat": "compact", // "compact" | "detailed" | "remaining_only"
        "showInSidebar": true, // render section in right sidebar above Context
        "showInPromptFooter": true,
        "showInHomeFooter": true
      }
    }
  ]
}
```

---

## File Structure

```text
openrouter-credits/
├── api.ts              # OpenRouter API client (GET /key, GET /credits, caching)
├── format.ts           # Currency, percent, relative time, and badge formatters
├── index.ts            # Server plugin entrypoint (openrouter_credits tool, background sync)
├── key-resolver.ts     # Multi-source API key resolver and auth.json storage
├── package.json        # Plugin metadata and dependency definitions
├── README.md           # Documentation
├── test/
│   └── openrouter.test.ts # Comprehensive test suite (Node test runner)
├── tsconfig.json       # TypeScript configuration with OpenTUI JSX support
└── tui.tsx             # CLI/TUI plugin (footer slots, dialogs, keymap layers, toasts)
```
