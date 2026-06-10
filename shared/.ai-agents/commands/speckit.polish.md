---
description: Polish and complete speckit workflow — quality gate, docs, changelog, MR
model: openrouter/openai/gpt-5.3-codex
---

Strictly follow the project constitution.

Apply the following skills where relevant:

- document-code
- document-project
- glab
- humanizer
- karpathy-guidelines
- mermaid-diagrams
- writing-clearly-and-concisely

## Steps

### 1. Load project context

- Read `.specify/memory/constitution.md` if it exists
- Let the constitution override any defaults below

### 2. @debugger run the test suite

- Execute `make test-in-ci` with coverage report
- Surface all failures with file, line, and error message
- For each failure: diagnose root cause and propose a concrete fix
- Do NOT proceed to step 3 until the human confirms or fixes are applied
- Report coverage percentage and any skipped tests

### 3. @code-reviewer audit code documentation

- Identify undocumented or poorly documented public interfaces, functions, and modules
- Apply `document-code` skill to fill gaps
- Flag anything that requires human input (ambiguous intent, missing domain context)

### 4. @documentation-engineer regenerate project documentation

- Apply `document-project` skill to update or generate the full documentation structure
- Refresh architecture diagrams with `mermaid-diagrams` skill where relevant
- Ensure prose is clear and concise per `writing-clearly-and-concisely` skill

### 5. @documentation-engineer update CHANGELOG.md

- Follow Keep a Changelog format
- Add an entry under `[Unreleased]` summarising changes since the last release
- Group by: Added / Changed / Fixed / Removed

### 6. @ai-engineer update AGENTS.md

- Reflect any new agents, skills, tools, or behavioural constraints introduced in this iteration

### 7. Update Graphify knowledge graph (if applicable)

- Check whether a `graphify-out/` directory exists at the project root
- If it exists, run: `graphify update . --out ./graphify-out`
- If not, skip silently

### 8. Sync memory bank

- Run `/memory-bank` to persist updated project state

### 9. Commit

- Run `/commit` with a conventional commit message scoped to this workflow

### 10. Use the glab skill to create and configure the merge request

- Create the MR targeting the appropriate base branch
- Write a detailed MR description covering: motivation, changes, test results, documentation updates
- Assign the MR to me
- Assign CODEOWNERS as reviewers
- Open the MR in the browser
