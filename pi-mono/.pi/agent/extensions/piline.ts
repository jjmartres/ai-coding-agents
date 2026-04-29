/**
 * @fileoverview Piline Extension.
 *
 * Replaces pi's default footer with an information-dense status line that
 * shows, left to right:
 *
 *   LEFT  — context window usage (%), input tokens, output tokens, cost
 *   RIGHT — Kubernetes context · working directory · git branch ·
 *           session name · active agent · model (thinking level)
 *
 * The footer is installed automatically on `session_start`. Toggle it at any
 * time with `/piline`.
 *
 * Reactive updates:
 *   - Git branch and Kubernetes context are refreshed after each `turn_end`.
 *   - Session name is polled every 500 ms to pick up `/name` and `Ctrl+R` renames.
 *   - Active agent name is updated immediately via the `agents:changed` event
 *     emitted by the Agents extension (`extensions/agents.ts`).
 *   - Model is tracked via `turn_start`.
 */

import type { AssistantMessage, Model } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

/**
 * Registers the Piline footer and the `/piline` toggle command.
 *
 * The footer is installed automatically on `session_start`. It replaces pi's
 * default status line with a two-sided layout showing context usage on the
 * left and environment context (Kubernetes, git, session, agent, model) on
 * the right.
 *
 * @param pi - The pi extension API.
 */
