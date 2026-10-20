# Tech Context: OpenRouter Credits Extension

## Technologies Used
- **Runtime**: Node.js (v20+), ECMAScript Modules (`"type": "module"`).
- **Languages**: TypeScript 5.0+ (strict mode, no explicit any without justification).
- **Frameworks & UI**:
  - `@opencode/plugin`: OpenCode Server plugin runtime.
  - `@opencode/plugin/tui`: OpenCode CLI/TUI plugin runtime.
  - `solid-js`: Reactive UI library for TUI components.
  - `@opentui/core` / `@opentui/solid`: OpenTUI terminal rendering elements (`<box>`, `<text>`).
- **External APIs**:
  - OpenRouter API (`https://openrouter.ai/api/v1`):
    - `GET /key`: Key info, limit, limit_remaining, usage, effective_budget, free_model_daily_requests.
    - `GET /credits`: Total purchased credits and total account usage (for management keys).

## Tooling & Constraints
- OpenCode V2 plugin conventions.
- Package export structure with `.` and `./tui`.
- Must work seamlessly across macOS, Linux, and Windows.
- Auth file location: respects `$XDG_DATA_HOME/opencode/auth.json` with fallback to `~/.local/share/opencode/auth.json`.
- Testing: Node test runner (`node:test`) or standalone test scripts with mock responses.
