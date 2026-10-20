# Project Brief: OpenRouter Credits & Limits Extension for OpenCode

## Project Overview
Create an OpenCode extension (plugin) that displays real-time OpenRouter account credits, spending limits, usage, and limit status directly inside OpenCode (terminal TUI and server runtime).

## Core Requirements
1. **Accurate Balance & Limit Tracking**:
   - Query `https://openrouter.ai/api/v1/key` to retrieve key limit, remaining limit, total usage, effective budget, and free-model daily request quota.
   - Query `https://openrouter.ai/api/v1/credits` (for management keys) to retrieve total purchased credits and account-level usage.
   - Detect and clearly alert when limit is reached, near limit, or out of credits.
2. **Seamless Key Discovery**:
   - Check OpenCode's stored credentials in `~/.local/share/opencode/auth.json` (or `$XDG_DATA_HOME/opencode/auth.json`).
   - Support environment variables `OPENROUTER_API_KEY` / `OPENROUTER_KEY`.
   - Support plugin options in `opencode.jsonc` / `cli.json`.
3. **OpenCode TUI Integration**:
   - Provide a status badge/indicator in OpenCode's footer (`prompt.footer` / `prompt.footer.status` / `home.footer.status`).
   - Visual color cues: normal (green/accent), low credits warning (yellow), limit reached / error (red).
   - Slash command `/openrouter` (with aliases like `/credits`, `/orc`) and command palette item to view detailed modal/dialog breakdown.
   - Interactive modal showing: API key label, remaining balance, usage breakdowns (daily/weekly/monthly), rate limits, budget reset timestamps, and quick action to refresh.
4. **OpenCode Server Tool & Command Integration**:
   - Expose tool `openrouter_credits` so AI agents can query remaining balance if requested.
   - Slash command handler in server/TUI.
5. **Robustness & Performance**:
   - Caching with background periodic sync (e.g. 60s) to avoid unnecessary API requests and rate limiting.
   - Graceful offline / error handling (e.g. network blips, invalid key).
   - Zero runtime overhead and clean disposal.
