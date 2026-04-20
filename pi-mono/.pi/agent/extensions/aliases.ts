/**
 * @fileoverview Command Aliases Extension.
 *
 * Registers short-hand command aliases for commands that exist in other tools
 * (e.g. Opencode) but are named differently in pi. Add new entries directly
 * in this file — each one is a thin wrapper around a canonical pi action.
 *
 * Current aliases:
 *   `/exit` → graceful shutdown (equivalent to Ctrl+D when editor is empty)
 *   `/q`    → graceful shutdown
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function aliasesExtension(pi: ExtensionAPI) {
  /** `/exit` — Opencode-style quit alias. */
  pi.registerCommand("exit", {
    description: "Quit pi (alias for Ctrl+D)",
    handler: (_args, ctx) => {
      ctx.shutdown();
    },
  });

  /** `/q` — Short quit alias. */
  pi.registerCommand("q", {
    description: "Quit pi (alias for Ctrl+D)",
    handler: (_args, ctx) => {
      ctx.shutdown();
    },
  });
}
