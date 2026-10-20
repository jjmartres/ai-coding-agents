/**
 * @fileoverview OpenCode Server Plugin for OpenRouter Credits & Limits.
 * Exposes the `openrouter_credits` tool for agents and the `/openrouter-credits` command.
 */

import { Plugin } from "@opencode/plugin"
import { OpenRouterClient } from "./api.ts"
import { resolveApiKey } from "./key-resolver.ts"
import {
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatResetInterval,
  getStatusEmoji,
  getStatusLabel,
} from "./format.ts"
import type { OpenRouterCreditsOptions, OpenRouterState } from "./types.ts"

/**
 * Builds a clear textual summary of the OpenRouter credits state.
 */
function buildSummaryMarkdown(state: OpenRouterState): string {
  const emoji = getStatusEmoji(state.status)
  const label = getStatusLabel(state.status)

  if (state.status === "no_key") {
    return (
      `### 🔑 OpenRouter: No API Key Configured\n\n` +
      `No OpenRouter API key was detected.\n` +
      `To configure your key, add it to \`~/.local/share/opencode/auth.json\` ` +
      `under \`"openrouter": { "key": "sk-or-v1-..." }\` or export \`OPENROUTER_API_KEY\` in your environment.`
    )
  }

  if (state.status === "error") {
    return (
      `### ❌ OpenRouter Credits Check Failed\n\n` +
      `**Error**: ${state.error ?? "Unknown error"}\n` +
      `Key: \`${state.apiKeyMasked ?? "unknown"}\``
    )
  }

  const details = state.keyDetails
  const lines: string[] = []

  lines.push(`### ${emoji} OpenRouter Status: **${label}**`)
  lines.push(``)
  lines.push(`- **Key Label**: \`${details?.label ?? state.apiKeyMasked}\``)

  if (details?.limit !== null && details?.limit !== undefined) {
    const rem = details.limitRemaining ?? 0
    const lim = details.limit
    const usedPct = lim > 0 ? ((lim - rem) / lim) * 100 : 0

    lines.push(`- **Remaining Limit**: **${formatCurrency(rem)}** of ${formatCurrency(lim)} (${formatPercent(usedPct)} spent)`)
    lines.push(`- **Limit Reset**: ${formatResetInterval(details.limitReset)}`)
  } else {
    lines.push(`- **Spending Limit**: Unlimited (no per-key limit set)`)
  }

  if (state.accountCredits) {
    lines.push(`- **Account Total Balance**: **${formatCurrency(state.accountCredits.remainingCredits)}** (${formatCurrency(state.accountCredits.totalUsage)} used of ${formatCurrency(state.accountCredits.totalCredits)} purchased)`)
  }

  lines.push(`- **Total Key Spend**: ${formatCurrency(details?.usage ?? 0)}`)
  lines.push(`- **Spend Today**: ${formatCurrency(details?.usageDaily ?? 0)}`)
  lines.push(`- **Spend This Week**: ${formatCurrency(details?.usageWeekly ?? 0)}`)
  lines.push(`- **Spend This Month**: ${formatCurrency(details?.usageMonthly ?? 0)}`)

  if ((details?.byokUsage ?? 0) > 0) {
    lines.push(`- **BYOK Spend**: ${formatCurrency(details?.byokUsage)}`)
  }

  if (details?.freeModelQuota) {
    const quota = details.freeModelQuota
    lines.push(`- **Free Model Daily Requests**: ${quota.remaining} remaining of ${quota.limit} (${quota.used} used today)`)
  }

  if (details?.effectiveBudget) {
    const b = details.effectiveBudget
    lines.push(`- **Effective Budget (${b.scope})**: **${formatCurrency(b.remaining_usd)}** remaining of ${formatCurrency(b.limit_usd)} (resets: ${formatResetInterval(b.reset_interval)})`)
  }

  if (state.status === "limit_reached") {
    lines.push(``)
    lines.push(`> ⚠️ **ACTION REQUIRED**: Your OpenRouter spending limit or budget has been reached. Model requests will fail with HTTP 402/403 until the limit is increased or resets.`)
  } else if (state.status === "low") {
    lines.push(``)
    lines.push(`> ⚠️ **WARNING**: Remaining OpenRouter credits are running low. Please consider topping up or raising your spending limit soon.`)
  }

  return lines.join("\n")
}

export default Plugin.define({
  id: "openrouter-credits",
  async setup(ctx) {
    const options = (ctx.options ?? {}) as OpenRouterCreditsOptions
    const pollInterval = Math.max(15, options.pollIntervalSeconds ?? 60) * 1000
    const client = new OpenRouterClient()

    // 1. Register agent tool `openrouter_credits`
    const toolReg = await ctx.tool.transform((editor) => {
      editor.add({
        name: "openrouter_credits",
        description:
          "Checks the current OpenRouter API key and account status: remaining spending limit, total credits, " +
          "breakdown of spend today/week/month, free model daily quota, and whether the spending limit is reached.",
        input: {
          type: "object",
          properties: {
            refresh: {
              type: "boolean",
              description: "Whether to force a fresh check bypassing cache (default: false)",
            },
          },
          additionalProperties: false,
        },
        options: {
          codemode: true,
        },
        execute: async (input, context) => {
          const forceRefresh = (input as { refresh?: boolean })?.refresh === true
          const apiKey = await resolveApiKey(options)
          const state = await client.getState(apiKey, options, forceRefresh, context.signal)

          return {
            content: JSON.stringify(
              {
                status: state.status,
                label: state.keyDetails?.label ?? state.apiKeyMasked,
                limit_usd: state.keyDetails?.limit ?? null,
                remaining_usd: state.keyDetails?.limitRemaining ?? null,
                limit_reached: state.status === "limit_reached",
                limit_reset: state.keyDetails?.limitReset ?? null,
                total_usage_usd: state.keyDetails?.usage ?? null,
                usage_daily_usd: state.keyDetails?.usageDaily ?? null,
                usage_weekly_usd: state.keyDetails?.usageWeekly ?? null,
                usage_monthly_usd: state.keyDetails?.usageMonthly ?? null,
                account_credits: state.accountCredits
                  ? {
                      total_purchased_usd: state.accountCredits.totalCredits,
                      total_used_usd: state.accountCredits.totalUsage,
                      remaining_balance_usd: state.accountCredits.remainingCredits,
                    }
                  : null,
                free_model_daily_requests: state.keyDetails?.freeModelQuota ?? null,
                effective_budget: state.keyDetails?.effectiveBudget ?? null,
                error: state.error,
              },
              null,
              2
            ),
          }
        },
      })
    })

    // 2. Register server command `openrouter-credits`
    const cmdReg = await ctx.command.transform((editor) => {
      editor.add({
        name: "openrouter-credits",
        description: "Display current OpenRouter account credits, spending limits, and usage",
        execute: async ({ sessionID, delivery }) => {
          const apiKey = await resolveApiKey(options)
          const state = await client.getState(apiKey, options, true)
          const summary = buildSummaryMarkdown(state)

          await ctx.session.prompt({
            sessionID,
            text: summary,
            delivery,
          })
        },
      })
    })

    // 3. Background periodic sync to keep cached state fresh
    const syncState = async () => {
      try {
        const apiKey = await resolveApiKey(options)
        if (apiKey) {
          await client.getState(apiKey, options, false)
        }
      } catch {
        // Ignore background polling errors
      }
    }

    // Initial background sync
    void syncState()
    const timer = setInterval(() => void syncState(), pollInterval)

    return async () => {
      clearInterval(timer)
      await toolReg.dispose()
      await cmdReg.dispose()
    }
  },
})
