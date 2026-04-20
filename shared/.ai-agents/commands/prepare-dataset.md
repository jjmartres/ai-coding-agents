---
description: Analyse a raw data file (CSV, JSON, JSONL, TSV, Parquet) and generate a complete Python script `scripts/dataset/<n>.py` that inherits from `BaseDatasetPreparer` and transforms the file into a JSONL dataset ready for fine-tuning with Unsloth.
#agent: mlops-engineer
---

## Arguments

- `$FILE` : path to the source file (e.g. `data/products.csv`, `data/clients.json`)
- `$GOAL` : one sentence describing what the model should be able to do after fine-tuning
  (e.g. "answer questions about our product catalogue in English")

## Steps

### 1. Analyse the source file

Start by reading and analysing `$FILE`:

- Detect the format (CSV, JSON, JSONL, TSV, Parquet) and the delimiter if CSV
- Identify all available fields/columns and their types (string, number, bool...)
- Count the total number of rows
- Measure the missing value rate per field
- Display 3 sample rows to understand the structure
- Identify rich fields (few missing values, varied content)
  vs. sparse fields (>50% empty, constant values)

### 2. Propose a strategy

Based on `$GOAL` and the analysis, propose:

- Which fields to use and why (exclude fields that are too empty or irrelevant)
- How many Q&A pairs per source row can be generated (~5 to 30 depending on richness)
- Estimated final dataset size (rows x average examples)
- If the dataset is too small (<100 final examples): suggest an augmentation strategy
  (phrasing variants, synthetic data)
- Recommended filter (e.g. "keep only rows where field X is filled")

**Wait for validation before generating the script.**

### 3. Generate `scripts/dataset/<n>.py`

Generate a Python script that **inherits from `BaseDatasetPreparer`**
(see `scripts/dataset/base.py`), with the following structure:

**Header and imports**

```python
"""
scripts/dataset/<n>.py
──────────────────────────
Short description of what this script does.
Source : $FILE
Goal   : $GOAL

Usage :
    uv run sg-<n> --input data/<n>.csv --stats
    uv run <n>-quality
"""
```

**Lookup tables** (if codes or abbreviations are present in the data)
Generate Python dicts to translate them into human-readable text (e.g. country codes -> names).

**Class `<n>Preparer(BaseDatasetPreparer)`** with two methods:

`generate_examples(self, row: dict) -> list[dict]`

- Takes one source row as input
- Returns a list of dicts `{"instruction": str, "input": str, "output": str}`
- Generates between 5 and 30 Q&A pairs per row depending on data richness
- Covers each important fact under 2-3 different phrasings
  (e.g. "What is X of Y?" / "Give me X for Y." / "What is the X value of Y?")
- Includes at least one "full record" question that aggregates all fields
- Handles missing fields gracefully (`if field:` before using)
- All questions and answers match the language implied by `$GOAL`

`filter_rows(self, rows: list[dict], mode: str) -> list[dict]`

- mode `quality`: only rows with essential fields filled (determined by the analysis)
- mode `full`: all rows

**`main()` function** with argparse:

```
--input         path to the source file
--output        output prefix without extension (default: dataset/<n>)
--mode          full | quality  (default: quality)
--train-ratio   float 0.0-1.0  (default: 0.9)
--seed          int             (default: 42)
--stats         flag -- display random sample examples
```

The `main()` function instantiates the preparer and calls `self.build(...)`.
Do **not** re-implement the build pipeline -- it is provided by `BaseDatasetPreparer`.

### 4. Update pyproject.toml

After creating the script, automatically add two entries to `pyproject.toml`:

In `[project.scripts]`:

```toml
sg-<n> = "scripts.dataset.<n>:main"
```

In `[tool.uv.scripts]`:

```toml
<n>-quality  = "python scripts/dataset/<n>.py --mode quality --stats"
<n>-full     = "python scripts/dataset/<n>.py --mode full --stats"
<n>-validate = "python scripts/dataset/validate.py dataset/<n>_train.jsonl"
```

### 5. Final validation

- Run `uv run python scripts/dataset/<n>.py --mode quality --stats`
  to verify the script runs without errors
- Display the generation summary (number of examples, output files)
- Display 3 generated Q&A examples for visual validation
- Confirm that `dataset/<n>_train.jsonl` and `dataset/<n>_test.jsonl` exist

## Quality rules for the generated script

- `generate_examples` and `filter_rows` must be **pure functions** -- no I/O, no side effects
- Type hints on all public methods and functions
- Docstring on every method
- Missing field handling without crash (`row.get("field", "").strip()`)
- Fixed `random.seed` for reproducibility (handled by `BaseDatasetPreparer.build`)
- snake_case naming, compliant with the project's Ruff config
- Compatible with both `uv run` and direct `python` invocation

## Expected JSONL output format

Each line of the produced file must be:

```json
{
  "instruction": "Natural language question?",
  "input": "",
  "output": "Factual answer."
}
```

The `input` field is always an empty string for Q&A datasets.
The `instruction` field must never exceed 200 characters.
The `output` field may be multi-line for full-record questions.

## Usage examples

```
/prepare-dataset data/products.csv "answer questions about our product catalogue"
/prepare-dataset data/clients.json "classify clients by B2B segment and answer CRM questions"
/prepare-dataset data/transactions.csv "detect suspicious transactions and explain why"
/prepare-dataset data/airports.csv "answer questions about airports worldwide in French"
```
