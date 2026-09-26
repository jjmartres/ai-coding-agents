# opencode-session-namer

OpenCode V2 plugin for customized session naming conventions.

## Behavior

Hooks into the OpenCode `title` lifecycle event (`ctx.session.hook("title", ...)`):
- Retrieves the active Git branch via `ctx.vcs.get()`.
- Extracts the initial prompt intent / topic.
- Identifies the workspace / repository name.
- Generates a structured title: `<branch> · <action/topic> · <workspace>`.
- Gracefully falls back to default title generation if VCS or messages are unavailable.

## Configuration

To activate in `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "plugins": [
    "./plugins/session-namer"
  ]
}
```
