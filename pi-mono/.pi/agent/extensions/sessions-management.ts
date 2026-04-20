/**
 * @fileoverview Sessions Management Extension.
 *
 * Provides session lifecycle commands: naming, browsing, creation, and deletion.
 *
 * Commands:
 *   `/session-name`          — auto-generate a session name via the active model.
 *   `/session-name <title>`  — set a name manually, bypassing the LLM.
 *   `/session-list`          — interactive SelectList to browse and switch sessions.
 *   `/session-new`           — start a fresh session, optionally pre-named.
 *   `/session-delete`        — pick and permanently delete a session file.
 *
 * Auto-naming: after the first `agent_end` event in a new session, if no name
 * has been set, the extension silently generates one using the active model and
 * `pi.setSessionName()`. The `autoNamed` flag prevents re-renaming on subsequent
 * turns. Each new or resumed session resets the flag via `session_start`.
 */

import { unlink } from "node:fs/promises";
import { complete } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { BorderedLoader, DynamicBorder, SessionManager } from "@mariozechner/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text } from "@mariozechner/pi-tui";

// ── Conversation extraction ──────────────────────────────────────────────────

/** A single block within an LLM message `content` array. */
type ContentBlock = {
  type?: string;
  text?: string;
};

/**
 * Extracts plain text from an LLM message `content` value.
 *
 * Handles both string content and the structured content-block array format
 * used by most providers.
 *
 * @param content - Raw `content` field from an LLM message.
 * @returns Concatenated text, trimmed.
 */
function extractText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter((b): b is ContentBlock => !!b && typeof b === "object")
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => (b.text as string).trim())
    .join(" ");
}

/**
 * Builds a truncated conversation transcript from session branch entries.
 *
 * Only user and assistant messages are included. The result is capped at
 * `maxChars` to keep the naming prompt lightweight.
 *
 * @param entries  - Session branch entries from `sessionManager.getBranch()`.
 * @param maxChars - Maximum total character length of the returned snippet.
 * @returns Multi-line conversation string.
 */
function buildConversationSnippet(
  entries: ReturnType<ExtensionAPI["ctx"]["sessionManager"]["getBranch"]>,
  maxChars = 4000,
): string {
  const lines: string[] = [];
  let total = 0;

  for (const entry of entries) {
    if (entry.type !== "message") continue;
    const msg = entry.message as { role?: string; content?: unknown };
    if (msg.role !== "user" && msg.role !== "assistant") continue;

    const text = extractText(msg.content);
    if (!text) continue;

    const line = `${msg.role === "user" ? "User" : "Assistant"}: ${text}`;
    total += line.length;
    lines.push(line);

    // Keep the first N chars so the naming prompt stays cheap
    if (total >= maxChars) break;
  }

  return lines.join("\n\n");
}

// ── LLM naming ───────────────────────────────────────────────────────────────

const NAMING_PROMPT = `You are a session-naming assistant.
Given the conversation below, produce a short, descriptive title for the session.

Rules:
- 2 to 5 words maximum
- Use Title Case
- No punctuation, no quotes
- Focus on the main topic or task
- Reply with ONLY the title, nothing else

<conversation>
{conversation}
</conversation>`;

/**
 * Generates a short session name from the current conversation using the
 * active model.
 *
 * Sends the conversation snippet to the LLM with a tight naming prompt and
 * strips any surrounding quotes from the response.
 *
 * @param ctx - Extension context providing the active model and session data.
 * @returns A 2–5 word title, or `undefined` when generation fails.
 */
