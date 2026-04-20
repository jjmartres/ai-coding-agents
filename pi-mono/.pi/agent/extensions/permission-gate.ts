/**
 * @fileoverview Permission Gate Extension.
 *
 * Intercepts `bash` tool calls that match a set of dangerous command patterns
 * and prompts the user for explicit confirmation before allowing them to run.
 * In non-interactive mode the commands are blocked automatically.
 *
 * Guarded patterns:
 *   - `rm -rf` / `rm -r`  — recursive deletion
 *   - `sudo`              — privilege escalation
 *   - `chmod`/`chown` 777 — world-writable permission changes
 *
 * The confirmation dialog auto-denies after 30 seconds if the user does not
 * respond, preventing an agent from hanging indefinitely.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/** Regex patterns that flag a bash command as potentially dangerous. */
const DANGEROUS_PATTERNS: RegExp[] = [
  /\brm\s+(-rf?|--recursive)/i,
  /\bsudo\b/i,
  /\b(chmod|chown)\b.*777/i,
];

/**
 * Returns `true` when the given shell command string matches at least one
 * dangerous pattern.
 *
 * @param command - Raw bash command string from the tool call input.
 * @returns Whether the command should be gated.
 */
function isDangerous(command: string): boolean {
  return DANGEROUS_PATTERNS.some((p) => p.test(command));
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return undefined;

    const command = event.input.command as string;
    if (!isDangerous(command)) return undefined;

    if (!ctx.hasUI) {
      return {
        block: true,
        reason: "Dangerous command blocked (no UI for confirmation)",
      };
    }

    // Auto-deny after 30 seconds so the agent does not hang.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const choice = await ctx.ui.select(
      `⚠️ Dangerous command:\n\n  ${command}\n\nAllow? (auto-deny in 30s)`,
      ["Yes", "No"],
      { signal: controller.signal },
    );

    clearTimeout(timeoutId);

    if (choice !== "Yes") {
      const reason = controller.signal.aborted ? "Timed out" : "Blocked by user";
      return { block: true, reason };
    }

    return undefined;
  });
}
