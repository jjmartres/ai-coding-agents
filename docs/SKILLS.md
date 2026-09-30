# Skills

[← Back to README](../README.md)

Skills are reusable instruction packs that inject domain-specific guidance into any agent session. They live under `shared/.ai-agents/skills/<skill-name>/SKILL.md` and are activated by the host application when a task matches the skill's trigger conditions.

## Quick reference

| Skill | Description | Compatibility |
|-------|-------------|---------------|
| [asdf](#asdf) | Universal version manager — installs, configures, and troubleshoots asdf and `.tool-versions` files across all shells and runtimes. | opencode, pi-mono |
| [astro-dso-doc](#astro-dso-doc) | Bootstrap DSO astrophotography projects and generate PixInsight docs, checklists, AstroBin exports, and process icons. | opencode, pi-mono |
| [content-research-writer](#content-research-writer) | Collaborative writing assistant that conducts research, adds citations, refines outlines, and gives section-by-section feedback. | opencode, pi-mono |
| [corp-branding](#corp-branding) | Apply discrete Fintecture corporate branding (logo, navy/mint palette, confidentiality tagline, footer mark) to HTML documents. | opencode, pi-mono |
| [corp-operations-infrastructure](#corp-operations-infrastructure) | Reference for Fintecture's internal Operations & Infrastructure policies (change management, vulnerability/patch SLAs, logs, asset lifecycle). | opencode, pi-mono |
| [datadog](#datadog) | Search Datadog logs, query metrics, tail logs in real-time, trace distributed requests, and investigate errors. | opencode, pi-mono |
| [document-code](#document-code) | Apply Google Style documentation standards to Python, Go, TypeScript, and Terraform code. | opencode, pi-mono |
| [document-project](#document-project) | Generate comprehensive project documentation structures: README, ARCHITECTURE, USER_GUIDE, DEVELOPER_GUIDE, and CONTRIBUTING. | opencode, pi-mono |
| [file-organizer](#file-organizer) | Intelligently organizes files and folders by understanding context, finding duplicates, and suggesting better structures. | opencode, pi-mono |
| [gcloud](#gcloud) | Safety-critical validation, guardrails, and data reduction for `gcloud` CLI operations across GCP services. | opencode, pi-mono |
| [glab](#glab) | Expert guidance for using the GitLab CLI (`glab`) to manage issues, MRs, pipelines, and repositories. | opencode, pi-mono |
| [google-skills](#google-skills) | On-demand router loading official Google Cloud skills (125+ services) from a local pinned catalog without context bloat. | opencode, pi-mono |
| [graphify](#graphify) | Turn any corpus (code, docs, papers) into a clustered knowledge graph with interactive HTML, GraphRAG JSON, and audit reports. | opencode, pi-mono |
| [herdr](#herdr) | Control Herdr terminal multiplexer workspaces, tabs, panes, and agent sessions (installed on-demand via `make install`). | opencode, pi-mono |
| [httpie](#httpie) | Make HTTP requests, test APIs, call REST endpoints, and debug web services using the HTTPie CLI (`http` command). | opencode, pi-mono |
| [humanizer](#humanizer) | Remove signs of AI-generated writing from text to make it sound natural and human-written. | opencode, pi-mono |
| [jira](#jira) | Create, view, update, and manage Jira issues, sprints, and backlogs. | opencode, pi-mono |
| [karpathy-guidelines](#karpathy-guidelines) | Behavioral guidelines to reduce common LLM coding mistakes: avoid overcomplication, make surgical changes, surface assumptions. | opencode, pi-mono |
| [marp-slide](#marp-slide) | Create professional Marp presentation slides with 7 built-in themes. | opencode, pi-mono |
| [mcp-builder](#mcp-builder) | Guide for creating high-quality MCP (Model Context Protocol) servers in Python or Node/TypeScript. | opencode, pi-mono |
| [meeting-insights-analyzer](#meeting-insights-analyzer) | Analyze meeting transcripts to uncover behavioral patterns, communication insights, and actionable feedback. | opencode, pi-mono |
| [mermaid-diagrams](#mermaid-diagrams) | Comprehensive guide for creating software diagrams using Mermaid syntax. | opencode, pi-mono |
| [nibbler](#nibbler) | Interact with Fintecture's GCP companion on Cloud Run for alert investigation, JIT PAM access, runbooks, and IaC validation. | opencode, pi-mono |
| [reachy-mini-sdk](#reachy-mini-sdk) | Programming guide for the Reachy Mini robot using the Python SDK and REST API. | opencode, pi-mono |
| [work-on-ticket](#work-on-ticket) | Fetch Jira ticket details, create a named branch, and initiate task planning. | opencode, pi-mono |
| [writing-clearly-and-concisely](#writing-clearly-and-concisely) | Apply Strunk's timeless rules for clearer, stronger prose in documentation, commits, and UI text. | opencode, pi-mono |

---

## asdf

**Trigger:** Any mention of asdf, `.tool-versions` files, managing runtime versions, or migrating from nvm/pyenv/rbenv/goenv/tfenv.

Provides a complete reference for installing and configuring the asdf universal version manager. Covers plugin management (`asdf plugin add`), version installation, the `.tool-versions` file format, shell configuration for Bash/Zsh/Fish, shim troubleshooting, and the `.asdfrc` options. Also explains the modern `asdf set` API introduced in v0.15+ and how to onboard an existing project with `asdf install`.

---

## astro-dso-doc

**Trigger:** Astrophotography, bootstrapping DSO project folders, DSO targets (NGC, IC, Messier, Sharpless), PixInsight project documentation, observation reports, AstroBin post exports.

Bootstraps deep-sky object (DSO) astrophotography projects from raw acquisition frames and generates complete deliverables: an interactive HTML documentation page with theme switching, a filter-adapted PixInsight processing checklist, AstroBin upload JSON, PixInsight process icons (XPSM), and project description text.

---

## corp-branding

**Trigger:** "brand this", "add our branding", "make it on-brand", "add Fintecture logo", "apply corporate styling", "make it look official", or when Fintecture brand identity is requested on an HTML deliverable.

Applies discrete Fintecture corporate branding (official SVG logo, navy/mint palette, confidentiality taglines, and footer mark) to HTML documents without disrupting the underlying document design. Bundles an automated Python applicator script and embedded assets.

---

## corp-operations-infrastructure

**Trigger:** Fintecture change management, vulnerability/patch SLAs, CVSS remediation timelines, log retention/immutability rules, IT/ICT asset registers, device lifecycle, or compliance inquiries (DORA, ISO 27001, NIST, GDPR, NIS2).

Bundles Fintecture's complete Operations & Infrastructure policy set sourced from Outline. Serves as the authoritative source for change management workflows, vulnerability procedures, patch SLAs, and IT asset lifecycles during audits or ops tasks.

---

## document-code

**Trigger:** "document this code", "add docstrings", "follow Google Style", reviewing code that needs docstrings or JSDoc.

Enforces Google Style documentation standards across Python (docstrings), Go (package and function comments), TypeScript (JSDoc), and Terraform (variable/output descriptions). Ensures consistent, professional inline documentation for all public APIs, parameters, return values, and raised exceptions.

---

## content-research-writer

**Trigger:** Writing long-form content, blog posts, research articles, or any document that benefits from sourced information and iterative feedback.

Transforms the writing process into a collaborative partnership. The skill conducts web research and adds citations, helps strengthen hooks and outlines, and provides real-time feedback on each section as it is drafted. Supports iterative revision cycles until the final piece meets quality standards.

---

## datadog

**Trigger:** Searching Datadog logs, querying metrics, tailing logs in real-time, tracing distributed requests, investigating errors, comparing time periods.

Provides working command templates for every `datadog` CLI subcommand: `logs search`, `logs agg`, `logs tail`, `logs trace`, `logs context`, `logs patterns`, `logs compare`, `logs multi`, `metrics query`, `errors`, and `services`. Includes query syntax reference, common log attributes, time format options, and complete incident-triage and real-time-monitoring workflow examples.

---

## file-organizer

**Trigger:** Organizing files and folders, finding duplicates, cleaning up a digital workspace, or automating file management tasks.

Understands file context to suggest better directory structures, identify duplicate files, and automate cleanup tasks. Reduces cognitive load from a cluttered file system without moving or deleting anything you did not explicitly approve.

---

## gcloud

**Trigger:** Planning, generating, constructing, proposing, describing, or executing any `gcloud` CLI commands across Google Cloud Platform services.

Direct symlink (`shared/.ai-agents/skills/gcloud` → `../../../vendor/google-skills/skills/cloud/gcloud`) exposing the official Google Cloud `gcloud` safety guardrail skill. Unlike the other ~129 specialized Google Cloud skills that are queried on demand, `gcloud` is directly linked into OpenCode so its safety-critical guardrails are active at all times.

### Safety-critical guardrails & validation

- **Mandatory leaf-level syntax validation**: All static training knowledge of `gcloud` commands, flags, and arguments is treated as potentially stale. Before proposing flags, executing commands, or drafting plans, the agent **must** run `gcloud help <leaf_command>` (e.g. `gcloud help compute instances create`). Validation is strictly non-transitive: parent group help (e.g. `gcloud help compute`) is never sufficient.
- **Mandatory 4-step execution plan**:
  1. **Step 1 — Syntax validation**: Execute `gcloud help <leaf_command>`.
  2. **Step 2 — Parameter verification**: Confirm required and optional flags, and verify whether `--dry-run` or `--validate-only` is supported.
  3. **Step 3 — Dry-run proposal**: Propose a `--dry-run` or `--validate-only` command invocation first if supported.
  4. **Step 4 — Command proposal & authorization**: If a command is on the prohibited/destructive operations list, autonomous execution is strictly forbidden and explicit user authorization is required.
- **Forbidden web search fallback**: The agent is explicitly prohibited from searching the web for `gcloud` syntax. `gcloud help <leaf_command>` is the sole authorized authority.
- **Data reduction**: Enforces context-saving flags (`--format`, `--filter`, `--limit`) to keep CLI outputs compact and prevent context window exhaustion.

---

## glab

**Trigger:** Any interaction with GitLab resources — issues, merge requests, CI/CD pipelines, repositories — from the command line.

Expert guidance for the `glab` CLI. Covers creating and reviewing MRs, managing issues, checking pipeline status, cloning repositories, and performing GitLab operations without leaving the terminal. Includes common patterns for day-to-day GitLab workflows.

---

## google-skills

**Trigger:** Finding and loading official Google Cloud skills (GKE, Vertex AI, BigQuery, Cloud Run, Cloud SQL, Cloud Build, Cloud Monitoring, Cloud Logging, IAM, VPC networking, Cloud Storage, Filestore, SLO alerting, etc.) at the start of any task touching a Google Cloud product.

Implements an **on-demand access architecture** for Google Cloud skills. Instead of exposing all ~129 skills directly inside the Stow packages (which would severely bloat the LLM context window and degrade tool calling), the repository vendors official Google Cloud skills externally and routes them locally on demand.

### Architecture & design

- **Submodule catalog (`vendor/google-skills`)**: Pinned git submodule tracking `github.com/google/skills`. Located under `vendor/` strictly outside Stow packages to prevent context window saturation.
- **Local index (`generated/google-skills-index.local.json`)**: A compact, machine-readable JSON catalog containing skill names, descriptions, and local absolute entrypoints (`SKILL.md`). Generated via `scripts/google-skills-gen-index.fish` (`make gen-google-skills-index`). Ignored by git to prevent machine-specific path contamination.
- **Router skill (`shared/.ai-agents/skills/google-skills/SKILL.md`)**: A lightweight router that prompts the agent to search the local index with `jq` and load only the relevant skills into active context.

### Search and loading instructions

1. **Query by keyword**: The agent filters the catalog on disk using `jq` without reading the full index into context:
   ```bash
   jq -r '.skills[] | select((.name+" "+.description)|test("KEYWORD1|KEYWORD2";"i")) | "\(.name)\t\(.entrypoint)"' generated/google-skills-index.local.json
   ```
2. **Shortlist specific skills**: The agent inspects matched descriptions and shortlists at most **3 skills**, prioritizing the most specific to the current task.
3. **Load from disk**: The agent reads the local `SKILL.md` from the resolved entrypoint path on disk and adopts its domain-specific guidelines.
4. **Offline and deterministic**: All skill resolutions occur locally from disk. Network fetches are prohibited. If no skill matches, the agent proceeds cleanly without hallucinating skills.

### Submodule lifecycle management

- **Regenerate index**: `make gen-google-skills-index` runs `scripts/google-skills-gen-index.fish` to parse frontmatter from `vendor/google-skills/skills/cloud/` and rebuild `generated/google-skills-index.local.json`.
- **Review and update upstream**: `make update-google-skills` runs `scripts/update-google-skills.fish` to fetch upstream changes, display commit logs and diff stats, and prompt for human confirmation before advancing the submodule pin.

---

## graphify

**Trigger:** Turning any folder of files (code, documents, research papers) into a structured, navigable knowledge graph with community detection.

Extracts AST and semantic relationships across code and documentation to produce a persistent graph (`graphify-out/graph.json`), interactive visual HTML (`graph.html`), and an audit report (`GRAPH_REPORT.md`). Supports BFS/DFS graph queries, pathfinding, and serving via stdio MCP.

---

## herdr

**Trigger:** Explicit mentions of Herdr, or requests to use Herdr to inspect or control panes, tabs, workspaces, commands, or neighboring agent sessions. Requires `HERDR_ENV=1`.

Enables AI agents to interact with the Herdr terminal multiplexer. Downloaded automatically during `make install` matching the locally installed `herdr --version`, and deployed to `shared/.ai-agents/skills/herdr/` (git-ignored). Guides the agent on checking `HERDR_ENV`, inspecting session state, managing layout panes and tabs, and coordinating background agent processes.

---

## httpie

**Trigger:** Making HTTP requests, testing APIs, calling REST endpoints, debugging web services, sending JSON/form data, working with auth tokens, uploading files.

Provides complete HTTPie (`http` command) syntax for every HTTP method, authentication scheme (Bearer, Basic, API key), data format (JSON, form, multipart), and output option. Covers session management, header inspection, file downloads, and scripting patterns. Works even when the user just says "call the API" or "hit this endpoint".

---

## humanizer

**Trigger:** Editing or reviewing text to make it sound more natural and human-written, removing AI writing patterns.

Based on Wikipedia's guide to signs of AI writing. Detects and corrects inflated symbolism, promotional language, superficial `-ing` constructions, vague attributions, em-dash overuse, rule-of-three patterns, AI vocabulary words, negative parallelisms, and excessive conjunctive phrases. Returns revised prose that reads as though a human wrote it.

---

## jira

**Trigger:** Jira issue keys (e.g., `PROJ-123`), keywords like "jira", "ticket", "sprint", "backlog", or requests to create/view/update issues.

Manages the full Jira workflow from the command line. Supports creating issues, viewing ticket details, updating fields and status, checking sprint contents, and managing backlogs. Integrates with the `work-on-ticket` skill for branch-based development flows.

---

## marp-slide

**Trigger:** Requests for slide creation, presentations, or Marp documents; "make it look good" on a Marp file.

Creates professional presentation slides using Marp Markdown with seven built-in themes: `default`, `minimal`, `colorful`, `dark`, `gradient`, `tech`, and `business`. Supports custom themes, image layouts, speaker notes, and automatic quality improvements when the user asks for visual polish.

---

## mcp-builder

**Trigger:** Building MCP servers, integrating external APIs into AI systems via the Model Context Protocol.

Step-by-step guide for creating high-quality MCP servers using Python (FastMCP) or Node/TypeScript (MCP SDK). Covers tool design, resource definitions, error handling, authentication patterns, and testing. Emphasises well-named tools with clear descriptions so LLMs can select and invoke them reliably.

---

## meeting-insights-analyzer

**Trigger:** Analyzing meeting transcripts or recordings for communication patterns and coaching feedback.

Processes meeting transcripts to surface behavioral patterns: conflict avoidance, filler word frequency, conversational dominance, missed listening opportunities, and more. Produces actionable coaching feedback for professionals who want to improve their communication and leadership presence.

---

## mermaid-diagrams

**Trigger:** "diagram", "visualize", "model", "map out", "show the flow", or explaining system architecture, database design, or code structure.

Comprehensive reference for Mermaid diagram syntax covering class diagrams, sequence diagrams, flowcharts, entity-relationship diagrams, C4 architecture diagrams, state diagrams, git graphs, pie charts, and Gantt charts. Includes syntax rules, layout tips, and rendering guidance for embedding diagrams in Markdown documentation.

---

## document-project

**Trigger:** "document a project", requests for standard documentation files, or setting up docs for a new repository.

Generates a complete, professional documentation structure tailored to Python or Go projects in OpenSource or internal contexts. Produces five files: `README.md`, `ARCHITECTURE.md`, `USER_GUIDE.md`, `DEVELOPER_GUIDE.md`, and `CONTRIBUTING.md`. Each file follows consistent structure, tone, and formatting conventions.

---

## karpathy-guidelines

**Trigger:** Writing, reviewing, or refactoring code; any task where precision and minimal-change discipline matter.

Provides behavioral guidelines derived from Andrej Karpathy's observations on common LLM coding mistakes. Instructs the agent to avoid overcomplication, make surgical targeted changes, surface assumptions explicitly, and define verifiable success criteria before acting. Reduces hallucinated complexity and unnecessary rewrites.

---

## nibbler

**Trigger:** Fintecture GCP infrastructure operations, alert investigation, past incident memory retrieval, runbooks, real-time GCP service health, JIT PAM access, and IaC/Helm validation.

Integrates with Fintecture's operational GCP companion running on Cloud Run via the `nibbler` MCP server. Enables automated alert triage, runbook fetching, heartbeat checks, and infrastructure compliance auditing.

---

## reachy-mini-sdk

**Trigger:** Programming Reachy Mini robots, controlling head/antennas/body movements, accessing sensors, recording motions, or building AI applications for the robot.

Covers the Python SDK v1.2.6 and REST API for the Reachy Mini robot. Includes SDK patterns, coordinate systems, interpolation methods, app management, and OpenAPI client generation. Useful for robotics demos and Hugging Face deployments.

---

## work-on-ticket

**Trigger:** "work on [TICKET_ID]" or similar phrases where the user wants to start implementing a Jira ticket.

Fetches the specified Jira ticket, extracts acceptance criteria and context, creates an appropriately named Git branch, and initiates the task planning workflow. Acts as the entry point for ticket-driven development, bridging project management and version control.

---

## writing-clearly-and-concisely

**Trigger:** Writing prose that humans will read — documentation, commit messages, error messages, explanations, reports, or UI text.

Applies the timeless rules from Strunk and White's *The Elements of Style*: prefer the active voice, omit needless words, use definite language, keep related words together, and place the emphatic word at the end. Produces tighter, stronger writing by eliminating padding, passive constructions, and vague qualifiers.
