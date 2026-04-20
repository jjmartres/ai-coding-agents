/**
 * @fileoverview Agents Extension.
 *
 * Defines named agents, each with an optional model, thinking level, tool set,
 * and system-prompt persona. Agents can be activated in two complementary ways:
 *
 *   1. **`/agents` command** — opens a `SelectList` picker to choose a
 *      session-wide agent. Applies the agent's model, thinking level, and tools
 *      persistently for the session. The active agent is shown in the status bar
 *      and emitted via `pi.events` so other extensions (e.g. Piline) can react.
 *
 *   2. **`@agent-name` inline mention** — detected in `before_agent_start`.
 *      Appends the mentioned agents' system prompts for that turn only.
 *      Does not change model or tools (use `/agents` for that).
 *
 * Example combining both modes:
 * ```
 * As @python-pro write the function, as @documentation-engineer document it
 * ```
 *
 * Agent files are discovered from directories listed in `settings.json`:
 * ```json
 * { "agents": ["~/.ai-agents/agents"] }
 * ```
 * Subdirectories are scanned recursively; the first-level subdirectory name
 * is stored as the agent's `category` and shown in the picker.
 *
 * Agent file format (`~/.ai-agents/agents/02-languages/python-pro.md`):
 * ```markdown
 * ---
 * description: Expert Python developer
 * model: anthropic/claude-sonnet-4-6
 * thinkingLevel: medium
 * tools: read,bash,edit,write
 * ---
 * You are an expert Python developer...
 * ```
 * All frontmatter fields are optional. The filename without `.md` is the name
 * used in `@mentions` and the `/agents` picker.
 *
 * Default agent: set `"defaultAgent": "<name>"` in `settings.json` to
 * automatically activate an agent on startup and new sessions. Resuming a
 * session preserves its previously selected agent.
 *
 * Events emitted:
 *   `agents:changed` — `{ name: string | null }` — fired on every agent
 *   activation or clear so other extensions can react without polling.
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, join, resolve } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text } from "@mariozechner/pi-tui";

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentDef = {
  name: string;
  description?: string;
  category?: string;     // subdirectory name, e.g. "02-languages"
  model?: string;        // "provider/model-id"
  thinkingLevel?: string;
  tools?: string[];
  systemPrompt: string;
};

// ── Parsing ───────────────────────────────────────────────────────────────────

/**
 * Parses YAML-like frontmatter from a markdown string.
 *
 * Only simple `key: value` lines are supported — no arrays, nested objects,
 * or multi-line values. Returns an empty meta object when no frontmatter block
 * is present.
 *
 * @param content - Raw markdown file content.
 * @returns Parsed key/value metadata and the body text after the closing `---`.
 */
function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  if (!content.startsWith("---\n")) return { meta: {}, body: content.trim() };
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return { meta: {}, body: content.trim() };

  const meta: Record<string, string> = {};
  for (const line of content.slice(4, end).split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }

  return { meta, body: content.slice(end + 5).trim() };
}

/**
 * Parses a single agent `.md` file into an `AgentDef`.
 *
 * @param file     - Absolute path to the `.md` file.
 * @param category - Optional category label derived from the parent directory.
 * @returns Parsed `AgentDef`, or `null` when the file cannot be read.
 */
function parseAgentFile(file: string, category?: string): AgentDef | null {
  try {
    const { meta, body } = parseFrontmatter(readFileSync(file, "utf8"));
    return {
      name: basename(file, ".md"),
      description: meta.description,
      category,
      model: meta.model,
      thinkingLevel: meta.thinkingLevel,
      tools: meta.tools
        ? meta.tools.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined,
      systemPrompt: body,
    };
  } catch {
    return null;
  }
}

// ── Settings / path resolution ────────────────────────────────────────────────

const GLOBAL_SETTINGS = join(homedir(), ".pi", "agent", "settings.json");

function readAgentPaths(settingsFile: string): string[] {
  if (!existsSync(settingsFile)) return [];
  try {
    const raw = JSON.parse(readFileSync(settingsFile, "utf8"));
    return Array.isArray(raw.agents)
      ? raw.agents.filter((p: unknown) => typeof p === "string")
      : [];
  } catch {
    return [];
  }
}

function readDefaultAgentName(settingsFile: string): string | null {
  if (!existsSync(settingsFile)) return null;
  try {
    const raw = JSON.parse(readFileSync(settingsFile, "utf8"));
    return typeof raw.defaultAgent === "string" ? raw.defaultAgent : null;
  } catch {
    return null;
  }
}

function resolvePath(rawPath: string, base: string): string {
  if (rawPath.startsWith("~/")) return join(homedir(), rawPath.slice(2));
  if (isAbsolute(rawPath)) return rawPath;
  return resolve(base, rawPath);
}