async function generateName(
  ctx: ExtensionAPI["ctx"],
): Promise<string | undefined> {
  const model = ctx.model;
  if (!model) return undefined;

  const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
  if (!auth.ok || !auth.apiKey) return undefined;

  const conversation = buildConversationSnippet(ctx.sessionManager.getBranch());
  if (!conversation.trim()) return undefined;

  const prompt = NAMING_PROMPT.replace("{conversation}", conversation);

  const response = await complete(
    model,
    {
      messages: [
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: prompt }],
          timestamp: Date.now(),
        },
      ],
    },
    {
      apiKey: auth.apiKey,
      headers: auth.headers,
    },
  );

  const name = response.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text.trim())
    .join("")
    .replace(/^["']|["']$/g, "") // strip any surrounding quotes the LLM may add
    .trim();

  return name || undefined;
}

// ── Session list helpers ─────────────────────────────────────────────────────

/**
 * Formats a `Date` as a human-readable relative time string.
 *
 * @param date - The date to format.
 * @returns A string such as `"3m ago"`, `"2h ago"`, or `"5d ago"`.
 *          Falls back to `toLocaleDateString()` for dates older than 30 days.
 */
function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ── Extension ────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  let autoNamed = false; // only auto-name once per session

  // /session-name command
  pi.registerCommand("session-name", {
    description:
      "Auto-generate a session name from the conversation, or set one manually",
    handler: async (args, ctx) => {
      const manual = args.trim();

      // Manual override: /session-name My Custom Title
      if (manual) {
        pi.setSessionName(manual);
        autoNamed = true;
        ctx.ui.notify(`Session named: "${manual}"`, "info");
        return;
      }

      // Auto-generate from conversation
      ctx.ui.notify("Generating session name…", "info");

      const name = await generateName(ctx);
      if (!name) {
        ctx.ui.notify(
          "Could not generate a name (no conversation or no model)",
          "warning",
        );
        return;
      }

      pi.setSessionName(name);
      autoNamed = true;
      ctx.ui.notify(`Session named: "${name}"`, "info");
    },
  });

  // Auto-rename after the first agent turn if no name is set yet
  pi.on("agent_end", async (_event, ctx) => {
    if (autoNamed) return;
    if (pi.getSessionName()) {
      autoNamed = true;
      return;
    }

    const name = await generateName(ctx);
    if (name) {
      pi.setSessionName(name);
      autoNamed = true;
    }
  });

  // Reset auto-name flag on new/resumed session so each session gets its own name
  pi.on("session_start", () => {
    autoNamed = false;
  });

  // /session-list command
  pi.registerCommand("session-list", {
    description: "Browse and switch to a session in the current project directory",
    handler: async (_args, ctx) => {
      // ── 1. Load sessions with a spinner ───────────────────────────────────
      const sessions = await ctx.ui.custom<
        Awaited<ReturnType<typeof SessionManager.list>> | null
      >((tui, theme, _kb, done) => {
        const loader = new BorderedLoader(tui, theme, "Loading sessions…");
        loader.onAbort = () => done(null);
        SessionManager.list(ctx.cwd)
          .then((list) => done(list))
          .catch(() => done(null));
        return loader;
      });

      if (!sessions) {
        ctx.ui.notify("Session list cancelled", "info");
        return;
      }

      if (sessions.length === 0) {
        ctx.ui.notify("No sessions found for this directory", "warning");
        return;
      }

      // ── 2. Build select items ─────────────────────────────────────────────
      const currentFile = ctx.sessionManager.getSessionFile();

      // Sort: most recently modified first
      const sorted = [...sessions].sort(
        (a, b) => b.modified.getTime() - a.modified.getTime(),
      );

      const items: SelectItem[] = sorted.map((s) => {
        const isCurrent = s.path === currentFile;
        const label = (s.name || s.firstMessage || s.id).slice(0, 60);
        const description = [
          relativeTime(s.modified),
          `${s.messageCount} msg${s.messageCount === 1 ? "" : "s"}`,
          isCurrent ? "← current" : "",
        ]
          .filter(Boolean)
          .join("  •  ");

        return {
          value: s.path,
          label: isCurrent ? `${label} ←` : label,
          description,
        };
      });

      // ── 3. Show interactive list ──────────────────────────────────────────
      const chosen = await ctx.ui.custom<string | null>(
        (tui, theme, _kb, done) => {
          const container = new Container();

          container.addChild(
            new DynamicBorder((s) => theme.fg("accent", s)),
          );
          container.addChild(
            new Text(
              theme.fg("accent", theme.bold("Sessions — ")) +
                theme.fg("dim", ctx.cwd),
              1,
              0,
            ),
          );

          const list = new SelectList(
            items,
            Math.min(items.length, 12),
            {
              selectedPrefix: (t) => theme.fg("accent", t),
              selectedText: (t) => theme.fg("accent", t),
              description: (t) => theme.fg("dim", t),
              scrollInfo: (t) => theme.fg("dim", t),
              noMatch: (t) => theme.fg("warning", t),
            },
          );

          list.onSelect = (item) => done(item.value);
          list.onCancel = () => done(null);

          container.addChild(list);
          container.addChild(
            new Text(
              theme.fg("dim", "↑↓ navigate  •  enter switch  •  esc cancel"),
              1,
              0,
            ),
          );
          container.addChild(
            new DynamicBorder((s) => theme.fg("accent", s)),
          );

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

      if (chosen === currentFile) {
        ctx.ui.notify("Already in this session", "info");
        return;
      }

      // ── 4. Switch ─────────────────────────────────────────────────────────
      const result = await ctx.switchSession(chosen);
      if (result.cancelled) {
        ctx.ui.notify("Session switch cancelled by another extension", "warning");
      }
    },
  });

  // /session-delete command
  pi.registerCommand("session-delete", {
    description: "Pick and permanently delete a session in the current project directory",
    handler: async (_args, ctx) => {
      const currentFile = ctx.sessionManager.getSessionFile();

      // ── 1. Load sessions with a spinner ───────────────────────────────────
      const sessions = await ctx.ui.custom<
        Awaited<ReturnType<typeof SessionManager.list>> | null
      >((tui, theme, _kb, done) => {
        const loader = new BorderedLoader(tui, theme, "Loading sessions…");
        loader.onAbort = () => done(null);
        SessionManager.list(ctx.cwd)
          .then((list) => done(list))
          .catch(() => done(null));
        return loader;
      });

      if (!sessions) {
        ctx.ui.notify("Cancelled", "info");
        return;
      }

      // Exclude the active session — deleting it would corrupt the running state
      const deletable = sessions.filter((s) => s.path !== currentFile);

      if (deletable.length === 0) {
        ctx.ui.notify(
          sessions.length === 0
            ? "No sessions found for this directory"
            : "Only the current session exists — cannot delete it",
          "warning",
        );
        return;
      }

      // ── 2. Build select items ─────────────────────────────────────────────
      const sorted = [...deletable].sort(
        (a, b) => b.modified.getTime() - a.modified.getTime(),
      );

      const items: SelectItem[] = sorted.map((s) => ({
        value: s.path,
        label: (s.name || s.firstMessage || s.id).slice(0, 60),
        description: [
          relativeTime(s.modified),
          `${s.messageCount} msg${s.messageCount === 1 ? "" : "s"}`,
        ].join("  •  "),
      }));

      // ── 3. Show interactive list ──────────────────────────────────────────
      const chosen = await ctx.ui.custom<string | null>(
        (tui, theme, _kb, done) => {
          const container = new Container();

          container.addChild(new DynamicBorder((s) => theme.fg("error", s)));
          container.addChild(
            new Text(
              theme.fg("error", theme.bold("Delete Session — ")) +
                theme.fg("dim", ctx.cwd),
              1,
              0,
            ),
          );

          const list = new SelectList(items, Math.min(items.length, 12), {
            selectedPrefix: (t) => theme.fg("error", t),
            selectedText: (t) => theme.fg("error", t),
            description: (t) => theme.fg("dim", t),
            scrollInfo: (t) => theme.fg("dim", t),
            noMatch: (t) => theme.fg("warning", t),
          });

          list.onSelect = (item) => done(item.value);
          list.onCancel = () => done(null);

          container.addChild(list);
          container.addChild(
            new Text(
              theme.fg("dim", "↑↓ navigate  •  enter select  •  esc cancel"),
              1,
              0,
            ),
          );
          container.addChild(new DynamicBorder((s) => theme.fg("error", s)));

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

      // ── 4. Confirm ────────────────────────────────────────────────────────
      const target = sorted.find((s) => s.path === chosen)!;
      const label = target.name || target.firstMessage || target.id;

      const confirmed = await ctx.ui.confirm(
        "Delete session?",
        `"${label.slice(0, 60)}" will be permanently removed.`,
      );

      if (!confirmed) {
        ctx.ui.notify("Deletion cancelled", "info");
        return;
      }

      // ── 5. Delete ─────────────────────────────────────────────────────────
      try {
        await unlink(chosen);
        ctx.ui.notify(`Session deleted: "${label.slice(0, 40)}"`, "info");
      } catch (err) {
        ctx.ui.notify(
          `Failed to delete session: ${err instanceof Error ? err.message : String(err)}`,
          "error",
        );
      }
    },
  });

  // /session-new command
  pi.registerCommand("session-new", {
    description: "Start a fresh session, with an optional name",
    handler: async (args, ctx) => {
      const name = args.trim() || undefined;

      const result = await ctx.newSession({
        parentSession: ctx.sessionManager.getSessionFile(),
      });

      if (result.cancelled) {
        ctx.ui.notify("New session cancelled", "info");
        return;
      }

      // Apply name if provided (session_start has already fired and reset autoNamed)
      if (name) {
        pi.setSessionName(name);
        autoNamed = true;
        ctx.ui.notify(`New session started: "${name}"`, "info");
      } else {
        ctx.ui.notify("New session started", "info");
      }
    },
  });
}
