---
description: Run tests with coverage
---

Detect and run the appropriate test command:

1. If a `Makefile` exists at the project root:
   - Run `make test-in-ci` if the target exists
   - Otherwise fall back to `make test`
2. If no `Makefile` exists, run `pytest --coverage` (or the project's native test runner if identifiable from config files)

Always show the full coverage report.

For every failing test:

- Show file, line, and error message
- Diagnose the root cause
- Propose a concrete fix
