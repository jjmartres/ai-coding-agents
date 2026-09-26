import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "session-namer",
  async setup(ctx) {
    // Intercept LLM title generation system prompt before the model call
    await ctx.session.hook("title", (event) => {
      // Inject strict instructions so the LLM outputs: <emoji> <Action verb> <Key target>
      event.system = [
        {
          type: "text",
          text:
            `Generate a concise, high-signal session title for the conversation following this exact format:\n` +
            `<emoji> <Action verb> <Key target>\n\n` +
            `Emoji badge guidelines:\n` +
            `- ✨ for new features, additions, or creation (e.g. ✨ Implement OAuth2 token refresh)\n` +
            `- 🐛 for bug fixes, errors, or troubleshooting (e.g. 🐛 Fix TUI resize flicker)\n` +
            `- ♻️ for refactoring, cleaning, or restructuring (e.g. ♻️ Refactor session namer hook)\n` +
            `- 🔍 for auditing, investigating, reviewing, or exploring (e.g. 🔍 Audit permission escalation policies)\n` +
            `- 📝 for documentation or notes\n` +
            `- 🚀 for deployment, releases, or performance\n\n` +
            `Rules:\n` +
            `- Start with the single most appropriate emoji badge followed by a space.\n` +
            `- Use imperative action verbs (e.g., Implement, Fix, Refactor, Add, Audit, Configure, Migrate).\n` +
            `- Keep the summary concise (3 to 6 words after the emoji).\n` +
            `- Total length MUST be under 50 characters.\n` +
            `- Return ONLY the raw title string with no quotes, markdown formatting, or trailing period.`,
        },
      ]
    })
  },
})
