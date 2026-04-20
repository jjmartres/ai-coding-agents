/**
 * @fileoverview Rules Extension.
 *
 * Injects persistent rule files into the LLM system prompt on every agent turn,
 * equivalent to Opencode's built-in "rules" feature.
 *
 * Rules are loaded from paths listed in the `rules` key of `settings.json`.
 * Both global (`~/.pi/agent/settings.json`) and project (`.pi/settings.json`)
 * settings are read; project rules are appended after global ones.
 *
 * Configuration (`settings.json`):
 * ```json
 * { "rules": ["~/.ai-agents/rules", ".pi/rules"] }
 * ```
 *
 * Rule file format — frontmatter is stripped, only the body is injected:
 * ```markdown
 * ---
 * description: Human-readable label (informational only, not sent to LLM)
 * ---
 * Always respond in the same language the user writes in.
 * ```
 *
 * Each path entry may be:
 *   - A directory → all `.md` files directly inside are loaded (non-recursive).
 *   - A file path  → loaded directly if it ends with `.md`.
 *
 * The registry is refreshed on every `/reload` via the `resources_discover` event.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, isAbsolute } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/** Absolute path to the global pi agent settings file. */
const GLOBAL_SETTINGS = join(homedir(), ".pi", "agent", "settings.json");

// ── Settings parsing ──────────────────────────────────────────────────────────

/**
 * Reads the `rules` array from a `settings.json` file.
 *
 * @param settingsFile - Absolute path to a pi `settings.json`.
 * @returns Array of raw path strings, or an empty array on any error.
 */
function readRulePaths(settingsFile: string): string[] {
  if (!existsSync(settingsFile)) return [];
  try {
    const raw = JSON.parse(readFileSync(settingsFile, "utf8"));
    if (!Array.isArray(raw.rules)) return [];
    return raw.rules.filter((p: unknown) => typeof p === "string");
  } catch {
    return [];
  }
}

/**
 * Resolves a raw path string to an absolute path.
 *
 * Supports `~/` home-directory expansion, absolute paths, and paths relative
 * to the provided `base` directory.
 *
 * @param rawPath - Path string as written in `settings.json`.
 * @param base    - Base directory for relative path resolution.
 * @returns Absolute resolved path.
 */
function resolvePath(rawPath: string, base: string): string {
  if (rawPath.startsWith("~/")) return join(homedir(), rawPath.slice(2));
  if (isAbsolute(rawPath)) return rawPath;
  return resolve(base, rawPath);
}

// ── Rule file discovery ───────────────────────────────────────────────────────

/**
 * Strips YAML frontmatter from a markdown string.
 *
 * Only strips a leading `---\n … \n---\n` block. Returns the original string
 * trimmed when no frontmatter is present.
 *
 * @param content - Raw markdown file content.
 * @returns Body text with frontmatter removed.
 */
function stripFrontmatter(content: string): string {
  if (!content.startsWith("---\n")) return content.trim();
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return content.trim();
  return content.slice(end + 5).trim();
}

/**
 * Resolves each path entry and collects absolute `.md` file paths.
 *
 * Directory entries are scanned one level deep (non-recursive). File entries
 * are included directly if they end with `.md`.
 *
 * @param rawPaths - Raw path strings from `settings.json`.
 * @param base     - Base directory for resolving relative paths.
 * @returns Ordered list of absolute `.md` file paths.
 */
function collectRuleFiles(rawPaths: string[], base: string): string[] {
  const files: string[] = [];
  for (const raw of rawPaths) {
    const resolved = resolvePath(raw, base);
    if (!existsSync(resolved)) continue;
    const stat = statSync(resolved);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(resolved, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          files.push(join(resolved, entry.name));
        }
      }
    } else if (stat.isFile() && resolved.endsWith(".md")) {
      files.push(resolved);
    }
  }
  return files;
}

/**
 * Reads and concatenates the body content of each rule file.
 *
 * Frontmatter is stripped from each file. Files that cannot be read are
 * silently skipped.
 *
 * @param files - Absolute paths to `.md` rule files.
 * @returns Single string with all rule bodies joined by double newlines.
 */
function loadRules(files: string[]): string {
  return files
    .map((f) => {
      try {
        return stripFrontmatter(readFileSync(f, "utf8"));
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function rulesExtension(pi: ExtensionAPI) {
  /** Concatenated body content of all loaded rule files. Empty when no rules. */
  let rulesContent = "";

  /**
   * Discovers and loads all rule files for the given working directory.
   *
   * Merges global rules (from `~/.pi/agent/settings.json`) with project rules
   * (from `<cwd>/.pi/settings.json`), with global rules appearing first.
   *
   * @param cwd - Current working directory of the active session.
   * @returns Total number of rule files loaded.
   */
  function reload(cwd: string): number {
    const globalBase = join(homedir(), ".pi", "agent");
    const projectSettings = join(cwd, ".pi", "settings.json");

    const globalPaths = readRulePaths(GLOBAL_SETTINGS);
    const globalFiles = collectRuleFiles(globalPaths, globalBase);

    const projectPaths = readRulePaths(projectSettings);
    const projectFiles = collectRuleFiles(projectPaths, cwd);

    const allFiles = [...globalFiles, ...projectFiles];
    rulesContent = loadRules(allFiles);
    return allFiles.length;
  }

  // Reload on startup and on every /reload.
  pi.on("resources_discover", (_event, ctx) => {
    const count = reload(ctx.cwd);
    if (count > 0) {
      ctx.ui.notify(`Rules: loaded ${count} rule file${count === 1 ? "" : "s"}`, "info");
    }
  });

  // Append all rule content under a "## Rules" heading before each agent turn.
  pi.on("before_agent_start", async (event) => {
    if (!rulesContent) return;
    return {
      systemPrompt:
        event.systemPrompt +
        "\n\n## Rules\n\nFollow these rules in all your responses:\n\n" +
        rulesContent,
    };
  });
}
