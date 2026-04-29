/**
 * @fileoverview Git Checkpoint Extension.
 *
 * Creates a git stash reference before every LLM turn so that when the user
 * navigates the session tree (branching), they can optionally restore the
 * working-tree state to the point in history where the branch originated.
 *
 * Lifecycle:
 *   1. `tool_result` — tracks the current session leaf entry ID.
 *   2. `turn_start`  — calls `git stash create` and maps the stash ref to the
 *                      current entry ID.
 *   3. `session_before_branch` — looks up the stash ref for the target entry and,
 *                                when running interactively, offers to restore it.
 *   4. `agent_end`   — clears the in-memory checkpoint map.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Registers git-checkpoint lifecycle hooks.
 *
 * Captures a `git stash create` reference before every LLM turn and offers
 * to restore the working tree when the user navigates to an earlier branch
 * point in the session tree.
 *
 * @param pi - The pi extension API.
 */
export default function (pi: ExtensionAPI) {
  /** Maps session entry IDs to their corresponding `git stash create` refs. */
  const checkpoints = new Map<string, string>();

  /** The ID of the most recently recorded session leaf entry. */
  let currentEntryId: string | undefined;

  // Track the current entry ID when user messages are saved.
  pi.on("tool_result", async (_event, ctx) => {
    const leaf = ctx.sessionManager.getLeafEntry();
    if (leaf) currentEntryId = leaf.id;
  });

  pi.on("turn_start", async () => {
    // Snapshot the working tree before the LLM makes any file changes.
    const { stdout } = await pi.exec("git", ["stash", "create"]);
    const ref = stdout.trim();
    if (ref && currentEntryId) {
      checkpoints.set(currentEntryId, ref);
    }
  });

  pi.on("session_before_branch", async (event, ctx) => {
    const ref = checkpoints.get(event.entryId);
    if (!ref) return;

    if (!ctx.hasUI) {
      // Non-interactive mode: skip automatic restore to avoid side effects.
      return;
    }

    const choice = await ctx.ui.select("Restore code state?", [
      "Yes, restore code to that point",
      "No, keep current code",
    ]);

    if (choice?.startsWith("Yes")) {
      await pi.exec("git", ["stash", "apply", ref]);
      ctx.ui.notify("Code restored to checkpoint", "info");
    }
  });

  pi.on("agent_end", async () => {
    // Discard stash refs after the agent completes — they are turn-scoped.
    checkpoints.clear();
  });
}