export default function (pi: ExtensionAPI) {
  let isCustomFooter = false;
  let cachedBranch = "";
  let cachedKubeContext = "";
  let cachedAgentName = "";
  let currentModel: Model<any> | undefined;
  let requestRender: (() => void) | undefined;
  let cachedSessionName = "";
  let namePollerTimer: ReturnType<typeof setInterval> | undefined;

  // React to agent changes emitted by agents.ts
  pi.events.on("agents:changed", (data: { name: string | null }) => {
    cachedAgentName = data.name ?? "";
    requestRender?.();
  });

  /**
   * Refreshes the cached git branch by running `git branch --show-current`.
   *
   * Silently clears the cached value on error (e.g. not inside a git repo).
   * Times out after 1 second to avoid stalling the footer render.
   */
  async function updateBranch() {
    try {
      const result = await pi.exec("git", ["branch", "--show-current"], {
        timeout: 1000,
      });
      cachedBranch = result.stdout.trim();
    } catch {
      cachedBranch = "";
    }
  }

  /**
   * Refreshes the cached Kubernetes context via `kubectl config current-context`.
   *
   * Silently clears the cached value when kubectl is not installed or fails.
   * Times out after 1 second.
   */
  async function updateKubeContext() {
    try {
      const result = await pi.exec("kubectl", ["config", "current-context"], {
        timeout: 1000,
      });
      cachedKubeContext = result.stdout.trim();
    } catch {
      cachedKubeContext = "";
    }
  }

  /**
   * Builds the footer renderer closure for `ctx.ui.setFooter()`.
   *
   * Returns a function that, each frame, reads live session stats, computes
   * token usage, and returns a single terminal line fitting the given width.
   * Captures `requestRender` so other parts of the extension can trigger
   * re-renders without holding a direct reference to the TUI object.
   *
   * @param ctx - Extension context for the active session.
   * @returns Footer renderer compatible with `ctx.ui.setFooter()`.
   */
  function buildFooterRenderer(ctx: ExtensionAPI["ctx"]) {
    return (tui: any, theme: any) => {
      requestRender = () => tui.requestRender();
      return {
        render(width: number): string[] {
          // Calculate usage from branch entries
          let totalInput = 0;
          let totalOutput = 0;
          let totalCost = 0;
          let lastAssistant: AssistantMessage | undefined;

          for (const entry of ctx.sessionManager.getBranch()) {
            if (
              entry.type === "message" &&
              entry.message.role === "assistant"
            ) {
              const msg = entry.message as AssistantMessage;
              totalInput += msg.usage.input;
              totalOutput += msg.usage.output;
              totalCost += msg.usage.cost.total;
              lastAssistant = msg;
            }
          }

          // Use tracked currentModel, or derive from last assistant message
          const model =
            currentModel ??
            (lastAssistant
              ? ctx.modelRegistry.find(
                  lastAssistant.provider,
                  lastAssistant.model,
                )
              : ctx.model);

          // Context percentage from last assistant message
          const contextTokens = lastAssistant
            ? lastAssistant.usage.input +
              lastAssistant.usage.output +
              lastAssistant.usage.cacheRead +
              lastAssistant.usage.cacheWrite
            : 0;
          const contextWindow = model?.contextWindow || 0;
          const contextPercent =
            contextWindow > 0 ? (contextTokens / contextWindow) * 100 : 0;

          // Format tokens
          const fmt = (n: number) =>
            n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`;

          // Build footer line
          const left = [
            theme.fg("success", `\uE22C ❯ `),
            theme.fg(
              contextPercent > 90
                ? "error"
                : contextPercent > 70
                  ? "warning"
                  : "success",
              `\uE70F${contextPercent.toFixed(1)}%`,
            ),
            theme.fg("dim", `↑${fmt(totalInput)}`),
            theme.fg("dim", `↓${fmt(totalOutput)}`),
            theme.fg("dim", `${totalCost.toFixed(3)}`),
          ].join(" ");

          // Get context information
          const thinkingLevel = pi.getThinkingLevel();
          const folder = ctx.cwd.split("/").pop() || ctx.cwd;
          const sessionName = pi.getSessionName() || "";

          // Build right side: kube context, folder, branch, session name, thinking level, model
          const right = [
            cachedKubeContext
              ? theme.fg("mdLink", ` ${cachedKubeContext}`)
              : "",
            theme.fg("accent", `  ${folder}`),
            cachedBranch ? theme.fg("mdCode", `󰘬 ${cachedBranch}`) : "",
            sessionName ? theme.fg("syntaxOperator", `  ${sessionName}`) : "",
            cachedAgentName ? theme.fg("warning", ` ${cachedAgentName}`) : "",
            theme.fg("mdHeading", `󱚥  ${model?.id || "no model"}`) +
              (thinkingLevel !== "off"
                ? theme.fg("mdHeading", ` (${thinkingLevel})`)
                : ""),
          ]
            .filter(Boolean)
            .join(theme.fg("dim", " - "));

          const padding = " ".repeat(
            Math.max(1, width - visibleWidth(left) - visibleWidth(right)),
          );

          return [truncateToWidth(left + padding + right, width)];
        },
        invalidate() {},
      };
    };
  }

  // Track model changes via turn_start event
  pi.on("turn_start", (_event, ctx) => {
    currentModel = ctx.model;
  });

  // Poll for session name changes (handles both /name cmd and Ctrl+R interactive rename)
  /**
   * Starts a 500 ms interval that polls `pi.getSessionName()` and triggers a
   * render whenever the name changes.
   *
   * Handles both the `/name` command and the interactive `Ctrl+R` rename flow,
   * neither of which fires an event that extensions can listen to.
   */
  function startNamePoller() {
    stopNamePoller();
    cachedSessionName = pi.getSessionName() || "";
    namePollerTimer = setInterval(() => {
      const current = pi.getSessionName() || "";
      if (current !== cachedSessionName) {
        cachedSessionName = current;
        requestRender?.();
      }
    }, 500);
  }

  /**
   * Clears the session-name polling interval if one is running.
   *
   * Safe to call multiple times; a no-op when no poller is active.
   */
  function stopNamePoller() {
    if (namePollerTimer !== undefined) {
      clearInterval(namePollerTimer);
      namePollerTimer = undefined;
    }
  }

  // Enable footer on session start
  pi.on("session_start", async (_event, ctx) => {
    await Promise.all([updateBranch(), updateKubeContext()]);
    isCustomFooter = true;
    currentModel = ctx.model;
    ctx.ui.setFooter(buildFooterRenderer(ctx));
    startNamePoller();
  });

  // Toggle piline footer with /piline command
  pi.registerCommand("piline", {
    description: "Toggle piline enhanced footer with session context",
    handler: async (_args, ctx) => {
      isCustomFooter = !isCustomFooter;

      if (isCustomFooter) {
        await Promise.all([updateBranch(), updateKubeContext()]);
        ctx.ui.setFooter(buildFooterRenderer(ctx));
        startNamePoller();
        ctx.ui.notify("Piline enabled", "info");
      } else {
        stopNamePoller();
        ctx.ui.setFooter(undefined);
        ctx.ui.notify("Piline disabled", "info");
      }
    },
  });

  // Update branch and kube context on turn end
  pi.on("turn_end", async () => {
    if (isCustomFooter) {
      await Promise.all([updateBranch(), updateKubeContext()]);
    }
  });

  // Clean up on session shutdown
  pi.on("session_shutdown", () => {
    stopNamePoller();
  });
}
