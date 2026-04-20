/**
 * @fileoverview Skill Searcher Extension.
 *
 * Augments the pi input editor with a `$`-triggered skill picker. Typing `$`
 * (optionally followed by a query, e.g. `$cav`) in the editor instantly opens
 * a `SelectList` overlay showing all registered skills filtered by the query.
 *
 * The overlay uses the same `ctx.ui.custom()` + `SelectList` mechanism as
 * `/session-delete`, so arrow-key navigation works reliably across all terminals.
 *
 * Keybindings while the hint line is visible (editor):
 *   `Esc` — dismiss the hint without opening the picker.
 *
 * Keybindings inside the picker overlay:
 *   `↑` / `↓`      — navigate
 *   `Enter` / `Esc` — close (browse-only, no insertion)
 *
 * The picker is browse-only: selecting or dismissing returns the user to the
 * editor without modifying its content.
 */

import {
  CustomEditor,
  DynamicBorder,
  type ExtensionAPI,
  type KeybindingsManager,
} from "@mariozechner/pi-coding-agent";
import {
  Container,
  matchesKey,
  type SelectItem,
  SelectList,
  Text,
  truncateToWidth,
  type EditorTheme,
  type TUI,
} from "@mariozechner/pi-tui";

// ── Types ────────────────────────────────────────────────────────────────────

type CommandEntry = ReturnType<ExtensionAPI["getCommands"]>[number];

type SkillEntry = {
  commandName: string;
  skillName: string;
  description?: string;
  path: string;
  scope?: string;
};

type TriggerMatch = {
  start: number;
  end: number;
  query: string;
};

// ── Skill helpers ─────────────────────────────────────────────────────────────

/**
 * Converts a pi command entry to a `SkillEntry` if the command originates
 * from a skill source.
 *
 * @param command - A command entry from `pi.getCommands()`.
 * @returns A `SkillEntry`, or `null` when the command is not a skill.
 */
function toSkillEntry(command: CommandEntry): SkillEntry | null {
  if (command.source !== "skill") return null;
  const skillName = command.name.startsWith("skill:")
    ? command.name.slice(6)
    : command.name;
  return {
    commandName: command.name,
    skillName,
    description: command.description,
    path: command.sourceInfo.path,
    scope: command.sourceInfo.scope,
  };
}

/**
 * Sorts and filters a skill list by relevance to `query`.
 *
 * Scoring (ascending = higher relevance):
 *   0 — exact name match
 *   1 — name starts with query
 *   2 — name contains query
 *   3 — description contains query
 *   99 — no match (excluded)
 *
 * @param skills - Full list of available skill entries.
 * @param query  - Search string (empty string returns all, sorted alphabetically).
 * @returns Filtered and sorted skill list.
 */
function sortSkills(skills: SkillEntry[], query: string): SkillEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...skills].sort((a, b) => a.skillName.localeCompare(b.skillName));

  const score = (s: SkillEntry): number => {
    const name = s.skillName.toLowerCase();
    const desc = (s.description ?? "").toLowerCase();
    if (name === q) return 0;
    if (name.startsWith(q)) return 1;
    if (name.includes(q)) return 2;
    if (desc.includes(q)) return 3;
    return 99;
  };

  return skills
    .filter((s) => score(s) < 99)
    .sort((a, b) => score(a) - score(b) || a.skillName.localeCompare(b.skillName));
}

// ── Trigger detection ─────────────────────────────────────────────────────────

/**
 * Converts a line/column cursor position to an absolute character offset.
 *
 * @param text - Full editor text.
 * @param line - Zero-based line index.
 * @param col  - Zero-based column index within the line.
 * @returns Absolute character offset from the start of `text`.
 */
function getCursorOffset(text: string, line: number, col: number): number {
  const lines = text.split("\n");
  let offset = col;
  for (let i = 0; i < line; i++) offset += (lines[i]?.length ?? 0) + 1;
  return offset;
}

/**
 * Detects a `$token` trigger at the current cursor position.
 *
 * A trigger is any whitespace-bounded token that starts with `$`. The token
 * extends from the last whitespace before `cursorOffset` to the next
 * whitespace after it.
 *
 * @param text         - Full editor text.
 * @param cursorOffset - Absolute cursor offset within `text`.
 * @returns A `TriggerMatch` describing the token boundaries and query string,
 *          or `null` when the cursor is not inside a `$` token.
 */
function findTriggerAtCursor(text: string, cursorOffset: number): TriggerMatch | null {
  let start = cursorOffset;
  while (start > 0 && !/\s/.test(text[start - 1] ?? "")) start--;

  const tokenPrefix = text.slice(start, cursorOffset);
  if (!tokenPrefix.startsWith("$")) return null;

  let end = cursorOffset;
  while (end < text.length && !/\s/.test(text[end] ?? "")) end++;

  const fullToken = text.slice(start, end);
  if (!fullToken.startsWith("$")) return null;

  return { start, end, query: fullToken.slice(1) };
}

