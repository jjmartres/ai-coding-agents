/**
 * @fileoverview Tokens-Per-Second (TPS) Extension.
 *
 * After every agent turn, calculates and displays a summary notification with:
 *   - Output tokens per second (TPS)
 *   - Per-turn token breakdown: output, input, cache read/write, total
 *   - Elapsed wall-clock time
 *
 * Only active in interactive mode (`ctx.hasUI`). Silent in print and RPC modes.
 */

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Returns `true` when `message` is an `AssistantMessage`.
 *
 * Used as a type guard to safely access `.usage` fields from the heterogeneous
 * `event.messages` array emitted by `agent_end`.
 *
 * @param message - Unknown value from the messages array.
 * @returns Whether `message` conforms to `AssistantMessage`.
 */
function isAssistantMessage(message: unknown): message is AssistantMessage {
  if (!message || typeof message !== "object") return false;
  const role = (message as { role?: unknown }).role;
  return role === "assistant";
}

export default function (pi: ExtensionAPI) {
  /** Timestamp (ms) captured when the agent loop starts, reset after each turn. */
  let agentStartMs: number | null = null;

  pi.on("agent_start", () => {
    agentStartMs = Date.now();
  });

  pi.on("agent_end", (event, ctx) => {
    if (!ctx.hasUI) return;
    if (agentStartMs === null) return;

    const elapsedMs = Date.now() - agentStartMs;
    agentStartMs = null;
    if (elapsedMs <= 0) return;

    let input = 0;
    let output = 0;
    let cacheRead = 0;
    let cacheWrite = 0;
    let totalTokens = 0;

    for (const message of event.messages) {
      if (!isAssistantMessage(message)) continue;
      input += message.usage.input || 0;
      output += message.usage.output || 0;
      cacheRead += message.usage.cacheRead || 0;
      cacheWrite += message.usage.cacheWrite || 0;
      totalTokens += message.usage.totalTokens || 0;
    }

    if (output <= 0) return;

    const elapsedSeconds = elapsedMs / 1000;
    const tokensPerSecond = output / elapsedSeconds;

    ctx.ui.notify(
      `TPS ${tokensPerSecond.toFixed(1)} tok/s. ` +
        `out ${output.toLocaleString()}, ` +
        `in ${input.toLocaleString()}, ` +
        `cache r/w ${cacheRead.toLocaleString()}/${cacheWrite.toLocaleString()}, ` +
        `total ${totalTokens.toLocaleString()}, ` +
        `${elapsedSeconds.toFixed(1)}s`,
      "info",
    );
  });
}
