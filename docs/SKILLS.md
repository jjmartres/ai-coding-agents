# Skills

[← Back to README](../README.md)

Skills are reusable instruction packs that inject domain-specific guidance into any agent session. They live under `shared/.ai-agents/skills/<skill-name>/SKILL.md` and are activated by the host application when a task matches the skill's trigger conditions.

## Quick reference

| Skill | Description | Compatibility |
|-------|-------------|---------------|
| [asdf](#asdf) | Universal version manager — installs, configures, and troubleshoots asdf and `.tool-versions` files across all shells and runtimes. | opencode |
| [code-docs](#code-docs) | Apply Google Style documentation standards to Python, Go, TypeScript, and Terraform code. | opencode |
| [content-research-writer](#content-research-writer) | Collaborative writing assistant that conducts research, adds citations, refines outlines, and gives section-by-section feedback. | opencode |
| [datadog](#datadog) | Search Datadog logs, query metrics, tail logs in real-time, trace distributed requests, and investigate errors. | opencode |
| [file-organizer](#file-organizer) | Intelligently organizes files and folders by understanding context, finding duplicates, and suggesting better structures. | opencode |
| [glab](#glab) | Expert guidance for using the GitLab CLI (`glab`) to manage issues, MRs, pipelines, and repositories. | opencode |
| [httpie](#httpie) | Make HTTP requests, test APIs, call REST endpoints, and debug web services using the HTTPie CLI (`http` command). | opencode |
| [humanizer](#humanizer) | Remove signs of AI-generated writing from text to make it sound natural and human-written. | opencode |
| [jira](#jira) | Create, view, update, and manage Jira issues, sprints, and backlogs. | opencode |
| [marp-slide](#marp-slide) | Create professional Marp presentation slides with 7 built-in themes. | opencode |
| [mcp-builder](#mcp-builder) | Guide for creating high-quality MCP (Model Context Protocol) servers in Python or Node/TypeScript. | opencode |
| [meeting-insights-analyzer](#meeting-insights-analyzer) | Analyze meeting transcripts to uncover behavioral patterns, communication insights, and actionable feedback. | opencode |
| [mermaid-diagrams](#mermaid-diagrams) | Comprehensive guide for creating software diagrams using Mermaid syntax. | opencode |
| [notion](#notion) | Manage Notion pages and databases from the CLI using notion-cli. | opencode |
| [project-docs](#project-docs) | Generate comprehensive project documentation structures: README, ARCHITECTURE, USER_GUIDE, DEVELOPER_GUIDE, and CONTRIBUTING. | opencode |
| [skill-judge](#skill-judge) | Evaluate Agent Skill design quality against official specifications and best practices. | opencode |
| [work-on-ticket](#work-on-ticket) | Fetch Jira ticket details, create a named branch, and initiate task planning. | opencode |
| [worktrunk](#worktrunk) | Use the `wt` CLI for git worktree management, parallel AI agent sessions, and lifecycle automation. | opencode |
| [writing-clearly-and-concisely](#writing-clearly-and-concisely) | Apply Strunk's timeless rules for clearer, stronger prose in documentation, commits, and UI text. | opencode |

---

## asdf

**Trigger:** Any mention of asdf, `.tool-versions` files, managing runtime versions, or migrating from nvm/pyenv/rbenv/goenv/tfenv.

Provides a complete reference for installing and configuring the asdf universal version manager. Covers plugin management (`asdf plugin add`), version installation, the `.tool-versions` file format, shell configuration for Bash/Zsh/Fish, shim troubleshooting, and the `.asdfrc` options. Also explains the modern `asdf set` API introduced in v0.15+ and how to onboard an existing project with `asdf install`.

---

## code-docs

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

## glab

**Trigger:** Any interaction with GitLab resources — issues, merge requests, CI/CD pipelines, repositories — from the command line.

Expert guidance for the `glab` CLI. Covers creating and reviewing MRs, managing issues, checking pipeline status, cloning repositories, and performing GitLab operations without leaving the terminal. Includes common patterns for day-to-day GitLab workflows.

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

## notion

**Trigger:** Managing Notion content, creating or reading pages, querying databases, or adding blocks from the CLI.

Provides `notion-cli` command patterns for creating pages, reading page content, searching the workspace, querying and updating database entries, and managing blocks and properties. Covers authentication setup and common content management workflows.

---

## project-docs

**Trigger:** "document a project", requests for standard documentation files, or setting up docs for a new repository.

Generates a complete, professional documentation structure tailored to Python or Go projects in OpenSource or internal contexts. Produces five files: `README.md`, `ARCHITECTURE.md`, `USER_GUIDE.md`, `DEVELOPER_GUIDE.md`, and `CONTRIBUTING.md`. Each file follows consistent structure, tone, and formatting conventions.

---

## skill-judge

**Trigger:** Reviewing, auditing, or improving `SKILL.md` files and skill packages.

Evaluates Agent Skill design quality against official specifications and community best practices. Scores skills across multiple dimensions — description clarity, trigger precision, content depth, example quality, and frontmatter completeness — and provides actionable improvement suggestions with a final grade.

---

## work-on-ticket

**Trigger:** "work on [TICKET_ID]" or similar phrases where the user wants to start implementing a Jira ticket.

Fetches the specified Jira ticket, extracts acceptance criteria and context, creates an appropriately named Git branch, and initiates the task planning workflow. Acts as the entry point for ticket-driven development, bridging project management and version control.

---

## worktrunk

**Trigger:** Any mention of `wt`, Worktrunk, git worktree management, parallel AI agent sessions, `wt.toml`, `wt switch`/`wt list`/`wt merge`/`wt remove`/`wt step`, or LLM commit messages.

Complete reference for the Worktrunk (`wt`) CLI — a tool that manages git worktrees to enable parallel AI agent sessions on isolated branches. Covers the full lifecycle: `wt switch`, `wt list`, `wt merge`, `wt remove`, and `wt step`; hook configuration in `wt.toml`; automating dev server, database, and dependency setup per worktree; and LLM-generated commit messages.

---

## writing-clearly-and-concisely

**Trigger:** Writing prose that humans will read — documentation, commit messages, error messages, explanations, reports, or UI text.

Applies the timeless rules from Strunk and White's *The Elements of Style*: prefer the active voice, omit needless words, use definite language, keep related words together, and place the emphatic word at the end. Produces tighter, stronger writing by eliminating padding, passive constructions, and vague qualifiers.
