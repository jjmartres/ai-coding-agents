---
description: Select the best OpenRouter model for each SpecKit workflow step and write model metadata into each command file
---

# SpecKit Model Selector

You are an AI agent that helps configure SpecKit workflow command with the optimal AI model for each step, sourced from the live OpenRouter model catalog.

Work through the steps below in order. Do **not** skip a step or proceed until the previous one is complete.

## Step 1 — Verify SpecKit is installed locally

Check for the presence of SpecKit command files under `.opencode/command/` in the current working directory.

Run:

```bash
ls .opencode/command/speckit.* 2>/dev/null || echo "NOT_FOUND"
```

- If the output is `NOT_FOUND` or the directory does not exist, **stop immediately** and tell the user:
  > SpecKit command are not present under `.opencode/command/`. Please run `specify init . --integration opencode` first, then re-run this command.
- If at least one `speckit.*` file is found, list the discovered files and proceed to Step 2.

## Step 2 — Read the SpecKit detailed workflow

Fetch the official SpecKit README from:

```
https://github.com/github/spec-kit#-detailed-process
```

Extract and summarise the **7 core workflow steps** with their associated SpecKit command:

| #   | Command                           | Purpose                                                       |
| --- | --------------------------------- | ------------------------------------------------------------- |
| 1   | `/speckit.constitution`           | Establish project governing principles                        |
| 2   | `/speckit.specify`                | Create functional specifications (user stories, requirements) |
| 3   | `/speckit.clarify`                | Clarify gaps before planning (structured Q&A)                 |
| 4   | `/speckit.plan`                   | Generate technical implementation plan                        |
| 5   | _(plan validation — free prompt)_ | Audit plan for missing pieces and over-engineering            |
| 6   | `/speckit.tasks`                  | Break plan into actionable, ordered, dependency-aware tasks   |
| 7   | `/speckit.implement`              | Execute tasks and implement the feature                       |

If the page cannot be fetched, use the canonical step list above and continue.

## Step 3 — Query the OpenRouter model catalog

Call the OpenRouter models endpoint using the `OPENROUTER_API_KEY` environment variable:

```bash
curl -s "https://openrouter.ai/api/v1/models" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json"
```

From the response, build a shortlist of **current frontier and mid-tier models** by filtering on:

- Models **not** suffixed with `:free` or `:extended`
- Prompt price ≥ $0.10 / M tokens
- Context window ≥ 32 K tokens
- Exclude image-only or audio-only models

For **each of the 7 workflow steps**, evaluate the shortlisted models against the step's dominant cognitive demands:

| Step          | Dominant demands                                                        |
| ------------- | ----------------------------------------------------------------------- |
| Constitution  | Nuanced prose, governance writing, structured Markdown                  |
| Specify       | Long-context comprehension, user story authoring, structured output     |
| Clarify       | Gap detection, logical coverage analysis, adversarial questioning       |
| Plan          | Deep technical architecture, framework knowledge, multi-file design     |
| Validate plan | Audit mindset, contradiction detection, constraint checking             |
| Tasks         | Structured decomposition, dependency graphs, exact file-path generation |
| Implement     | Agentic code execution, multi-file engineering, long-horizon autonomy   |

Produce a **ranked list of 3 options** per step:

- **Best** — highest capability match regardless of cost
- **Balanced** — strong capability at mid-range cost
- **Budget** — acceptable quality at the lowest viable cost
- **Other** — free-text entry (user supplies their own model ID)

Present the table clearly, showing for each candidate: `model_id`, display name, context window, and price per million tokens (input / output).

## Step 4 — Prompt the user to choose a model for each step

For each of the 7 steps, display an interactive prompt in this exact format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step N — <Step Name> (<command name>)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [1] Best     — <model_id>  (<context>k ctx | $X.XX / $Y.YY per M)
  [2] Balanced — <model_id>  (<context>k ctx | $X.XX / $Y.YY per M)
  [3] Budget   — <model_id>  (<context>k ctx | $X.XX / $Y.YY per M)
  [4] Other    — Enter a custom OpenRouter model ID

Your choice for Step N [1/2/3/4]:
```

- Wait for the user's answer before moving to the next step.
- If the user chooses **[4] Other**, prompt: `Enter the model ID (e.g. openai/gpt-4o):` and use the supplied value.
- Validate that the chosen model ID exists in the catalog (or accept it as-is for option 4).
- Confirm the selection: `✓ Step N will use: <model_id>`

Repeat for all 7 steps, then display a summary confirmation table before proceeding.

## Step 5 — Write model metadata into each SpecKit command file

For each step that maps to a real command file under `.opencode/command/`:

1. Locate the file: `.opencode/command/<speckit-command>.md`
   (e.g. `.opencode/command/speckit.constitution.md`)
2. Read the file.
3. Find the frontmatter block that begins with `---` and ends with `---`.
4. Insert a `model:` field immediately after the `description:` line, on its own line, using this exact format:

   ```yaml
   model: openrouter/provider/model-id
   ```

   Example result:

   ```yaml
   ---
   description: Create or update project governing principles and development guidelines
   model: openrouter/anthropic/claude-opus-4.8
   ---
   ```

5. If a `model:` field already exists, **replace** its value with the new selection.
6. Write the updated file back to disk.
7. Confirm: `✓ Updated .opencode/command/<filename>.md → model: <model_id>`

For **Step 5 (plan validation)**, which has no dedicated command file, skip the write step and note:

> Step 5 (plan validation) is a free-form prompt with no dedicated command file — no file update needed.

## Step 6 — Summary report

After all files are updated, display a final summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SpecKit model configuration complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Step 1  /speckit.constitution  → <model_id>  ✓
  Step 2  /speckit.specify       → <model_id>  ✓
  Step 3  /speckit.clarify       → <model_id>  ✓
  Step 4  /speckit.plan          → <model_id>  ✓
  Step 5  (plan validation)      → no file     –
  Step 6  /speckit.tasks         → <model_id>  ✓
  Step 7  /speckit.implement     → <model_id>  ✓

All command files have been updated. Your SpecKit workflow
is now configured to use the chosen models per step.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Error handling

| Situation                                         | Action                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY` not set or request fails     | Abort with: _"OPENROUTER_API_KEY is not set or the API call failed. Export the variable and retry."_ |
| SpecKit command not found in `.opencode/command/` | Abort with the message from Step 1                                                                   |
| A command file exists but has no frontmatter      | Prepend a minimal frontmatter block (`---\ndescription: \nmodel: <id>\n---\n`) before the file body  |
| User selects [4] and provides an unknown model ID | Warn the user but still write the value as entered                                                   |
