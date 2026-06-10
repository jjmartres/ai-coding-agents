# Commands

[← Back to README](../README.md)

Commands are slash-invokable workflows stored in `shared/.ai-agents/commands/`. Each file defines a focused automation that the AI executes step by step. Invoke them with `/command-name` followed by optional arguments (`$ARGUMENTS`).

---

## `/astro-dso-doc`

Generate a complete PixInsight project documentation page for a deep-sky object (DSO) astrophotography session.

- Delegates entirely to the `astro-dso-doc` skill, which produces an HTML documentation page, a processing checklist, an AstroBin post JSON, a PixInsight process icon set (XPSM), and a ready-to-paste PixInsight project description.
- Uses `google-vertex/gemini-3.1-pro-preview` by default (set via `model:` frontmatter).

**Example:**

```
/astro-dso-doc NGC 1499
```

---

## `/commit`

Create well-formatted commits with conventional commit messages and emoji.

- Runs `pre-commit run -a` to validate the working tree before committing.
- Stages all unstaged changes with `git add .` if nothing is staged yet; otherwise commits only the already-staged files.
- Analyzes `git diff --cached` to select the correct Conventional Commits type and a matching emoji (✨ `feat`, 🐛 `fix`, 📝 `docs`, ♻️ `refactor`, ⚡️ `perf`, ✅ `test`, 🔧 `chore`, etc.).
- Generates a commit message in imperative mood, under 72 characters, presents it for confirmation, then commits and pushes automatically.

**Example:**

```
/commit
```

---

## `/commit-and-create-mr`

Commit changes and open a GitLab merge request in one step.

- Runs `/commit` to create a well-formatted commit.
- Creates a merge request using the `glab` CLI with a detailed description.
- Assigns the MR to the current user and opens it in the browser.

**Example:**

```
/commit-and-create-mr
```

---

## `/compose-email`

Draft a professional email using the What-Why-How framework.

- Gathers context about the recipient type (technical peer, non-technical stakeholder, leadership) and email purpose if `$ARGUMENTS` is empty.
- Structures the body with **What** (key message), **Why** (context), and **How** (call to action), calibrating formality and jargon level to the audience.
- Generates a complete draft with a specific subject line and a clear single call-to-action.
- Offers tone, length, and format refinements after the initial draft.

**Example:**

```
/compose-email Need to ask my team lead for a one-week deadline extension on the API migration
```

---

## `/datadog`

Quick reference for Datadog CLI commands.

- Provides ready-to-run command templates for log search, aggregation, live tail, trace correlation, context windows, error summaries, log patterns, period comparison, parallel multi-queries, service discovery, and metrics queries.
- Includes the full query syntax reference (AND, OR, NOT, wildcards, numeric ranges), common log attribute names, time format options, and global flags (`--pretty`, `--output`, `--site`).
- Demonstrates complete incident-triage and real-time-monitoring workflows.

**Example:**

```
/datadog
```

---

## `/documentation`

Review and update documentation to match the current implementation.

- Reviews existing documentation for accuracy, clarity, and completeness.
- Fixes outdated examples or incorrect information.
- Ensures the documentation reflects the current code implementation.

**Example:**

```
/documentation
```

---

## `/fix-renovate-mr`

Fix Renovate dependency-update merge requests end to end.

- Switches to the default branch (`main` or `master`) and pulls the latest changes.
- Switches to the `renovate/all` branch and rebases from the default branch if needed.
- Runs `npx google-artifactregistry-auth`, then `npm ci --frozen-lockfile`.
- Runs `npm audit`, `npm run lint`, and `npm run test`, fixing all issues found.
- Commits the fixes with `/commit` and pushes with `--push-option=merge_request.merge_when_pipeline_succeeds`.

**Example:**

```
/fix-renovate-mr
```

---

## `/memory-bank`

Manage the project memory bank stored in `.ai-agents/memory-bank/`.

- Creates the `.ai-agents/memory-bank/` directory structure if it does not exist.
- If a legacy `.opencode/memory-bank/` directory is found, migrates it to `.ai-agents/memory-bank/` automatically.
- Updates all memory bank files to reflect the current project state (see [RULES.md](RULES.md) for the full memory bank rule).