// ── Editor ────────────────────────────────────────────────────────────────────

class SkillSearchEditor extends CustomEditor {
  private readonly editorTheme: EditorTheme;
  private readonly getSkills: () => SkillEntry[];
  private readonly onTabTrigger: (trigger: TriggerMatch) => void;
  private activeTrigger: TriggerMatch | null = null;
  private dismissedAt: number | null = null; // cursor offset where trigger was dismissed

  constructor(
    tui: TUI,
    theme: EditorTheme,
    keybindings: KeybindingsManager,
    getSkills: () => SkillEntry[],
    onTabTrigger: (trigger: TriggerMatch) => void,
  ) {
    super(tui, theme, keybindings);
    this.editorTheme = theme;
    this.getSkills = getSkills;
    this.onTabTrigger = onTabTrigger;
  }

  private refreshTrigger(): void {
    const text = this.getText();
    const cursor = this.getCursor();
    const offset = getCursorOffset(text, cursor.line, cursor.col);

    const trigger = findTriggerAtCursor(text, offset);

    // Clear if no trigger or if user dismissed at this exact token position
    if (!trigger || trigger.start === this.dismissedAt) {
      this.activeTrigger = null;
      return;
    }

    this.activeTrigger = trigger;
  }

  override handleInput(data: string): void {
    if (this.activeTrigger) {
      // Esc → dismiss hint for this token
      if (matchesKey(data, "escape")) {
        this.dismissedAt = this.activeTrigger.start;
        this.activeTrigger = null;
        return;
      }
    }

    super.handleInput(data);
    this.dismissedAt = null; // any other key clears the dismiss lock

    const wasActive = this.activeTrigger !== null;
    this.refreshTrigger();

    // Auto-open picker as soon as $ trigger appears
    if (!wasActive && this.activeTrigger) {
      this.onTabTrigger(this.activeTrigger);
    }
  }

  override render(width: number): string[] {
    const lines = super.render(width);
    if (!this.activeTrigger) return lines;

    const count = sortSkills(this.getSkills(), this.activeTrigger.query).length;
    const query = this.activeTrigger.query;
    const countLabel = count === 0
      ? "no matching skills"
      : count === 1 ? "1 skill" : `${count} skills`;
    const queryLabel = query ? ` matching "${query}"` : "";

    lines.push(
      truncateToWidth(
        this.editorTheme.borderColor(
          `  $ skill search · ${countLabel}${queryLabel}  ·  esc dismiss `,
        ),
        width,
      ),
    );

    return lines;
  }
}

// ── Extension ─────────────────────────────────────────────────────────────────

export default function skillSearcherExtension(pi: ExtensionAPI) {
  const getSkills = (): SkillEntry[] =>
    pi.getCommands()
      .map(toSkillEntry)
      .filter((s): s is SkillEntry => s !== null);

  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setEditorComponent((tui, theme, keybindings) => {
      const editor = new SkillSearchEditor(
        tui,
        theme,
        keybindings,
        getSkills,
        async (trigger) => {
          // ── same SelectList mechanism as /session-delete ──────────────────
          const skills = getSkills();
          const matches = sortSkills(skills, trigger.query);

          if (matches.length === 0) {
            ctx.ui.notify("No matching skills", "warning");
            return;
          }

          const items: SelectItem[] = matches.map((s) => ({
            value: s.skillName,
            label: s.skillName,
            description: s.description,
          }));

          await ctx.ui.custom<null>(
            (tui, theme, _kb, done) => {
              const container = new Container();

              container.addChild(new DynamicBorder((s) => theme.fg("accent", s)));
              container.addChild(
                new Text(
                  theme.fg("accent", theme.bold("Skill Search")) +
                    (trigger.query
                      ? theme.fg("dim", `  — "${trigger.query}"`)
                      : ""),
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

              list.onSelect = () => done(null);
              list.onCancel = () => done(null);

              container.addChild(list);
              container.addChild(
                new Text(
                  theme.fg("dim", "↑↓ navigate  •  enter / esc close"),
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

          // Nothing to do after closing — list is browse-only
        },
      );

      return editor;
    });

    // Keep matchCount in sync so the hint stays accurate while typing
    // We piggyback on turn_end / input to refresh — editor calls refreshTrigger
    // internally, but we need to update the count from outside via getSkills().
    // The count is refreshed each time the editor re-renders (getText is live).
    ctx.ui.notify("Skill search ready: type $ to open the skill picker", "info");
  });

}
