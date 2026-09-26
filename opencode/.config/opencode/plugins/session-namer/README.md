# opencode-session-namer

OpenCode V2 plugin for LLM-driven session naming using Emoji Badges and Imperative Actions.

## Convention Format

`<emoji> <Action verb> <Key target>`

### Examples:
- ✨ Implement OAuth2 token refresh
- 🐛 Fix TUI resize flicker
- ♻️ Refactor session namer hook
- 🔍 Audit permission escalation policies

### Why it works:
Visual anchors provide immediate clarity to distinguish features, fixes, refactoring, and audits across the session list at a glance.

## How It Works

Hooks into OpenCode's `title` hook (`ctx.session.hook("title", ...)`).
It shapes the title agent's `system` instructions to enforce emoji selection, imperative action verbs, concise length, and clean formatting.
