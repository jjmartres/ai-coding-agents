/**
 * @fileoverview Formatting utilities for OpenRouter credits, spending limits, and statuses.
 */

import type { CreditStatus, OpenRouterState } from "./types.ts"

/**
 * Formats a USD amount into a human-friendly currency string.
 */
export function formatCurrency(amount: number | null | undefined, options?: { fallback?: string }): string {
  if (amount === null || amount === undefined) {
    return options?.fallback ?? "Unlimited"
  }

  if (amount === 0) {
    return "$0.00"
  }

  // If amount is positive and smaller than $0.01, show 3 or 4 decimal places
  if (Math.abs(amount) < 0.01 && Math.abs(amount) > 0) {
    return `$${amount.toFixed(4)}`
  }

  return `$${amount.toFixed(2)}`
}

/**
 * Formats a number as a percentage string.
 */
export function formatPercent(percent: number): string {
  if (isNaN(percent) || !isFinite(percent)) return "0%"
  return `${Math.round(percent)}%`
}

/**
 * Returns human-readable label for reset intervals.
 */
export function formatResetInterval(interval: string | null | undefined): string {
  if (!interval) return "Never (lifetime)"
  switch (interval.toLowerCase()) {
    case "daily":
      return "Daily (resets 00:00 UTC)"
    case "weekly":
      return "Weekly (resets Monday 00:00 UTC)"
    case "monthly":
      return "Monthly (resets 1st of month)"
    default:
      return interval
  }
}

/**
 * Formats relative time elapsed from a timestamp in milliseconds.
 */
export function formatRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp) return "never"
  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000)

  if (elapsedSeconds < 5) return "just now"
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`
  const minutes = Math.floor(elapsedSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * Formats an ISO date-time string into a localized readable date/time.
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "N/A"
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return d.toUTCString().replace("GMT", "UTC")
  } catch {
    return isoString
  }
}

/**
 * Returns user-facing status label.
 */
export function getStatusLabel(status: CreditStatus): string {
  switch (status) {
    case "ok":
      return "Active"
    case "low":
      return "Low Balance"
    case "limit_reached":
      return "Limit Reached"
    case "no_key":
      return "No API Key"
    case "error":
      return "Error"
    case "loading":
      return "Checking..."
  }
}

/**
 * Returns an emoji/symbol badge for the current credit status.
 */
export function getStatusEmoji(status: CreditStatus): string {
  switch (status) {
    case "ok":
      return "🪙"
    case "low":
      return "⚠️"
    case "limit_reached":
      return "🚫"
    case "no_key":
      return "🔑"
    case "error":
      return "❌"
    case "loading":
      return "⏳"
  }
}

/**
 * Builds the compact single-line badge text displayed in TUI footers.
 */
export function formatBadgeText(
  state: OpenRouterState,
  style: "compact" | "detailed" | "remaining_only" = "compact"
): string {
  switch (state.status) {
    case "loading":
      return "⏳ OpenRouter..."

    case "no_key":
      return "🔑 OpenRouter: no key"

    case "error":
      return `❌ OpenRouter: ${state.error ?? "error"}`

    case "limit_reached": {
      const remaining = state.keyDetails?.limitRemaining ?? 0
      return `🚫 Limit reached (${formatCurrency(remaining)} left)`
    }

    case "low": {
      const remaining = state.keyDetails?.limitRemaining
      const limit = state.keyDetails?.limit
      if (remaining !== null && remaining !== undefined) {
        if (style === "detailed" && limit !== null && limit !== undefined) {
          return `⚠️ ${formatCurrency(remaining)}/${formatCurrency(limit)}`
        }
        return `⚠️ ${formatCurrency(remaining)} left`
      }
      return "⚠️ Low balance"
    }

    case "ok": {
      const remaining = state.keyDetails?.limitRemaining
      const limit = state.keyDetails?.limit

      if (remaining !== null && remaining !== undefined) {
        if (style === "detailed" && limit !== null && limit !== undefined) {
          return `🪙 ${formatCurrency(remaining)}/${formatCurrency(limit)}`
        }
        return `🪙 ${formatCurrency(remaining)}`
      }

      // No key-level limit set: check if account total credits are known
      if (state.accountCredits) {
        return `🪙 ${formatCurrency(state.accountCredits.remainingCredits)}`
      }

      // Standard unlimited key: show usage
      const usage = state.keyDetails?.usage
      if (usage !== undefined && usage !== null) {
        return `🪙 OpenRouter: ∞ (${formatCurrency(usage)} used)`
      }

      return "🪙 OpenRouter: Active"
    }
  }
}
