/**
 * @fileoverview OpenRouter API client for checking key spending limits, usage, and account credits.
 */

import type {
  CreditStatus,
  OpenRouterAccountCredits,
  OpenRouterCreditsOptions,
  OpenRouterCreditsResponse,
  OpenRouterKeyDetails,
  OpenRouterKeyResponse,
  OpenRouterState,
} from "./types.ts"
import { maskApiKey } from "./key-resolver.ts"

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
const DEFAULT_LOW_THRESHOLD_USD = 2.0
const DEFAULT_LOW_THRESHOLD_PERCENT = 10
const DEFAULT_CACHE_TTL_MS = 60_000 // 60 seconds

export class OpenRouterClient {
  public baseUrl: string
  public defaultTtlMs: number
  private cachedState: OpenRouterState | null = null
  private cacheExpiresAt = 0

  constructor(
    baseUrl: string = OPENROUTER_BASE_URL,
    defaultTtlMs: number = DEFAULT_CACHE_TTL_MS
  ) {
    this.baseUrl = baseUrl
    this.defaultTtlMs = defaultTtlMs
  }

  /**
   * Clears the in-memory cache to force the next call to re-query the API.
   */
  public invalidateCache(): void {
    this.cachedState = null
    this.cacheExpiresAt = 0
  }

  /**
   * Fetches key details from GET /api/v1/key.
   */
  public async fetchKeyDetails(
    apiKey: string,
    signal?: AbortSignal
  ): Promise<OpenRouterKeyDetails> {
    const url = `${this.baseUrl}/key`
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": "https://opencode.ai",
        "X-Title": "OpenCode OpenRouter Credits Extension",
      },
      signal,
    })

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Invalid or unauthorized OpenRouter API key (401)")
      }
      if (res.status === 429) {
        throw new Error("OpenRouter rate limit reached (429)")
      }
      const errBody = await res.text().catch(() => "")
      throw new Error(`OpenRouter API error (${res.status}): ${errBody || res.statusText}`)
    }

    const payload = (await res.json()) as OpenRouterKeyResponse
    const data = payload.data

    return {
      label: data.label,
      limit: data.limit,
      limitRemaining: data.limit_remaining,
      limitReset: data.limit_reset,
      usage: data.usage,
      usageDaily: data.usage_daily,
      usageWeekly: data.usage_weekly,
      usageMonthly: data.usage_monthly,
      byokUsage: data.byok_usage,
      isFreeTier: data.is_free_tier,
      isManagementKey: data.is_management_key ?? false,
      expiresAt: data.expires_at ?? null,
      effectiveBudget: data.effective_budget ?? null,
      freeModelQuota: data.free_model_daily_requests ?? null,
    }
  }

  /**
   * Fetches account total credits from GET /api/v1/credits.
   * Note: Only management keys have access to this endpoint; standard keys return 403.
   */
  public async fetchAccountCredits(
    apiKey: string,
    signal?: AbortSignal
  ): Promise<OpenRouterAccountCredits | null> {
    try {
      const url = `${this.baseUrl}/credits`
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "HTTP-Referer": "https://opencode.ai",
          "X-Title": "OpenCode OpenRouter Credits Extension",
        },
        signal,
      })

      if (!res.ok) {
        // 403 Forbidden is normal for standard API keys
        return null
      }

      const payload = (await res.json()) as OpenRouterCreditsResponse
      if (!payload?.data) return null

      const totalCredits = payload.data.total_credits
      const totalUsage = payload.data.total_usage
      const remainingCredits = Math.max(0, totalCredits - totalUsage)

      return {
        totalCredits,
        totalUsage,
        remainingCredits,
      }
    } catch {
      return null
    }
  }

  /**
   * Calculates the overall health status of credits based on key details,
   * account credits, and threshold settings.
   */
  public evaluateStatus(
    keyDetails: OpenRouterKeyDetails,
    accountCredits: OpenRouterAccountCredits | null,
    options?: OpenRouterCreditsOptions
  ): CreditStatus {
    const thresholdUsd = options?.lowCreditThresholdUsd ?? DEFAULT_LOW_THRESHOLD_USD
    const thresholdPercent = options?.lowCreditThresholdPercent ?? DEFAULT_LOW_THRESHOLD_PERCENT

    // 1. Check if spending limit or budget is completely exhausted
    if (keyDetails.limitRemaining !== null && keyDetails.limitRemaining <= 0) {
      return "limit_reached"
    }

    if (keyDetails.effectiveBudget && keyDetails.effectiveBudget.remaining_usd <= 0) {
      return "limit_reached"
    }

    if (accountCredits && accountCredits.remainingCredits <= 0 && keyDetails.limit === null) {
      return "limit_reached"
    }

    // 2. Check if balance is low
    if (keyDetails.limitRemaining !== null) {
      const rem = keyDetails.limitRemaining
      const lim = keyDetails.limit

      if (rem <= thresholdUsd) {
        return "low"
      }

      if (lim !== null && lim > 0) {
        const pct = (rem / lim) * 100
        if (pct <= thresholdPercent) {
          return "low"
        }
      }
    }

    if (accountCredits && accountCredits.remainingCredits <= thresholdUsd && keyDetails.limit === null) {
      return "low"
    }

    return "ok"
  }

  /**
   * Retrieves the full consolidated OpenRouter credits state, using cache if fresh.
   */
  public async getState(
    apiKey: string | undefined,
    options?: OpenRouterCreditsOptions,
    forceRefresh = false,
    signal?: AbortSignal
  ): Promise<OpenRouterState> {
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        status: "no_key",
        keyDetails: null,
        accountCredits: null,
        lastUpdated: Date.now(),
        error: "No OpenRouter API key found. Add it via /openrouter, auth.json, or OPENROUTER_API_KEY.",
        apiKeyMasked: null,
      }
    }

    const now = Date.now()
    if (!forceRefresh && this.cachedState && this.cacheExpiresAt > now) {
      return this.cachedState
    }

    try {
      const keyDetails = await this.fetchKeyDetails(apiKey, signal)
      let accountCredits: OpenRouterAccountCredits | null = null

      // If key is a management key or if no key limit is set, attempt to get account credits
      if (keyDetails.isManagementKey || keyDetails.limit === null) {
        accountCredits = await this.fetchAccountCredits(apiKey, signal)
      }

      const status = this.evaluateStatus(keyDetails, accountCredits, options)

      const state: OpenRouterState = {
        status,
        keyDetails,
        accountCredits,
        lastUpdated: now,
        error: null,
        apiKeyMasked: maskApiKey(apiKey),
      }

      const ttl = (options?.pollIntervalSeconds ?? 60) * 1000
      this.cachedState = state
      this.cacheExpiresAt = now + Math.max(10_000, ttl)

      return state
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const errorState: OpenRouterState = {
        status: "error",
        keyDetails: this.cachedState?.keyDetails ?? null,
        accountCredits: this.cachedState?.accountCredits ?? null,
        lastUpdated: now,
        error: message,
        apiKeyMasked: maskApiKey(apiKey),
      }

      // In case of error, cache briefly (10 seconds) so we don't spam a failing network
      this.cachedState = errorState
      this.cacheExpiresAt = now + 10_000

      return errorState
    }
  }
}