/**
 * Recursively walks `dir` and collects all `.md` file paths.
 *
 * The first-level subdirectory name is used as the `category` for all files
 * found inside it. Deeper nesting is flattened under the same category label.
 *
 * @param dir      - Directory to walk.
 * @param category - Category label inherited from the parent directory level.
 * @returns Array of `{ file, category }` entries.
 */
function walkMarkdownFiles(
  dir: string,
  category?: string,
): { file: string; category?: string }[] {
  const results: { file: string; category?: string }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    // entry.isFile() / isDirectory() return false for symlinks; use statSync
    // (which follows symlinks) so that symlinked .md files are discovered.
    let resolvedIsDir = entry.isDirectory();
    let resolvedIsFile = entry.isFile();
    if (entry.isSymbolicLink()) {
      try {
        const st = statSync(full);
        resolvedIsDir = st.isDirectory();
        resolvedIsFile = st.isFile();
      } catch {
        // broken symlink — skip
      }
    }

    if (resolvedIsDir) {
      // One level of subdirectory becomes the category label
      results.push(...walkMarkdownFiles(full, category ?? entry.name));
    } else if (resolvedIsFile && entry.name.endsWith(".md")) {
      results.push({ file: full, category });
    }
  }
  return results;
}

function discoverAgents(rawPaths: string[], base: string): AgentDef[] {
  const agents: AgentDef[] = [];

  for (const raw of rawPaths) {
    const resolved = resolvePath(raw, base);
    if (!existsSync(resolved)) continue;

    if (statSync(resolved).isDirectory()) {
      for (const { file, category } of walkMarkdownFiles(resolved)) {
        const agent = parseAgentFile(file, category);
        if (agent) agents.push(agent);
      }
    } else if (resolved.endsWith(".md")) {
      const agent = parseAgentFile(resolved);
      if (agent) agents.push(agent);
    }
  }

  return agents;
}

// ── @mention parsing ──────────────────────────────────────────────────────────

/**
 * Extracts unique `@mention` names from a prompt string.
 *
 * Matches tokens of the form `@name` where `name` starts with an alphanumeric
 * character and contains only lowercase letters, digits, and hyphens.
 *
 * @param text - Raw prompt text.
 * @returns Deduplicated array of mention names in lowercase.
 */
