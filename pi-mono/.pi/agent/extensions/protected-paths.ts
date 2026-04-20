/**
 * @fileoverview Protected Paths Extension.
 *
 * Blocks `write` and `edit` tool calls targeting paths that match a configured
 * list of protected path substrings. Prevents accidental modification of
 * sensitive files such as environment configs, git internals, and dependency
 * directories.
 *
 * Protected paths (substring match):
 *   - `.env`          — environment variable files
 *   - `.git/`         — git repository internals
 *   - `node_modules/` — installed npm packages
 *   - `.worktrees/`   — git worktree directories
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/** Path substrings whose presence in a target path triggers a write block. */
const PROTECTED_PATHS: string[] = [
  ".env",
  ".git/",
  "node_modules/",
  ".worktrees/",
];

/**
 * Returns `true` when `path` contains at least one protected substring.
 *
 * @param path - Absolute or relative file path from a tool call.
 * @returns Whether the path is protected.
 */
function isProtected(path: string): boolean {
  return PROTECTED_PATHS.some((p) => path.includes(p));
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "write" && event.toolName !== "edit") {
      return undefined;
    }

    const path = event.input.path as string;
    if (!isProtected(path)) return undefined;

    if (ctx.hasUI) {
      ctx.ui.notify(`Blocked write to protected path: ${path}`, "warning");
    }

    return { block: true, reason: `Path "${path}" is protected` };
  });
}
