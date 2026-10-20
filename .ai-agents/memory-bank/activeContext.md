# Active Context: OpenRouter Credits Extension

## Current Work Focus
- Refactored `openrouter-credits` UI to be exclusively placed in the right sidebar between Workspaces and Context.
- Removed footer badge contributions from `prompt.footer` and `home.footer.status`.
- Updated sidebar lines to:
  1. `RESET_LIMIT: $296.26 / $300.00 (weekly)`
  2. `Spend: $3.74 today • $979.80 total`
  3. `Credit: $420.20 available`
- Enhanced `api.ts` to always fetch account-level credits from `/credits`.
- All 20 unit tests passing, strict `tsc` passing with 0 errors.

## Recent Changes
- Updated `tui.tsx` to render solely in `sidebar.content`.
- Implemented `repositionAboveContext` to ensure the widget sits stably below Workspaces and above Context.
- Updated `index.ts` to reflect the clean summary format.
- Updated `README.md` documentation.

## Next Steps
- Commit, push, create PR, merge, remove worktree, and restart OpenCode service.
