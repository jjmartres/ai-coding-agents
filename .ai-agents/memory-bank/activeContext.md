# Active Context: OpenRouter Credits Extension

## Current Work Focus
- Added dedicated right-sidebar widget in `sidebar.content` positioned immediately above the **Context** panel.
- Verified unit test suite (20 tests passing) and strict TypeScript compilation (0 errors).
- Extension registered in `opencode/.config/opencode/cli.json` and `opencode.jsonc`.
- Ready for review and deployment.

## Recent Changes
- Initialized memory bank files in `.ai-agents/memory-bank/`.
- Created worktree `feat-openrouter-credits-plugin` on branch `feat/openrouter-credits-plugin`.
- Implemented `types.ts` defining data models for OpenRouter `/key` and `/credits` APIs, budget layers, quotas, and plugin options (`showInSidebar`).
- Implemented `key-resolver.ts` supporting multi-source key discovery (options, `OPENROUTER_API_KEY`, `OPENROUTER_KEY`, `~/.local/share/opencode/auth.json`) and secure key persistence.
- Implemented `format.ts` for currencies, percentages, reset windows, relative timestamps, and TUI status badges.
- Implemented `api.ts` with TTL caching, error handling, status evaluation (ok, low, limit_reached, no_key, error), and support for both key limits and account balances.
- Implemented `index.ts` (Server Plugin) exporting agent tool `openrouter_credits`, slash command `/openrouter-credits`, and background sync.
- Implemented `tui.tsx` (CLI/TUI Plugin) with:
  - Right sidebar panel placed in `sidebar.content` directly above the Context section.
  - Interactive click handlers to launch the full details dialog.
  - Clickable status badge in `prompt.footer` and `home.footer.status`.
  - Color-coded indicators (green for ok, amber for low credits, red for limit reached).
  - Slash commands `/openrouter`, `/credits`, `/orc` and command palette integration.
  - Interactive modal dialog showing full financial and quota breakdown with actions (Refresh now, Change key, Open dashboard).
  - Event listener refreshing balance automatically 1.5s after model completions.
  - Proactive warning toasts on critical transitions (e.g. limit reached).
- Configured plugin in `opencode/.config/opencode/cli.json` and `opencode.jsonc`.
- Wrote unit tests in `test/openrouter.test.ts` (20/20 passing) and validated type safety with `tsc`.

## Next Steps
- Present solution and capabilities to the user.
- Await user feedback or proceed with commit / merge.
