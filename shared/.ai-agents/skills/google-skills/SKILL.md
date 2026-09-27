---
name: google-skills
description: Finds and loads the right official Google Cloud skill (GKE, Vertex AI, BigQuery, Cloud Run, Cloud SQL, Cloud Build, Cloud Monitoring, Cloud Logging, IAM, networking, Cloud Storage, Filestore, SLO alerting, Well-Architected Framework, etc.) from a local, pinned catalog. Use at the start of any task that touches a Google Cloud product.
---

# Google Cloud skills (local catalog)

The catalog is a local, pinned copy: `/Users/jjmartres/Repositories/perso/ai-coding-agents/generated/google-skills-index.local.json`.
Every `entrypoint` in it is a local file path.

1. Filter the catalog by keyword. Never read it in full:
   `jq -r '.skills[] | select((.name+" "+.description)|test("KEYWORD1|KEYWORD2";"i")) | "\(.name)\t\(.entrypoint)"' /Users/jjmartres/Repositories/perso/ai-coding-agents/generated/google-skills-index.local.json`
2. Read the matching descriptions as routing criteria. Shortlist at most 3
   skills; prefer the most specific.
3. Read the shortlisted SKILL.md files from their local `entrypoint` path and
   follow them.
4. Never fetch anything from the internet for this catalog. If no skill
   matches, say so in one line and continue without one. Never invent a skill.
5. If the index file is missing, tell the user to run
   `/Users/jjmartres/Repositories/perso/ai-coding-agents/scripts/google-skills-gen-index.fish`, then continue without it.
6. Project conventions (AGENTS.md) take precedence over generic skill guidance.
7. If a specific Google skill is already loaded and covers the task, use it
   directly.
