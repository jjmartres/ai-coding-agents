/**
 * @fileoverview Type definitions for OpenRouter Credits Extension.
 */

/**
 * Budget layer information from OpenRouter's /key endpoint.
 */
export interface OpenRouterKeyBudget {
  readonly budget_id: string | null
  readonly guardrail_id: string | null
  readonly include_byok: boolean
  readonly limit_usd: number
  readonly remaining_usd: number
  readonly reset_interval: "daily" | "weekly" | "monthly" | null
  readonly resets_at: string | null
  readonly scope: string
  readonly spend_usd: number
}

/**
 * Free-model daily request quota information.
 */
export interface OpenRouterFreeModelQuota {
  readonly limit: number
  readonly remaining: number
  readonly used: number
}

/**
 * Response payload structure from GET https://openrouter.ai/api/v1/key
 */
export interface OpenRouterKeyResponse {
  readonly data: {
    readonly label: string
    readonly usage: number
    readonly limit: number | null
    readonly is_free_tier: boolean
    readonly limit_remaining: number | null
    readonly limit_reset: "daily" | "weekly" | "monthly" | null
    readonly usage_daily: number
    readonly usage_weekly: number
    readonly usage_monthly: number
    readonly byok_usage: number
    readonly byok_usage_daily?: number
    readonly byok_usage_weekly?: number
    readonly byok_usage_monthly?: number
    readonly include_byok_in_limit?: boolean
    readonly is_management_key?: boolean
    readonly expires_at?: string | null
    readonly effective_budget?: OpenRouterKeyBudget | null
    readonly budgets?: readonly OpenRouterKeyBudget[]
    readonly free_model_daily_requests?: OpenRouterFreeModelQuota | null
  }
}

/**
 * Response payload structure from GET https://openrouter.ai/api/v1/credits
 * (Only available with management keys; returns 403 otherwise).
 */
export interface OpenRouterCreditsResponse {
  readonly data: {
    readonly total_credits: number
    readonly total_usage: number
  }
}

/**
 * Normalized account-level credits data (if management key).
 */
export interface OpenRouterAccountCredits {
  readonly totalCredits: number
  readonly totalUsage: number
  readonly remainingCredits: number
}

/**
 * Normalized key details.
 */
export interface OpenRouterKeyDetails {
  readonly label: string
  readonly limit: number | null
  readonly limitRemaining: number | null
  readonly limitReset: "daily" | "weekly" | "monthly" | null
  readonly usage: number
  readonly usageDaily: number
  readonly usageWeekly: number
  readonly usageMonthly: number
  readonly byokUsage: number
  readonly isFreeTier: boolean
  readonly isManagementKey: boolean
  readonly expiresAt: string | null
  readonly effectiveBudget: OpenRouterKeyBudget | null
  readonly freeModelQuota: OpenRouterFreeModelQuota | null
}

/**
 * Credit health / status enum.
 */
export type CreditStatus =
  | "ok"
  | "low"
  | "limit_reached"
  | "no_key"
  | "error"
  | "loading"

/**
 * Consolidated state of OpenRouter credits.
 */
export interface OpenRouterState {
  readonly status: CreditStatus
  readonly keyDetails: OpenRouterKeyDetails | null
  readonly accountCredits: OpenRouterAccountCredits | null
  readonly lastUpdated: number | null
  readonly error: string | null
  readonly apiKeyMasked: string | null
}

/**
 * Extension configuration options (passed via opencode.jsonc or cli.json).
 */
export interface OpenRouterCreditsOptions {
  /** Explicit API key override */
  readonly apiKey?: string
  /** Polling interval in seconds (default: 60, min: 10) */
  readonly pollIntervalSeconds?: number
  /** USD remaining balance threshold for "low" warning (default: 2.00) */
  readonly lowCreditThresholdUsd?: number
  /** Percentage remaining threshold for "low" warning (default: 10) */
  readonly lowCreditThresholdPercent?: number
  /** Whether to render widget in right sidebar above Context (default: true) */
  readonly showInSidebar?: boolean
  /** Whether to render badge in prompt footer (default: true) */
  readonly showInPromptFooter?: boolean
  /** Whether to render status in home footer (default: true) */
  readonly showInHomeFooter?: boolean
  /** Badge display style */
  readonly badgeFormat?: "compact" | "detailed" | "remaining_only"
}
