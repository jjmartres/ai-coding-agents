# Progress: OpenRouter Credits Extension

## Status: Complete

## What Works
- [x] Create plugin directory `opencode/.config/opencode/plugins/openrouter-credits/`
- [x] Implement `types.ts` for OpenRouter API and plugin state
- [x] Implement `key-resolver.ts` for discovering OpenRouter API key across sources (options, env vars, `auth.json`)
- [x] Implement `format.ts` for currencies, percentages, and badge text
- [x] Implement `api.ts` for fetching, caching, and evaluating OpenRouter credit/limit data
- [x] Implement `index.ts` (Server Plugin: tool `openrouter_credits`, command `/openrouter-credits`, background sync)
- [x] Implement `tui.tsx` (TUI Plugin: right sidebar widget above Context, badge in `prompt.footer`, `/openrouter` command & interactive dialog, toasts)
- [x] Implement unit tests (`test/openrouter.test.ts` - 20 passing tests)
- [x] TypeScript compilation (`tsconfig.json` - 0 errors)
- [x] Configure `package.json`, `package-lock.json`, and `README.md`
- [x] Register plugin in `opencode/.config/opencode/cli.json` and `opencode.jsonc`
- [x] Verify git status and pre-commit checks

## Known Issues
- None.
