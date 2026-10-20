# Active Context: OpenRouter Credits Extension

## Current Work Focus
- Streamlined `openrouter-credits` extension to be a non-interactive, pure display widget in the right sidebar.
- Removed interactive click dialogs and all `/` slash commands.
- Implemented real-time event-driven consumption refresh (`session.step.ended`, `session.execution.succeeded`, `session.usage.updated`, `session.idle`) with 15s background poll.
- All 20 unit tests and strict TypeScript typechecking passing with 0 errors.

## Recent Changes
- Removed interactive dialog and click handlers from `tui.tsx`.
- Removed slash command from `tui.tsx` and `index.ts`.
- Implemented `triggerLiveConsumptionRefresh()` with immediate cache invalidation and rapid background sync.
- Updated `README.md`.

## Next Steps
- Commit, push, create PR, merge, clean up worktree, and restart OpenCode service.
