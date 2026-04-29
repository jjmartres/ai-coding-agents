/**
 * @fileoverview Auto-Skills Extension.
 *
 * Automatically injects relevant skill guidelines into the LLM context based on
 * signals found in the conversation, without requiring the user to invoke a
 * skill manually.
 *
 * Two detection strategies:
 *   1. **Prompt scan** (`before_agent_start`) — checks the user's raw prompt
 *      text against per-skill trigger patterns and injects matching skill
 *      content into the system prompt for the current turn.
 *   2. **File operation scan** (`tool_call`) — checks `path` arguments of
 *      `read`, `edit`, and `write` tool calls and injects skill content as a
 *      follow-up message on the next turn when a match is found.
 *
 * Each skill is injected at most once per session (tracked via `injectedSkills`).
 *
 * Supported skill triggers:
 *   - `python`  — `.py`, `python`, `pytest`, `pip`, `poetry`
 *   - `shell`   — `.sh`, `bash`, `shell script`, `zsh`
 *   - `search`  — "search the web", `google`, `brave search`
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/** Base directory for pi-skills package skill files. */
const SKILLS_BASE = join(homedir(), ".pi", "agent", "skills", "pi-skills");

/**
 * Maps a logical skill name to its file-system skill name and the set of
 * regex patterns that should trigger automatic injection.
 */
const SKILL_TRIGGERS: Record<string, { patterns: RegExp[]; skill: string }> = {
  python: {
    patterns: [
      /\.py\b/,
      /\bpython\b/i,
      /\bpytest\b/i,
      /\bpip\b/i,
      /\bpoetry\b/i,
    ],
    skill: "python-dev-guidelines",
  },
  shell: {
    patterns: [/\.sh\b/, /\bbash\b/i, /\bshell\s+script/i, /\bzsh\b/i],
    skill: "shell-script-guidelines",
  },
  search: {
    patterns: [
      /\bsearch\s+(the\s+)?(web|internet|online)\b/i,
      /\bgoogle\b/i,
      /\bbrave\s+search\b/i,
    ],
    skill: "brave-search",
  },
};

/**
 * Loads the raw markdown content of a skill file from the pi-skills package.
 *
 * @param skillName - Skill directory name inside the pi-skills package.
 * @returns The raw `SKILL.md` content, or `null` if the file does not exist.
 */
function loadSkillContent(skillName: string): string | null {
  const skillPath = join(SKILLS_BASE, skillName, "SKILL.md");
  if (!existsSync(skillPath)) return null;
  return readFileSync(skillPath, "utf-8");
}

/**
 * Returns the logical skill name whose trigger patterns match `path`, or
 * `null` when no trigger matches.
 *
 * @param path - File path from a tool call `path` argument.
 * @returns Logical skill name, or `null`.
 */
function detectSkillFromPath(path: string): string | null {
  for (const [name, { patterns }] of Object.entries(SKILL_TRIGGERS)) {
    if (patterns.some((p) => p.test(path))) return name;
  }
  return null;
}

/**
 * Registers skill auto-injection hooks.
 *
 * Monitors the user's prompt text and file-path arguments in tool calls.
 * When a trigger pattern matches a registered skill, the skill's `SKILL.md`
 * content is injected into the LLM context. Each skill is injected at most
 * once per session.
 *
 * @param pi - The pi extension API.
 */
export default function (pi: ExtensionAPI) {
  /**
   * Tracks which skills have already been injected in the current session to
   * avoid injecting the same skill multiple times.
   */
  const injectedSkills = new Set<string>();

  pi.on("session_start", () => {
    injectedSkills.clear();
  });

  // Strategy 1: scan the user's prompt text before the agent starts.
  pi.on("before_agent_start", async (event) => {
    const prompt = event.prompt;
    const toInject: string[] = [];

    for (const [name, { patterns, skill }] of Object.entries(SKILL_TRIGGERS)) {
      if (injectedSkills.has(name)) continue;
      if (patterns.some((p) => p.test(prompt))) {
        const content = loadSkillContent(skill);
        if (content) {
          toInject.push(content);
          injectedSkills.add(name);
        }
      }
    }

    if (toInject.length > 0) {
      return { systemPromptAppend: "\n\n" + toInject.join("\n\n---\n\n") };
    }
  });

  // Strategy 2: scan file paths in read/edit/write tool calls.
  pi.on("tool_call", async (event, ctx) => {
    const path = event.input.path as string | undefined;
    if (!path) return;

    const skillName = detectSkillFromPath(path);
    if (!skillName || injectedSkills.has(skillName)) return;

    const skill = SKILL_TRIGGERS[skillName];
    const content = loadSkillContent(skill.skill);
    if (!content) return;

    injectedSkills.add(skillName);

    // Deliver as a follow-up message on the next turn so it does not interrupt
    // the current tool-call sequence.
    pi.sendMessage(
      {
        customType: "auto-skill",
        content: `[Auto-loaded ${skill.skill} guidelines]\n\n${content}`,
        display: false,
      },
      { deliverAs: "nextTurn" },
    );

    ctx.ui.notify(`Loaded ${skill.skill} skill`, "info");
  });
}
