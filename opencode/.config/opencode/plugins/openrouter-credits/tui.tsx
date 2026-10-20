/**
 * @fileoverview OpenCode CLI/TUI Plugin for OpenRouter Credits & Limits.
 * Renders in the right sidebar between Workspaces and Context with live consumption tracking.
 */

import { Plugin } from "@opencode/plugin/tui"
import { createSignal } from "solid-js"
import { OpenRouterClient } from "./api.ts"
import { resolveApiKey } from "./key-resolver.ts"
import { formatCurrency } from "./format.ts"
import type { CreditStatus, OpenRouterCreditsOptions, OpenRouterState } from "./types.ts"

function getStatusColor(status: CreditStatus, theme: any): string {
  switch (status) {
    case "ok":
      return theme.text.feedback?.success?.base || "#a6e3a1"
    case "low":
      return theme.text.feedback?.warning?.base || "#f9e2af"
    case "limit_reached":
    case "error":
      return theme.text.feedback?.error?.base || "#f38ba8"
    case "no_key":
    case "loading":
    default:
      return theme.text.muted || "#6c7086"
  }
}

export default Plugin.define({
  id: "openrouter-credits",
  setup(context) {
    const options = (context.options ?? {}) as OpenRouterCreditsOptions
    // Live polling interval: default 15 seconds
    const pollInterval = Math.max(10, options.pollIntervalSeconds ?? 15) * 1000

    const client = new OpenRouterClient()

    // Reactive state signal for sidebar component
    const [state, setState] = createSignal<OpenRouterState>({
      status: "loading",
      keyDetails: null,
      accountCredits: null,
      lastUpdated: null,
      error: null,
      apiKeyMasked: null,
    })

    // Fetches fresh data and updates state
    const fetchAndUpdate = async (forceRefresh = false): Promise<OpenRouterState> => {
      try {
        const apiKey = await resolveApiKey(options)
        const newState = await client.getState(apiKey, options, forceRefresh)
        setState(newState)
        return newState
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        const errState: OpenRouterState = {
          status: "error",
          keyDetails: state().keyDetails,
          accountCredits: state().accountCredits,
          lastUpdated: Date.now(),
          error: msg,
          apiKeyMasked: state().apiKeyMasked,
        }
        setState(errState)
        return errState
      }
    }

    // Component: Right sidebar widget (placed directly between Workspaces and Context)
    const SidebarCreditsWidget = () => {
      let rootBoxRef: any = null

      const repositionAboveContext = () => {
        try {
          if (!rootBoxRef) return
          let curr = rootBoxRef.parent
          while (curr) {
            const parent = curr.parent
            if (parent) {
              const children: any[] =
                typeof parent.getChildren === "function"
                  ? parent.getChildren()
                  : (parent._childrenInLayoutOrder ?? [])

              if (Array.isArray(children)) {
                // Find the child representing Context
                const contextChild = children.find((c: any) => {
                  if (c === curr) return false
                  const id = (c?.id || "").toLowerCase()
                  const name = (c?.constructor?.name || "").toLowerCase()
                  if (id.includes("context") || name.includes("context")) return true
                  const kids = typeof c?.getChildren === "function" ? c.getChildren() : []
                  return (
                    Array.isArray(kids) &&
                    kids.some((k: any) => {
                      const kId = (k?.id || "").toLowerCase()
                      const kText = typeof k?.text === "string" ? k.text.toLowerCase() : ""
                      return kId.includes("context") || kText.includes("context")
                    })
                  )
                })

                if (contextChild && typeof parent.insertBefore === "function") {
                  const myIndex = children.indexOf(curr)
                  const contextIndex = children.indexOf(contextChild)
                  if (myIndex !== contextIndex - 1) {
                    parent.insertBefore(curr, contextChild)
                    if (typeof parent.requestRender === "function") {
                      parent.requestRender()
                    }
                  }
                  break
                }
              }
            }
            curr = curr.parent
          }
        } catch {}
      }

      // Schedule repositioning on mount and updates
      const scheduleReposition = () => {
        setTimeout(repositionAboveContext, 0)
        setTimeout(repositionAboveContext, 50)
        setTimeout(repositionAboveContext, 200)
      }

      const st = () => state()
      const details = () => st().keyDetails
      const statusColor = () => getStatusColor(st().status, context.theme)

      // Format dynamic interval limit: Weekly / Monthly / Daily / Limit: $remaining / $key_limit
      const resetLimitText = () => {
        const d = details()
        if (!d) return "Limit: Checking…"
        if (d.limit === null || d.limit === undefined) {
          return "Limit: Unlimited"
        }
        const rem = formatCurrency(d.limitRemaining)
        const lim = formatCurrency(d.limit)
        const prefix = d.limitReset
          ? d.limitReset.charAt(0).toUpperCase() + d.limitReset.slice(1).toLowerCase()
          : "Limit"
        return `${prefix}: ${rem} / ${lim}`
      }

      // Format Spend: $today today • $total total
      const spendText = () => {
        const d = details()
        const today = formatCurrency(d?.usageDaily ?? 0)
        const total = formatCurrency(d?.usage ?? 0)
        return `Spend: ${today} today • ${total} total`
      }

      // Format Credit: $available available
      const creditText = () => {
        const ac = st().accountCredits
        if (ac) {
          return `Credit: ${formatCurrency(ac.remainingCredits)} available`
        }
        return "Credit: Checking…"
      }

      const creditColor = () => {
        const ac = st().accountCredits
        if (ac && ac.remainingCredits <= (options.lowCreditThresholdUsd ?? 2.0)) {
          return getStatusColor("low", context.theme)
        }
        return context.theme.text.base
      }

      return (
        <box
          ref={(el: any) => {
            rootBoxRef = el
            scheduleReposition()
          }}
          flexDirection="column"
          gap={0}
          paddingBottom={1}
        >
          {/* Header row */}
          <box flexDirection="row">
            <text fg={context.theme.text.base}>
              <b>OpenRouter</b>
            </text>
          </box>

          {/* Details list */}
          <box flexDirection="column" paddingLeft={1} gap={0}>
            {st().status === "no_key" ? (
              <text fg={context.theme.text.muted}>
                No API key configured
              </text>
            ) : st().status === "error" ? (
              <text fg={statusColor()}>
                {st().error ? (st().error!.length > 30 ? st().error!.slice(0, 28) + "…" : st().error) : "API check failed"}
              </text>
            ) : st().status === "loading" ? (
              <text fg={context.theme.text.muted}>
                Checking credits…
              </text>
            ) : (
              <>
                {/* Line 1: Weekly / Monthly / Daily: $remaining / $key_limit */}
                <text fg={statusColor()} wrapMode="none">
                  {resetLimitText()}
                </text>

                {/* Line 2: Keep Spend line */}
                <text fg={context.theme.text.muted} wrapMode="none">
                  {spendText()}
                </text>

                {/* Line 3: Credit: TOTAL_ACCOUNT_CREDIT_AVAILABLE */}
                <text fg={creditColor()} wrapMode="none">
                  {creditText()}
                </text>

                {/* Warning row if limit reached or low */}
                {st().status === "limit_reached" ? (
                  <text fg={statusColor()}>
                    <b>⚠️ Limit reached! Requests will fail.</b>
                  </text>
                ) : st().status === "low" ? (
                  <text fg={statusColor()}>
                    ⚠️ Low credits remaining
                  </text>
                ) : null}
              </>
            )}
          </box>
        </box>
      )
    }

    // Register ONLY the sidebar slot (between Workspaces and Context)
    const removeSidebarSlot = context.ui.slot({
      prepend: "sidebar.content",
      render: () => <SidebarCreditsWidget />,
    })

    // Initial fetch & background poll
    void fetchAndUpdate()
    const timer = setInterval(() => void fetchAndUpdate(), pollInterval)

    // Live consumption refresh on token/model activity
    let liveRefreshTimeout: NodeJS.Timeout | null = null

    const triggerLiveConsumptionRefresh = () => {
      client.invalidateCache()
      if (liveRefreshTimeout) {
        clearTimeout(liveRefreshTimeout)
      }
      // Immediate/fast poll 700ms after step/response finishes
      liveRefreshTimeout = setTimeout(() => {
        void fetchAndUpdate(true)
      }, 700)

      // Secondary sync 2500ms later to capture eventual ledger settlement
      setTimeout(() => {
        void fetchAndUpdate(true)
      }, 2500)
    }

    const unlisten = context.data.listen(({ details: event }) => {
      const type = event?.type
      if (
        type === "session.execution.succeeded" ||
        type === "session.step.ended" ||
        type === "session.usage.updated" ||
        type === "session.idle"
      ) {
        triggerLiveConsumptionRefresh()
      }
    })

    return () => {
      clearInterval(timer)
      if (liveRefreshTimeout) clearTimeout(liveRefreshTimeout)
      unlisten()
      removeSidebarSlot?.()
    }
  },
})
