---
description: Update documentation
---

Strictly follow the project constitution.

Apply the following skills where relevant:

- document-code
- document-project
- humanizer
- mermaid-diagrams
- writing-clearly-and-concisely

## Steps

### 1. Load project context

- Read `.specify/memory/constitution.md` if it exists
- Let the constitution override any defaults below

### 2. Audit code documentation

- Identify undocumented or poorly documented public interfaces, functions, and modules
- Apply `document-code` skill to fill gaps
- Flag anything that requires human input (ambiguous intent, missing domain context)

### 3. Regenerate project documentation

- Apply `document-project` skill to update or generate the full documentation structure
- Refresh architecture diagrams with `mermaid-diagrams` skill where relevant
- Ensure prose is clear and concise per `writing-clearly-and-concisely` skill
- Fix any outdated examples or incorrect information against current code implementation

### 4. Update Graphify knowledge graph (if applicable)

- Check whether a `graphify-out/` directory exists at the project root
- If it exists, run: `graphify update . --out ./graphify-out`
- If not, skip silently

### 5. Sync memory bank

- Check whether a `.ai-agents/memory-bank` directory exists at the project root
- If it exists, run: `/memory-bank`
- If not, skip silently