**Example:**

```
/memory-bank
```

---

## `/next-sprint-design`

Generate a sprint kickoff Slack message from Jira sprint stories.

- Fetches the next sprint's stories using `jira sprint list --next --table --plain`.
- Groups stories by epic into 2–4 thematic sections with appropriate emojis.
- Explains business impact in plain language, keeping each section to 3–5 bullet points.
- Outputs a ready-to-post Slack message following the standard sprint kickoff template.

**Example:**

```
/next-sprint-design
```

---

## `/prepare-dataset`

Analyse a raw data file and generate a Python dataset preparation script for fine-tuning with Unsloth.

- Reads `$FILE` (CSV, JSON, JSONL, TSV, or Parquet), detects its format, and profiles each column (type, missing-value rate, sample rows).
- Proposes a Q&A generation strategy based on `$GOAL`, estimating final dataset size and suggesting augmentation if fewer than 100 examples would result. Waits for user validation before proceeding.
- Generates `scripts/dataset/<n>.py` inheriting from `BaseDatasetPreparer`, with `generate_examples()` (5–30 Q&A pairs per row, multi-phrasing), `filter_rows()`, and a full `argparse`-based `main()`.
- Adds `[project.scripts]` and `[tool.uv.scripts]` entries to `pyproject.toml`, then runs the script to verify correctness.

**Example:**

```
/prepare-dataset data/products.csv "answer questions about our product catalogue"
```

---

## `/review`

Review the ten most recent git commits and suggest improvements.

- Runs `git log --oneline -10` to display recent commit history.
- Reviews the changes introduced by those commits.
- Suggests code quality, architecture, or style improvements based on the diff.

**Example:**

```
/review
```

---

## `/speckit.model-selector`

Interactively configure the optimal OpenRouter model for each of the 7 SpecKit workflow steps.

- Verifies that SpecKit command files are present under `.opencode/commands/`; aborts with a setup message if they are not found.
- Fetches the official SpecKit README from GitHub to confirm the canonical 7-step workflow (`constitution` → `specify` → `clarify` → `plan` → validate → `tasks` → `implement`).
- Queries the live OpenRouter model catalog using `OPENROUTER_API_KEY`, filters out free/extended variants, and builds a shortlist of frontier and mid-tier models with context window ≥ 32 K tokens.
- For each step, presents a ranked **Best / Balanced / Budget / Other** menu with model ID, context size, and price per million tokens (input / output), and waits for the user's choice.
- Writes the chosen `model:` field into the YAML frontmatter of each `.opencode/commands/speckit.*.md` file; replaces any existing value. Step 5 (plan validation) has no dedicated command file and is skipped.
- Displays a final summary table confirming the model assigned to every step.

**Example:**

```
/speckit.model-selector
```

---

## `/speckit.polish`

Full quality-gate workflow: tests, code documentation, project documentation, changelog, AGENTS.md, knowledge graph, memory bank, and merge request.

- Reads `.specify/memory/constitution.md` to apply project-specific overrides.
- Runs `make test-in-ci` with coverage and surfaces all failures.
- Audits code documentation and applies `document-code` skill to fill gaps.
- Regenerates project documentation with `document-project` and `mermaid-diagrams` skills.
- Updates `CHANGELOG.md` under `[Unreleased]` using Keep a Changelog format.
- Updates `AGENTS.md` to reflect any new agents, skills, or tools introduced.
- Updates the Graphify knowledge graph if `graphify-out/` exists.
- Syncs the memory bank via `/memory-bank`.
- Commits with a conventional commit message and opens a GitLab merge request.
- Uses `openrouter/claude-opus-4.6` by default (set via `model:` frontmatter).

**Example:**

```
/speckit.polish
```

---

## `/test`

Run the full test suite with coverage and diagnose failures.

- Runs the project's full test suite with a coverage report.
- Surfaces all failing tests clearly.
- Suggests targeted fixes for each failure.

**Example:**

```
/test
```
