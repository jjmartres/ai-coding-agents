import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "session-namer",
  async setup(ctx) {
    // Intercept title generation requests
    await ctx.session.hook("title", async (event) => {
      try {
        // Read current branch from vcs
        const vcsInfo = await ctx.vcs.get().catch(() => undefined)
        const branch = vcsInfo?.branch?.current

        // Determine session directory or project name
        const dirName = ctx.location?.project?.canonical
          ? ctx.location.project.canonical.split("/").filter(Boolean).pop()
          : ctx.location?.directory?.split("/").filter(Boolean).pop()

        // Extract topic or summary from initial user message if available
        let topic = ""
        const firstUserMsg = event.messages?.find((m: any) => m.role === "user")
        if (firstUserMsg && typeof firstUserMsg.content === "string") {
          topic = firstUserMsg.content
            .trim()
            .split("\n")[0]
            .replace(/[#*`]/g, "")
            .slice(0, 35)
            .trim()
        }

        // Build structured title
        const parts: string[] = []
        if (branch && branch !== "HEAD" && branch !== "main" && branch !== "master") {
          parts.push(branch)
        }
        if (topic) {
          parts.push(topic)
        }
        if (dirName) {
          parts.push(dirName)
        }

        if (parts.length > 0) {
          event.result = parts.join(" · ")
        }
      } catch {
        // Fall back gracefully to standard title generation on any unexpected failure
      }
    })
  },
})
