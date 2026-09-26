# opencode-session-namer

OpenCode V2 plugin for LLM-driven session naming with dynamic workspace basename prefixing.

## Convention Format

`[<basename>] - <Action/Topic>`

Example:
`[ai-coding-agents] - Session name plugin`

## How It Works

Instead of static string slicing, it hooks into OpenCode's `title` hook (`ctx.session.hook("title", ...)`).
It extracts the real workspace basename dynamically (`ctx.location.project.canonical` / `ctx.location.directory`) and configures the LLM prompt instructions so the title agent synthesizes the conversation topic while strictly enforcing `[<basename>] - <Action/Topic>`.
