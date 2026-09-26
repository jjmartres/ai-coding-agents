import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "session-namer",
  async setup(ctx) {
    // Intercept LLM title generation system prompt before the model call
    await ctx.session.hook("title", (event) => {
      // Resolve the project/workspace directory basename
      const projectPath = ctx.location?.project?.canonical || ctx.location?.directory || ""
      const basename = projectPath.split("/").filter(Boolean).pop() || "workspace"

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
            `- Keep the total length under 45 characters.\n` +
            `- Return ONLY the raw title string with no quotes, formatting, or trailing punctuation.`,
        },
      ]
    })
  },
})
