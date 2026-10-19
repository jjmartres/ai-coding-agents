import { Plugin } from "@opencode/plugin/tui"
import path from "node:path"
import { createSignal, onCleanup, For } from "solid-js"

interface SessionItem {
  id: string
  title: string
  status: "question" | "permission" | "running" | "idle"
  isCurrent: boolean
}

interface ProjectGroup {
  id: string
  name: string
  path: string
  sessions: SessionItem[]
}

export default Plugin.define({
  id: "workspace-manager",
  setup(context) {
    const setTerminalTitle = (title: string) => {
      try {
        process.stdout.write(`\x1b]0;${title}\x07`)
      } catch {
        // Ignore write failures
      }
    }

    const getCurrentWorkspace = (): string => {
      try {
        const route = context.ui.router.current()
        if (route.type === "session" && route.sessionID) {
          const session = context.data.session.get(route.sessionID)
          if (session?.projectID) {
            const project = context.data.project.get(session.projectID)
            if (project) {
              return project.name || path.basename(project.canonical)
            }
          }
        }
      } catch {}
      return path.basename(process.cwd())
    }

    const getCurrentSessionTitle = (): string | undefined => {
      try {
        const route = context.ui.router.current()
        if (route.type === "session" && route.sessionID) {
          const session = context.data.session.get(route.sessionID)
          return session?.title?.trim()
        }
      } catch {}
      return undefined
    }

    const syncTitle = () => {
      const workspace = getCurrentWorkspace()
      const sessionTitle = getCurrentSessionTitle()

      const fullTitle =
        sessionTitle && sessionTitle.length > 0
          ? `OC - ${workspace} - ${sessionTitle}`
          : `OC - ${workspace}`

      setTerminalTitle(fullTitle)
    }

    syncTitle()
    const titleInterval = setInterval(syncTitle, 1000)

    const unlisten = context.data.listen(({ details: event }) => {
      if (
        event?.type === "session.updated" ||
        event?.type === "session.status" ||
        event?.type === "session.created"
      ) {
        syncTitle()
      }
    })

    const parseTime = (val: unknown): number => {
      if (typeof val === "number" && !isNaN(val)) return val
      if (val instanceof Date) return val.getTime()
      if (typeof val === "string") {
        const parsed = Date.parse(val)
        return isNaN(parsed) ? 0 : parsed
      }
      return 0
    }

    const formatPath = (p: string): string => {
      try {
        if (typeof (context.ui as any).format?.path === "function") {
          return (context.ui as any).format.path(p)
        }
      } catch {}
      try {
        const home = process.env.HOME || ""
        if (home && (p === home || p.startsWith(home + "/"))) {
          return "~" + p.slice(home.length)
        }
      } catch {}
      return p
    }

    const isFullwidth = (cp: number): boolean => {
      return (
        (cp >= 0x1100 && cp <= 0x115f) ||
        cp === 0x2329 ||
        cp === 0x232a ||
        (0x2e80 <= cp && cp <= 0x3247 && cp !== 0x303f) ||
        (0x3250 <= cp && cp <= 0x4dbf) ||
        (0x4e00 <= cp && cp <= 0xa4c6) ||
        (0xa960 <= cp && cp <= 0xa97c) ||
        (0xac00 <= cp && cp <= 0xd7a3) ||
        (0xf900 <= cp && cp <= 0xfaff) ||
        (0xfe10 <= cp && cp <= 0xfe19) ||
        (0xfe30 <= cp && cp <= 0xfe6f) ||
        (0xff00 <= cp && cp <= 0xff60) ||
        (0xffe0 <= cp && cp <= 0xffe6) ||
        (0x1f000 <= cp && cp <= 0x1faff) ||
        (0x2600 <= cp && cp <= 0x27bf)
      )
    }

    const stripAnsi = (str: string): string => {
      return str.replace(/\x1b\[[0-9;]*m/g, "")
    }

    const visualWidth = (str: string): number => {
      const clean = stripAnsi(str)
      let width = 0
      for (const ch of [...clean]) {
        const cp = ch.codePointAt(0) || 0
        if (cp >= 0xfe00 && cp <= 0xfe0f) continue
        width += isFullwidth(cp) ? 2 : 1
      }
      return width
    }

    const getDotThemeColor = (
      status: "running" | "attention" | "idle"
    ): string => {
      if (status === "running") {
        return (context.theme as any).text.feedback?.success?.base || "#a6e3a1"
      }
      if (status === "attention") {
        return (context.theme as any).text.feedback?.error?.base || "#f38ba8"
      }
      return context.theme.text.muted
    }

    const padEndVisual = (str: string, targetWidth: number): string => {
      const current = visualWidth(str)
      if (current >= targetWidth) return str
      return str + " ".repeat(targetWidth - current)
    }

    const padStartVisual = (str: string, targetWidth: number): string => {
      const current = visualWidth(str)
      if (current >= targetWidth) return str
      return " ".repeat(targetWidth - current) + str
    }

    const getSessionTimestamp = (session: any): number => {
      if (!session) return 0
      const time = session.time
      if (!time) return 0
      const updated = parseTime(time.updated)
      const created = parseTime(time.created)
      return updated || created || 0
    }

    const getProjectTimestamp = (
      project: any,
      projectSessions: any[]
    ): number => {
      let latest = 0
      for (const s of projectSessions) {
        const t = getSessionTimestamp(s)
        if (t > latest) latest = t
      }
      const pTime = project?.time
      if (pTime) {
        const updated = parseTime(pTime.updated)
        const active = parseTime(pTime.active)
        const created = parseTime(pTime.created)
        latest = Math.max(latest, updated, active, created)
      }
      return latest
    }

    const getProjectGroups = (options?: {
      maxProjects?: number
      maxSessionsPerProject?: number
    }): ProjectGroup[] => {
      try {
        const projects = context.data.project.list() || []
        const allSessions = context.data.session.list() || []
        const currentRoute = context.ui.router.current()
        const currentSessionId =
          currentRoute.type === "session" ? currentRoute.sessionID : undefined

        let currentProjectId: string | undefined
        if (currentSessionId) {
          try {
            const currentSession = context.data.session.get(currentSessionId)
            currentProjectId = currentSession?.projectID
          } catch {}
        }
        if (!currentProjectId) {
          try {
            const cwd = process.cwd()
            if (cwd) {
              const matching = projects.find(
                (p) => path.resolve(p.canonical) === path.resolve(cwd)
              )
              if (matching) currentProjectId = matching.id
            }
          } catch {}
        }

        const projectWithStats = projects
          .map((project) => {
            const projectSessions = allSessions.filter(
              (s) => s.projectID === project.id
            )
            const isCurrentProject = project.id === currentProjectId
            const latestTime = getProjectTimestamp(project, projectSessions)

            return {
              project,
              projectSessions,
              isCurrentProject,
              latestTime,
            }
          })
          .filter((p) => p.projectSessions.length > 0)

        // Sort projects by recency (with current workspace prioritized)
        projectWithStats.sort((a, b) => {
          if (a.isCurrentProject && !b.isCurrentProject) return -1
          if (!a.isCurrentProject && b.isCurrentProject) return 1
          return b.latestTime - a.latestTime
        })

        const targetProjects =
          options?.maxProjects !== undefined
            ? projectWithStats.slice(0, options.maxProjects)
            : projectWithStats

        return targetProjects.map((pGroup) => {
          // Sort sessions by recency (with current session prioritized)
          const sortedSessions = [...pGroup.projectSessions].sort((a, b) => {
            const isCurrentA = a.id === currentSessionId
            const isCurrentB = b.id === currentSessionId
            if (isCurrentA && !isCurrentB) return -1
            if (!isCurrentA && isCurrentB) return 1

            return getSessionTimestamp(b) - getSessionTimestamp(a)
          })

          const selectedSessions =
            options?.maxSessionsPerProject !== undefined
              ? sortedSessions.slice(0, options.maxSessionsPerProject)
              : sortedSessions

          const sessionItems: SessionItem[] = selectedSessions.map((session) => {
            let status: "question" | "permission" | "running" | "idle" = "idle"

            try {
              const forms = context.data.session.form.list(session.id)
              const perms = context.data.session.permission.list(session.id)
              const isRunning =
                context.data.session.status(session.id) === "running"

              if (forms && forms.length > 0) {
                status = "question"
              } else if (perms && perms.length > 0) {
                status = "permission"
              } else if (isRunning) {
                status = "running"
              }
            } catch {}

            return {
              id: session.id,
              title: session.title || "Untitled",
              status,
              isCurrent: session.id === currentSessionId,
            }
          })

          const statusOrder = { question: 0, permission: 1, running: 2, idle: 3 }
          sessionItems.sort((a, b) => {
            if (statusOrder[a.status] !== statusOrder[b.status]) {
              return statusOrder[a.status] - statusOrder[b.status]
            }
            if (a.isCurrent && !b.isCurrent) return -1
            if (!a.isCurrent && b.isCurrent) return 1
            return 0
          })

          return {
            id: pGroup.project.id,
            name: pGroup.project.name || path.basename(pGroup.project.canonical),
            path: pGroup.project.canonical,
            sessions: sessionItems,
          }
        })
      } catch {
        return []
      }
    }

    const openWorkspacePicker = async () => {
      try {
        const projects = context.data.project.list() || []
        const sessions = context.data.session.list() || []

        if (projects.length === 0) {
          context.ui.toast.show({
            title: "Workspaces",
            message: "No registered projects found in OpenCode daemon.",
            variant: "warning",
          })
          return
        }

        // Sort all projects by latest activity descending so recent workspaces appear first,
        // but keep ALL workspaces available in the dialog.
        const sortedProjects = [...projects].sort((a, b) => {
          const aSessions = sessions.filter((s) => s.projectID === a.id)
          const bSessions = sessions.filter((s) => s.projectID === b.id)
          const aTime = getProjectTimestamp(a, aSessions)
          const bTime = getProjectTimestamp(b, bSessions)
          return bTime - aTime
        })

        const rawProjects = sortedProjects.map((p) => {
          const pSessions = sessions.filter((s) => s.projectID === p.id)
          let needsAnswer = 0
          let needsPerm = 0
          let running = 0

          for (const s of pSessions) {
            try {
              if ((context.data.session.form.list(s.id)?.length || 0) > 0) needsAnswer++
              if ((context.data.session.permission.list(s.id)?.length || 0) > 0) needsPerm++
              if (context.data.session.status(s.id) === "running") running++
            } catch {}
          }

          const name = p.name || path.basename(p.canonical) || p.id
          const maxNameColWidth = 28
          const displayName =
            name.length > maxNameColWidth
              ? name.slice(0, maxNameColWidth - 2) + "…"
              : name

          let dot = "○"
          let statusKind: "running" | "attention" | "idle" = "idle"
          if (running > 0) {
            dot = "●"
            statusKind = "running"
          } else if (needsAnswer > 0 || needsPerm > 0) {
            dot = "●"
            statusKind = "attention"
          }

          const dotColor = getDotThemeColor(statusKind)
          const nameCol = padEndVisual(`📁 ${displayName}`, maxNameColWidth + 3)
          const footer = `${pSessions.length} session${pSessions.length === 1 ? "" : "s"}`
          const pathStr = formatPath(p.canonical)

          return {
            id: p.id,
            name,
            dot,
            dotColor,
            nameCol,
            pathStr,
            footer,
          }
        })

        const maxFooterWidth = Math.max(0, ...rawProjects.map((r) => visualWidth(r.footer)))

        const projectOptions = rawProjects.map((r) => ({
          title: `${r.dot}  ${r.nameCol}`,
          titleView: () => (
            <span>
              <span style={{ fg: r.dotColor }}>{r.dot}</span>
              {`  ${r.nameCol}`}
            </span>
          ),
          value: r.id,
          searchText: `${r.name} ${r.pathStr}`,
          description: r.pathStr,
          footer: padStartVisual(r.footer, maxFooterWidth),
          truncateTitle: false,
        }))

        const selectPromise = context.ui.dialog.select({
          title: "Workspaces (Projects)",
          placeholder: "Select workspace to view sessions or switch...",
          options: projectOptions,
        })
        try {
          context.ui.dialog.set({ size: "xlarge" })
        } catch {}
        setTimeout(() => {
          try {
            context.ui.dialog.set({ size: "xlarge" })
          } catch {}
        }, 0)

        const selectedProjectId = await selectPromise

        if (!selectedProjectId) return

        const project = context.data.project.get(selectedProjectId)
        if (!project) return

        const projectName = project.name || path.basename(project.canonical)
        const projectSessions = sessions.filter((s) => s.projectID === project.id)

        // Sort all sessions by latest timestamp descending so recent sessions appear first,
        // but keep ALL sessions in this workspace available in the dialog.
        const sortedProjectSessions = [...projectSessions].sort((a, b) => {
          return getSessionTimestamp(b) - getSessionTimestamp(a)
        })

        const rawSessions = sortedProjectSessions.map((s) => {
          let dot = "○"
          let statusKind: "running" | "attention" | "idle" = "idle"
          let footer = "Idle"

          try {
            const forms = context.data.session.form.list(s.id)
            const perms = context.data.session.permission.list(s.id)
            const isRunning = context.data.session.status(s.id) === "running"

            if (forms && forms.length > 0) {
              dot = "●"
              statusKind = "attention"
              footer = "Needs Answer!"
            } else if (perms && perms.length > 0) {
              dot = "●"
              statusKind = "attention"
              footer = "Needs Permission!"
            } else if (isRunning) {
              dot = "●"
              statusKind = "running"
              footer = "Running"
            }
          } catch {}

          const dotColor = getDotThemeColor(statusKind)
          const sessionTitle = s.title || "Untitled Session"

          return {
            id: s.id,
            dot,
            dotColor,
            sessionTitle,
            description: `Session ${s.id.slice(0, 12)}...`,
            footer,
          }
        })

        const newSessionActionTitle = "✨ Start new session in this workspace"
        const maxSessionFooterWidth = Math.max(
          0,
          ...rawSessions.map((r) => visualWidth(r.footer))
        )

        const sessionOptions = [
          {
            title: newSessionActionTitle,
            value: "__NEW_SESSION__",
            description: formatPath(project.canonical),
            footer: padStartVisual("", maxSessionFooterWidth),
            truncateTitle: false,
          },
          ...rawSessions.map((s) => ({
            title: `${s.dot}  ${s.sessionTitle}`,
            titleView: () => (
              <span>
                <span style={{ fg: s.dotColor }}>{s.dot}</span>
                {`  ${s.sessionTitle}`}
              </span>
            ),
            value: s.id,
            description: s.description,
            footer: padStartVisual(s.footer, maxSessionFooterWidth),
            footerColor: s.dotColor,
            truncateTitle: false,
          })),
        ]

        const selectActionPromise = context.ui.dialog.select({
          title: `📁 ${projectName} — Sessions`,
          placeholder: "Select a session to open, or start a new one...",
          options: sessionOptions,
        })
        try {
          context.ui.dialog.set({ size: "xlarge" })
        } catch {}
        setTimeout(() => {
          try {
            context.ui.dialog.set({ size: "xlarge" })
          } catch {}
        }, 0)

        const pickedAction = await selectActionPromise

        if (!pickedAction) return

        if (pickedAction === "__NEW_SESSION__") {
          try {
            const res = await context.client.session.create({
              location: { directory: project.canonical },
            })
            const newSessionId = (res as any)?.data?.id ?? (res as any)?.id
            if (newSessionId) {
              context.ui.router.navigate({ type: "session", sessionID: newSessionId })
              syncTitle()
            }
          } catch (err: any) {
            context.ui.toast.show({
              title: "Workspace",
              message: `Failed to create session: ${err?.message || err}`,
              variant: "error",
            })
          }
        } else {
          context.ui.router.navigate({ type: "session", sessionID: pickedAction })
          syncTitle()
        }
      } catch (err) {
        // Safe error handling for picker
      }
    }

    // Sidebar widget for right pane
    const SidebarWorkspacesWidget = () => {
      let rootBoxRef: any = null
      const [groups, setGroups] = createSignal<ProjectGroup[]>([])

      const removeUpperSessionTitle = () => {
        try {
          if (!rootBoxRef) return
          let curr = rootBoxRef.parent
          while (curr) {
            const parent = curr.parent
            if (parent) {
              const children: any[] =
                typeof parent.getChildren === "function"
                  ? parent.getChildren()
                  : parent._childrenInLayoutOrder

              if (Array.isArray(children)) {
                const currIdx = children.indexOf(curr)
                const hasScrollbox =
                  typeof (curr as any)?.scrollTo === "function" ||
                  curr?.constructor?.name?.toLowerCase().includes("scroll") ||
                  children.some((c: any) => typeof c?.scrollTo === "function")

                for (let i = 0; i < children.length; i++) {
                  const child = children[i]
                  if (child === curr) continue

                  const childKids: any[] =
                    typeof child.getChildren === "function"
                      ? child.getChildren()
                      : child._childrenInLayoutOrder

                  const isTitleBox =
                    child?.id?.toLowerCase().includes("title") ||
                    child?.constructor?.name?.toLowerCase().includes("shimmer") ||
                    (Array.isArray(childKids) &&
                      childKids.some(
                        (k: any) =>
                          k?.id?.toLowerCase().includes("title") ||
                          k?.constructor?.name?.toLowerCase().includes("shimmer") ||
                          k?.rename !== undefined
                      )) ||
                    (hasScrollbox && currIdx > 0 && i < currIdx)

                  if (isTitleBox) {
                    child.visible = false
                    child.height = 0
                    child.paddingTop = 0
                    child.paddingBottom = 0
                    if (typeof child.yogaNode?.setDisplay === "function") {
                      try {
                        child.yogaNode.setDisplay(0)
                      } catch {}
                    }
                    if (typeof parent.remove === "function") {
                      try {
                        parent.remove(child)
                      } catch {}
                    }
                    if (typeof parent.requestRender === "function") {
                      try {
                        parent.requestRender()
                      } catch {}
                    }
                  }
                }
              }
            }
            curr = curr.parent
          }
        } catch {}
      }

      const refresh = () => {
        try {
          setGroups(getProjectGroups({ maxProjects: 3, maxSessionsPerProject: 3 }))
          removeUpperSessionTitle()
        } catch {}
      }
      refresh()
      const timer = setInterval(refresh, 1500)
      onCleanup(() => clearInterval(timer))

      const getStatusColor = (session: SessionItem) => {
        switch (session.status) {
          case "running":
            return (context.theme as any).text.feedback?.success?.base || "#a6e3a1"
          case "question":
          case "permission":
            return (context.theme as any).text.feedback?.error?.base || "#f38ba8"
          case "idle":
          default:
            return session.isCurrent
              ? context.theme.text.base
              : context.theme.text.muted
        }
      }

      const getStatusDot = (status: SessionItem["status"]) => {
        switch (status) {
          case "running":
            return "●"
          case "question":
          case "permission":
            return "●"
          case "idle":
          default:
            return "○"
        }
      }

      return (
        <box
          ref={(el: any) => {
            rootBoxRef = el
            setTimeout(removeUpperSessionTitle, 0)
          }}
          flexDirection="column"
          gap={0}
          paddingBottom={1}
        >
          <box flexDirection="row">
            <text fg={context.theme.text.base} bold>
              <b>Workspaces</b>
            </text>
          </box>

          <For each={groups()}>
            {(group, index) => (
              <box
                flexDirection="column"
                paddingLeft={1}
                gap={0}
                paddingTop={index() > 0 ? 1 : 0}
              >
                <text fg={context.theme.text.base} bold>
                  <b>📁 {group.name}</b>
                </text>
                <For each={group.sessions}>
                  {(session) => (
                    <box
                      flexDirection="row"
                      gap={1}
                      paddingLeft={1}
                      onMouseDown={() => {
                        try {
                          context.ui.router.navigate({
                            type: "session",
                            sessionID: session.id,
                          })
                        } catch {}
                      }}
                    >
                      <text fg={getStatusColor(session)} bold={session.isCurrent}>
                        {session.isCurrent ? (
                          <b>{getStatusDot(session.status)}</b>
                        ) : (
                          getStatusDot(session.status)
                        )}
                      </text>
                      <text
                        fg={getStatusColor(session)}
                        bold={session.isCurrent}
                        wrapMode="none"
                      >
                        {session.isCurrent ? (
                          <b>
                            {session.title.length > 30
                              ? session.title.slice(0, 28) + "…"
                              : session.title}
                          </b>
                        ) : (
                          session.title.length > 30
                            ? session.title.slice(0, 28) + "…"
                            : session.title
                        )}
                      </text>
                    </box>
                  )}
                </For>
              </box>
            )}
          </For>
        </box>
      )
    }

    const removeSidebarSlot = context.ui.slot({
      prepend: "sidebar.content",
      render: () => <SidebarWorkspacesWidget />,
    })

    // Prompt footer badge with mounted keymap layer
    const WorkspaceBadge = () => {
      // Safely register keymap layer inside the component tree where Keymap.Provider is mounted
      try {
        context.keymap.layer(() => ({
          mode: "global",
          commands: [
            {
              id: "workspace.picker",
              title: "Switch Workspace / Project",
              description: "Open the project workspace selector",
              bind: "ctrl+w",
              palette: true,
              slash: {
                name: "workspace",
                aliases: ["ws", "projects"],
              },
              run: async () => {
                await openWorkspacePicker()
              },
            },
          ],
        }))
      } catch {}

      const [ws, setWs] = createSignal(getCurrentWorkspace())
      const timer = setInterval(() => setWs(getCurrentWorkspace()), 1000)
      onCleanup(() => clearInterval(timer))

      return (
        <box
          flexDirection="row"
          flexShrink={0}
          paddingRight={1}
          onMouseDown={() => openWorkspacePicker()}
        >
          <text fg={context.theme.text.muted} wrapMode="none">
            📁 {ws()}
          </text>
        </box>
      )
    }

    const removeFooterSlot = context.ui.slot({
      append: "prompt.footer",
      render: () => <WorkspaceBadge />,
    })

    return () => {
      clearInterval(titleInterval)
      unlisten()
      removeSidebarSlot?.()
      removeFooterSlot?.()
      setTerminalTitle("")
    }
  },
})