function parseMentions(text: string): string[] {
  const raw = text.match(/@([a-z0-9][a-z0-9-]*)/gi) ?? [];
  return [...new Set(raw.map((m) => m.slice(1).toLowerCase()))];
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function agentsExtension(pi: ExtensionAPI) {

  const registry = new Map<string, AgentDef>();
  let sessionAgent: AgentDef | null = null;
  let applyDefaultOnDiscover = false;

  // ── Registry management ────────────────────────────────────────────────────

  function reload(cwd: string): number {
    registry.clear();

    const globalBase = join(homedir(), ".pi", "agent");
    const projectSettings = join(cwd, ".pi", "settings.json");

    const agents = [
      ...discoverAgents(readAgentPaths(GLOBAL_SETTINGS), globalBase),
      ...discoverAgents(readAgentPaths(projectSettings), cwd),
    ];

    for (const agent of agents) registry.set(agent.name, agent);
    return registry.size;
  }

  // ── Applying an agent's model / tools / thinking ───────────────────────────

  async function applyAgent(agent: AgentDef, ctx: ExtensionContext) {
    if (agent.model) {
      const [provider, ...rest] = agent.model.split("/");
      const modelId = rest.join("/");
      const model = ctx.modelRegistry.find(provider, modelId);
      if (model) {
        const ok = await pi.setModel(model);
        if (!ok)
          ctx.ui.notify(
            `Agent "${agent.name}": model ${agent.model} unavailable`,
            "warning",
          );
      } else {
        ctx.ui.notify(
          `Agent "${agent.name}": model ${agent.model} not found`,
          "warning",
        );
      }
    }

    if (agent.thinkingLevel) {
      pi.setThinkingLevel(
        agent.thinkingLevel as Parameters<typeof pi.setThinkingLevel>[0],
      );
    }

    if (agent.tools && agent.tools.length > 0) {
      pi.setActiveTools(agent.tools);
    }
  }

  function updateStatus(ctx: ExtensionContext) {
    if (sessionAgent) {
      ctx.ui.setStatus(
        "agents",
        ctx.ui.theme.fg("accent", `@${sessionAgent.name}`),
      );
    } else {
      ctx.ui.setStatus("agents", undefined);
    }
    pi.events.emit("agents:changed", { name: sessionAgent?.name ?? null });
  }

  // ── Resources discover (startup + /reload) ─────────────────────────────────

  pi.on("resources_discover", async (_event, ctx) => {
    const count = reload(ctx.cwd);
    if (count > 0) {
      ctx.ui.notify(
        `Agents: ${count} agent${count === 1 ? "" : "s"} loaded`,
        "info",
      );
    }

    if (applyDefaultOnDiscover) {
      applyDefaultOnDiscover = false;
      const projectSettings = join(ctx.cwd, ".pi", "settings.json");
      // Project defaultAgent takes precedence over global
      const name =
        readDefaultAgentName(projectSettings) ??
        readDefaultAgentName(GLOBAL_SETTINGS);
      if (name) {
        const agent = registry.get(name);
        if (agent) {
          sessionAgent = agent;
          await applyAgent(agent, ctx);
          updateStatus(ctx);
          ctx.ui.notify(`Default agent applied: @${agent.name}`, "info");
        } else {
          ctx.ui.notify(
            `Default agent "${name}" not found in registry`,
            "warning",
          );
        }
      }
    }
  });

  // ── Inject system prompts on every turn ────────────────────────────────────

  pi.on("before_agent_start", async (event) => {
    // Collect: session agent first, then unique @mentions
    const seen = new Set<string>();
    const active: AgentDef[] = [];

    if (sessionAgent) {
      active.push(sessionAgent);
      seen.add(sessionAgent.name);
    }

    for (const name of parseMentions(event.prompt ?? "")) {
      const agent = registry.get(name);
      if (agent && !seen.has(agent.name)) {
        active.push(agent);
        seen.add(agent.name);
      }
    }

    if (active.length === 0) return;

    const injected = active
      .filter((a) => a.systemPrompt)
      .map((a) => `### @${a.name}\n\n${a.systemPrompt}`)
      .join("\n\n---\n\n");

    if (!injected) return;

    return {
      systemPrompt:
        event.systemPrompt +
        "\n\n## Active Agents\n\n" +
        injected,
    };
  });

  // ── /agents command ────────────────────────────────────────────────────────

  pi.registerCommand("agents", {
    description: "List and activate agents (@mention them inline or set session-wide)",
    handler: async (_args, ctx) => {
      if (registry.size === 0) {
        ctx.ui.notify(
          "No agents found. Add .md files to your agents directory and check settings.json.",
          "warning",
        );
        return;
      }

      const items: SelectItem[] = [
        {
          value: "(none)",
          label: "(none)",
          description: "Clear active agent, restore defaults",
        },
        ...[...registry.values()].map((a) => ({
          value: a.name,
          label: sessionAgent?.name === a.name ? `${a.name}  ✓` : a.name,
          description: [
            a.category ?? "",
            a.description ?? "",
            a.model ? `  ${a.model}` : "",
            a.thinkingLevel ? `thinking: ${a.thinkingLevel}` : "",
            a.tools ? `tools: ${a.tools.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join("  •  "),
        })),
      ];

      const chosen = await ctx.ui.custom<string | null>(
        (tui, theme, _kb, done) => {
          const container = new Container();

          container.addChild(new DynamicBorder((s) => theme.fg("accent", s)));
          container.addChild(
            new Text(
              theme.fg("accent", theme.bold("Agents")) +
                (sessionAgent
                  ? theme.fg("dim", `  — active: @${sessionAgent.name}`)
                  : theme.fg("dim", "  — type @name in any prompt")),
              1,
              0,
            ),
          );

          const list = new SelectList(items, Math.min(items.length, 12), {
            selectedPrefix: (t) => theme.fg("accent", t),
            selectedText: (t) => theme.fg("accent", t),
            description: (t) => theme.fg("dim", t),
            scrollInfo: (t) => theme.fg("dim", t),
            noMatch: (t) => theme.fg("warning", t),
          });

          list.onSelect = (item) => done(item.value);
          list.onCancel = () => done(null);

          container.addChild(list);
          container.addChild(
            new Text(
              theme.fg(
                "dim",
                "↑↓ navigate  •  enter activate  •  esc cancel",
              ),
              1,
              0,
            ),
          );
          container.addChild(new DynamicBorder((s) => theme.fg("accent", s)));

          return {
            render: (w) => container.render(w),
            invalidate: () => container.invalidate(),
            handleInput: (data) => {
              list.handleInput(data);
              tui.requestRender();
            },
          };
        },
      );

      if (!chosen) return;

      if (chosen === "(none)") {
        sessionAgent = null;
        updateStatus(ctx);
        ctx.ui.notify("Agent cleared", "info");
        return;
      }

      const agent = registry.get(chosen);
      if (!agent) return;

      sessionAgent = agent;
      await applyAgent(agent, ctx);
      updateStatus(ctx);
      ctx.ui.notify(`Agent activated: @${agent.name}`, "info");
    },
  });

  // ── Reset on session switch ────────────────────────────────────────────────

  pi.on("session_start", (event) => {
    const reason = (event as { reason?: string }).reason ?? "";
    if (reason === "resume") {
      // Resuming an existing session — keep whatever agent was active
      applyDefaultOnDiscover = false;
    } else if (reason === "reload") {
      // Extension reload — keep current session agent, just reload registry
      applyDefaultOnDiscover = false;
    } else {
      // startup | new | fork — start fresh with the default agent
      sessionAgent = null;
      applyDefaultOnDiscover = true;
    }
  });
}
