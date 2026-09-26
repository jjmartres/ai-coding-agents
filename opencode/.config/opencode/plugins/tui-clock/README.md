# TUI Clock Plugin for OpenCode V2

CLI/TUI plugin that adds a live date and 24-hour clock to the OpenCode prompt footer (`prompt.footer`), positioned to the right of the session price and token usage.

## Features

- **Date & 24-Hour Time**: Formats timestamp as `yyyy/mm/dd - hh:mm:ss` (e.g. `2026/09/26 - 17:15:30`).
- **Reactive Tick**: Updates every second using Solid.js signals.
- **Themed**: Styled using OpenCode's semantic theme token `context.theme.text.muted`.
- **Slot Placement**: Anchored to `prompt.footer` (at the right of session usage/price).

## Configuration

Loaded via `opencode/.config/opencode/cli.json`:

```json
{
  "plugins": [
    "./plugins/tui-clock"
  ]
}
```
