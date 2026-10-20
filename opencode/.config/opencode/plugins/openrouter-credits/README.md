# opencode-openrouter-credits

OpenCode extension that displays real-time OpenRouter account credits, spending limits, usage breakdowns, and quota statuses directly inside OpenCode (TUI status badges, interactive dashboard, and agent tools).

## Overview

When using [OpenRouter](https://openrouter.ai) as an LLM provider, API keys frequently have hard spending limits or prepaid credit ceilings. Hitting these limits mid-session results in sudden HTTP 402/403 failures that disrupt coding workflows.

`openrouter-credits` solves this by giving you:
1. **Prompt Footer Badge**: A real-time, color-coded badge in OpenCode's prompt footer showing remaining credits (e.g. `🪙 $42.50` or `⚠️ $1.15 left` or `🚫 Limit reached`).
2. **Interactive Dashboard**: Accessible via `/openrouter`, `/credits`, or clicking the footer badge to view detailed spend breakdowns (today, this week, this month), budget reset times, and free-model daily quotas.
3. **Agent Tool (`openrouter_credits`)**: Enables AI agents to proactively verify credit headroom before kicking off token-heavy tasks.
4. **Proactive Toast Alerts**: Warns you with desktop TUI toasts when your credits transition to low or when your spending limit is reached.
5. **Zero-Configuration Key Discovery**: Automatically detects your OpenRouter API key from OpenCode's stored credentials (`auth.json`), environment variables, or config options.

---

## Features

### 1. UI Widgets & Badges in TUI

- **Right Sidebar Widget (Right above Context)**: Placed in the right pane (`sidebar.content` slot) immediately above the built-in **Context** panel. Displays:
  - Header: **OpenRouter** with status icon and text (`🪙 Active`, `⚠️ Low Balance`, `🚫 Limit Reached`).
  - Key Balance & Limit: Remaining amount and limit (e.g. `$42.50 left of $100.00`).
  - Spend Stats: Daily spend today and total spend.
  - Reset / Budget: Reset schedule (Monthly/Weekly/Daily) or effective budget headroom.
  - Interactive: Click anywhere on the sidebar section to open the full dashboard.
- **Prompt Footer**: Displayed on the prompt bar (`prompt.footer` slot). Clickable to open the detailed dashboard.
- **Home Footer**: Contributes to the home screen status row (`home.footer.status` slot).
- **Color-Coded Health States**:
  - `🪙 Green` (`theme.text.feedback.success`): Balance healthy, plenty of headroom.
  - `⚠️ Amber/Yellow` (`theme.text.feedback.warning`): Credits below threshold (< $2.00 or < 10% remaining).
  - `🚫 Red` (`theme.text.feedback.error`): Limit reached ($0.00 left) or budget exhausted.
  - `🔑 Muted`: No OpenRouter key configured.
  - `❌ Red`: Network or authorization error.

### 2. Interactive Dashboard (`/openrouter` / `/credits`)

Running `/openrouter`, `/credits`, `/orc`, or clicking the footer badge opens an interactive modal:

- **Key Information**: Masked key label (`sk-or-v1-abc...7890`) and tier status (Standard / Free Tier).
- **Spending Limit & Remaining**: Shows remaining dollars and percentage of key limit spent.
- **Limit Reset Interval**: Clearly displays whether limits reset Daily, Weekly, Monthly, or Never (lifetime).
- **Usage Breakdown**:
  - Spend Today (UTC)
  - Spend This Week (Monday–Sunday)
  - Spend This Month
  - Lifetime Key Spend
  - BYOK (Bring Your Own Key) External Spend
- **Free-Model Daily Quota**: Remaining free requests today out of daily quota (resets at UTC midnight).
- **Guardrail / Workspace Budgets**: Displays effective budget ceilings if configured on your team/workspace.
- **Account Total Balance**: Displays total purchased credits and account-level balance if using a management key.
- **Interactive Actions**:
  - `🔄 Refresh Credits Now`: Force-queries OpenRouter API immediately.
  - `🔑 Set / Change OpenRouter API Key`: Prompts to input a new key, validates it against the API, and saves it directly to `~/.local/share/opencode/auth.json`.
  - `🌐 View OpenRouter Dashboard`: Quick link / guidance to open `openrouter.ai/settings/keys`.
  - `❌ Close`: Dismiss dialog.

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

## Keyboard & Slash Commands

| Command / Trigger | Action |
| --- | --- |
| `/openrouter` | Open interactive credits & limits dashboard |
| `/credits` | Alias for `/openrouter` |
| `/orc` | Short alias for `/openrouter` |
| `/openrouter refresh` | Force refresh balance immediately and show toast |
| Command Palette (`Ctrl+P`) | Select "OpenRouter: Check Credits & Limits" |
| Click on prompt footer | Open interactive credits & limits dashboard |

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
