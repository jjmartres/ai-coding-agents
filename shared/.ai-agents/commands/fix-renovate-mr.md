---
description: Fix renovate issues
#agent: javascript-pro
---

1. Using `!git swicth` switch to the default branch that can be `master` or `main`
2. Run `!git pull`
3. Run `!git switch renovate/all`
4. Rebase `renovate/all` from default branch (`master` or `main`) if needed
5. Run `!npx --yes google-artifactregistry-auth`
6. Run `!npm ci --frozen-lockfile`
7. Run `!npm audit` and fix all issues
8. Run `!npm run lint` and fix all issues
9. Run `!npm run test` and fix all issues
10. Commit change using `/commit` command
11. Push commit using `!git push --push-option=merge_request.merge_when_pipeline_succeeds`
