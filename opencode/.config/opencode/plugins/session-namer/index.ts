import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "session-namer",
  async setup(ctx) {
    // Intercept LLM title generation system prompt before the model call
    await ctx.session.hook("title", async (event) => {
      let basename = "workspace"

      try {
        const sessionInfo = await ctx.session.get({ sessionID: event.sessionID })
        const sessionDir =
          sessionInfo.location?.project?.canonical ||
          sessionInfo.location?.directory ||
          ctx.location?.project?.canonical ||
          ctx.location?.directory ||
          ""
        basename = sessionDir.split("/").filter(Boolean).pop() || "workspace"
      } catch {
        const projectPath = ctx.location?.project?.canonical || ctx.location?.directory || ""
        basename = projectPath.split("/").filter(Boolean).pop() || "workspace"
      }

      // Inject strict instructions so the LLM outputs: [<basename>] - <Action/Topic>
      event.system = [
        {
          type: "text",
          text:
            `Generate a concise, high-signal session title for the conversation.\n` +
            `The workspace/directory basename is: "${basename}".\n` +
            `Format strictly as: [${basename}] - <Action/Topic>\n` +
            `Guidelines:\n` +
            `- Describe the user's primary action, goal, or feature in 2 to 5 words (e.g. "[${basename}] - Session name plugin").\n` +
            `- Keep the total length under 50 characters.\n` +
            `- Return ONLY the raw title string with no quotes, formatting, or trailing punctuation.`,
        },
      ]
    })
  },
})
