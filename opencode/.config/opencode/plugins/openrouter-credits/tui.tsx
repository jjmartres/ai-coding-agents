/**
 * @fileoverview OpenCode CLI/TUI Plugin for OpenRouter Credits & Limits.
 * Renders in the right sidebar between Workspaces and Context,
 * and provides the `/openrouter` interactive dashboard.
 */

import { Plugin } from "@opencode/plugin/tui"
import { createSignal, onCleanup } from "solid-js"
import { OpenRouterClient } from "./api.ts"
import { maskApiKey, resolveApiKey, saveApiKeyToAuth } from "./key-resolver.ts"
import {
  formatBadgeText,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatResetInterval,
  getStatusEmoji,
  getStatusLabel,
} from "./format.ts"
import type { CreditStatus, OpenRouterCreditsOptions, OpenRouterState } from "./types.ts"

function getStatusColor(status: CreditStatus, theme: any): string {
  switch (status) {
    case "ok":
      return theme.text.feedback?.success?.base || "#a6e3a1"
    case "low":
      return theme.text.feedback?.warning?.base || "#f9e2af"
    case "limit_reached":
      return theme.text.feedback?.error?.base || "#f38ba8"
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
    const pollInterval = Math.max(15, options.pollIntervalSeconds ?? 60) * 1000

    const client = new OpenRouterClient()

    // Reactive signals for TUI components
    const [state, setState] = createSignal<OpenRouterState>({
      status: "loading",
      keyDetails: null,
      accountCredits: null,
      lastUpdated: null,
      error: null,
      apiKeyMasked: null,
    })

    let previousStatus: CreditStatus | null = null

    // Fetches and updates state, notifying user on critical status transitions
    const fetchAndUpdate = async (forceRefresh = false): Promise<OpenRouterState> => {
      try {
        const apiKey = await resolveApiKey(options)
        const newState = await client.getState(apiKey, options, forceRefresh)
        setState(newState)

        // Proactive alert toasts on status transitions
        if (previousStatus !== null && previousStatus !== newState.status) {
          if (newState.status === "limit_reached") {
            context.ui.toast.show({
              title: "OpenRouter Limit Reached",
              message: "Your OpenRouter spending limit has been reached! LLM calls will fail until reset or increased.",
              variant: "error",
              duration: 8000,
            })
          } else if (newState.status === "low" && previousStatus === "ok") {
            const rem = newState.keyDetails?.limitRemaining
            context.ui.toast.show({
              title: "OpenRouter Credits Low",
              message: `Remaining credits: ${formatCurrency(rem)}. Consider adding credits soon.`,
              variant: "warning",
              duration: 5000,
            })
          }
        }
        previousStatus = newState.status

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

    // Interactive details dialog
    const openCreditsDialog = async () => {
      const current = state()
      const details = current.keyDetails
      const statusEmoji = getStatusEmoji(current.status)
      const statusText = getStatusLabel(current.status)

      interface ActionItem {
        title: string
        value: string
        category?: string
        description?: string
        disabled?: boolean
      }

      const dialogOptions: ActionItem[] = []

      // Category 1: Limits & Balance Information
      if (current.status === "no_key") {
        dialogOptions.push({
          title: "⚠️ No OpenRouter API Key Detected",
          value: "none",
          category: "Status",
          description: "Configure your API key below or via ~/.local/share/opencode/auth.json",
          disabled: true,
        })
      } else if (current.status === "error") {
        dialogOptions.push({
          title: `❌ Error: ${current.error ?? "Failed to query OpenRouter"}`,
          value: "none",
          category: "Status",
          description: `Key: ${current.apiKeyMasked ?? "unknown"}`,
          disabled: true,
        })
      } else {
        if (details?.limit !== null && details?.limit !== undefined) {
          const rem = details.limitRemaining ?? 0
          const lim = details.limit
          const spent = lim - rem
          const pct = lim > 0 ? (spent / lim) * 100 : 0
          dialogOptions.push({
            title: `Key Balance: ${formatCurrency(rem)} remaining`,
            value: "info_remaining",
            category: "Limits & Budgets",
            description: `Limit: ${formatCurrency(lim)} | Spent: ${formatCurrency(spent)} (${formatPercent(pct)})`,
            disabled: true,
          })
          dialogOptions.push({
            title: `Limit Reset: ${formatResetInterval(details.limitReset)}`,
            value: "info_reset",
            category: "Limits & Budgets",
            description: "When this key's spending limit counter resets to zero",
            disabled: true,
          })
        } else {
          dialogOptions.push({
            title: `Key Limit: Unlimited`,
            value: "info_unlimited",
            category: "Limits & Budgets",
            description: "No per-key spending cap configured on OpenRouter",
            disabled: true,
          })
        }

        if (current.accountCredits) {
          const ac = current.accountCredits
          dialogOptions.push({
            title: `Account Total Available: ${formatCurrency(ac.remainingCredits)}`,
            value: "info_account_balance",
            category: "Account-Wide Credits",
            description: `Total Purchased: ${formatCurrency(ac.totalCredits)} | Total Used: ${formatCurrency(ac.totalUsage)}`,
            disabled: true,
          })
        }

        if (details?.effectiveBudget) {
          const b = details.effectiveBudget
          dialogOptions.push({
            title: `Effective Budget (${b.scope}): ${formatCurrency(b.remaining_usd)} remaining`,
            value: "info_budget",
            category: "Guardrail & Workspace Budgets",
            description: `Cap: ${formatCurrency(b.limit_usd)} | Reset: ${formatResetInterval(b.reset_interval)}`,
            disabled: true,
          })
        }

        // Category 2: Spend Breakdown
        dialogOptions.push({
          title: `Spend Today: ${formatCurrency(details?.usageDaily ?? 0)}`,
          value: "info_spend_today",
          category: "Usage Breakdown",
          description: `This Week: ${formatCurrency(details?.usageWeekly ?? 0)} | This Month: ${formatCurrency(details?.usageMonthly ?? 0)}`,
          disabled: true,
        })
        dialogOptions.push({
          title: `Lifetime Key Spend: ${formatCurrency(details?.usage ?? 0)}`,
          value: "info_spend_total",
          category: "Usage Breakdown",
          description: `BYOK Spend: ${formatCurrency(details?.byokUsage ?? 0)} | Key: ${details?.label ?? current.apiKeyMasked}`,
          disabled: true,
        })

        if (details?.freeModelQuota) {
          const q = details.freeModelQuota
          dialogOptions.push({
            title: `Free-Model Daily Quota: ${q.remaining} / ${q.limit} requests left`,
            value: "info_free_quota",
            category: "Usage Breakdown",
            description: `${q.used} free requests used today (resets at UTC midnight)`,
            disabled: true,
          })
        }
      }

      // Category 3: Actions
      dialogOptions.push({
        title: "🔄 Refresh Credits Now",
        value: "refresh",
        category: "Actions",
        description: `Fetch latest balances from OpenRouter (last check: ${formatRelativeTime(current.lastUpdated)})`,
      })

      dialogOptions.push({
        title: "🔑 Set / Change OpenRouter API Key",
        value: "change_key",
        category: "Actions",
        description: "Save a new OpenRouter API key into OpenCode credentials",
      })

      dialogOptions.push({
        title: "🌐 View OpenRouter Dashboard",
        value: "dashboard",
        category: "Actions",
        description: "Open https://openrouter.ai/settings/keys to manage limits and billing",
      })

      dialogOptions.push({
        title: "❌ Close",
        value: "close",
        category: "Actions",
        description: "Dismiss this dialog",
      })

      try {
        context.ui.dialog.set({ size: "large", centered: true })
      } catch {}

      const selected = await context.ui.dialog.select({
        title: `${statusEmoji} OpenRouter: ${statusText} (${details?.label ?? current.apiKeyMasked ?? "No key"})`,
        placeholder: "Select an action...",
        options: dialogOptions,
      })

      if (!selected || selected === "close") return

      if (selected === "refresh") {
        client.invalidateCache()
        const refreshed = await fetchAndUpdate(true)
        context.ui.toast.show({
          title: "OpenRouter Credits",
          message: `Refreshed: ${formatBadgeText(refreshed, "detailed")}`,
          variant: refreshed.status === "error" ? "error" : "success",
        })
        // Re-open dialog to view updated figures
        await openCreditsDialog()
      } else if (selected === "change_key") {
        const inputKey = await context.ui.dialog.prompt({
          title: "Enter OpenRouter API Key",
          placeholder: "sk-or-v1-...",
          description: "Your key will be securely saved in ~/.local/share/opencode/auth.json",
        })

        if (inputKey && inputKey.trim().length > 0) {
          try {
            // Validate key against OpenRouter API before persisting
            const testDetails = await client.fetchKeyDetails(inputKey.trim())
            const saved = await saveApiKeyToAuth(inputKey.trim())
            if (saved) {
              client.invalidateCache()
              await fetchAndUpdate(true)
              context.ui.toast.show({
                title: "OpenRouter Connected",
                message: `Successfully connected key "${testDetails.label}"!`,
                variant: "success",
              })
              await openCreditsDialog()
            } else {
              context.ui.toast.show({
                title: "Save Failed",
                message: "Could not write to ~/.local/share/opencode/auth.json",
                variant: "error",
              })
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            context.ui.toast.show({
              title: "Invalid API Key",
              message: msg,
              variant: "error",
            })
          }
        }
      } else if (selected === "dashboard") {
        await context.ui.dialog.alert({
          title: "OpenRouter Management",
          message:
            "Visit https://openrouter.ai/settings/keys to create keys, configure per-key limits, " +
            "or https://openrouter.ai/credits to add credits to your account balance.",
        })
      }
    }

    // Register Keymap Layer (slash commands & palette)
    try {
      context.keymap.layer(() => ({
        mode: "global",
        commands: [
          {
            id: "openrouter.credits",
            title: "OpenRouter: Check Credits & Limits",
            description: "View remaining credits, spending limits, and usage breakdown",
            group: "OpenRouter",
            palette: true,
            slash: {
              name: "openrouter",
              aliases: ["credits", "orc"],
              arguments: true,
            },
            run: async (input) => {
              const arg = input?.trim().toLowerCase()
              if (arg === "refresh" || arg === "sync") {
                client.invalidateCache()
                const fresh = await fetchAndUpdate(true)
                context.ui.toast.show({
                  title: "OpenRouter Credits",
                  message: formatBadgeText(fresh, "detailed"),
                  variant: fresh.status === "error" ? "error" : "success",
                })
                return
              }
              await openCreditsDialog()
            },
          },
        ],
      }))
    } catch {
      // In case keymap layer was already registered
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
      const statusEmoji = () => getStatusEmoji(st().status)
      const statusLabel = () => getStatusLabel(st().status)

      // Format RESET_LIMIT: $remaining / $key_limit (interval)
      const resetLimitText = () => {
        const d = details()
        if (!d) return "RESET_LIMIT: Checking…"
        if (d.limit === null || d.limit === undefined) {
          return "RESET_LIMIT: Unlimited"
        }
        const rem = formatCurrency(d.limitRemaining)
        const lim = formatCurrency(d.limit)
        const interval = d.limitReset ? ` (${d.limitReset})` : ""
        return `RESET_LIMIT: ${rem} / ${lim}${interval}`
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
          onMouseDown={() => {
            void openCreditsDialog()
          }}
        >
          {/* Header row */}
          <box flexDirection="row" justifyContent="space-between">
            <text fg={context.theme.text.base}>
              <b>OpenRouter</b>
            </text>
            <text fg={statusColor()}>
              {statusEmoji()} {statusLabel()}
            </text>
          </box>

          {/* Details list */}
          <box flexDirection="column" paddingLeft={1} gap={0}>
            {st().status === "no_key" ? (
              <text fg={context.theme.text.muted}>
                No API key (click to set)
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
                {/* Line 1: RESET_LIMIT: $remaining / $key_limit */}
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

    // Listen to session events to refresh after LLM completions
    const unlisten = context.data.listen(({ details: event }) => {
      if (
        event?.type === "session.execution.succeeded" ||
        event?.type === "session.idle" ||
        event?.type === "session.usage.updated"
      ) {
        setTimeout(() => {
          void fetchAndUpdate(true)
        }, 1500)
      }
    })

    return () => {
      clearInterval(timer)
      unlisten()
      removeSidebarSlot?.()
    }
  },
})
