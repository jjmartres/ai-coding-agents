import { describe, it } from "node:test"
import assert from "node:assert/strict"

import { extractKeyFromAuth, maskApiKey, resolveApiKey } from "../key-resolver.ts"
import {
  formatBadgeText,
  formatCurrency,
  formatPercent,
  formatRelativeTime,
  formatResetInterval,
  getStatusEmoji,
  getStatusLabel,
} from "../format.ts"
import { OpenRouterClient } from "../api.ts"
import type { OpenRouterKeyDetails, OpenRouterState } from "../types.ts"

describe("Key Resolver", () => {
  it("extracts key from auth object with openrouter.key", () => {
    const auth = {
      openrouter: {
        type: "api",
        key: "sk-or-v1-testkey123",
      },
    }
    assert.equal(extractKeyFromAuth(auth), "sk-or-v1-testkey123")
  })

  it("extracts key from auth object with apiKey or token", () => {
    assert.equal(
      extractKeyFromAuth({ openrouter: { apiKey: "sk-or-v1-altkey" } }),
      "sk-or-v1-altkey"
    )
    assert.equal(
      extractKeyFromAuth({ openrouter: { token: "sk-or-v1-token" } }),
      "sk-or-v1-token"
    )
  })

  it("extracts key from auth object when openrouter is direct string", () => {
    assert.equal(
      extractKeyFromAuth({ openrouter: "sk-or-v1-stringkey" }),
      "sk-or-v1-stringkey"
    )
  })

  it("returns undefined for null or empty auth", () => {
    assert.equal(extractKeyFromAuth(null), undefined)
    assert.equal(extractKeyFromAuth({}), undefined)
    assert.equal(extractKeyFromAuth({ openrouter: {} }), undefined)
  })

  it("masks API keys safely", () => {
    assert.equal(
      maskApiKey("sk-or-v1-abcdef1234567890"),
      "sk-or-v1-abcd...7890"
    )
    assert.equal(maskApiKey(null), "none")
    assert.equal(maskApiKey("short123"), "sho...23")
  })

  it("prefers explicit option over environment variables", async () => {
    process.env.OPENROUTER_API_KEY = "env-key"
    const resolved = await resolveApiKey({ apiKey: "option-key" })
    assert.equal(resolved, "option-key")
    delete process.env.OPENROUTER_API_KEY
  })

  it("prefers OPENROUTER_API_KEY over OPENROUTER_KEY", async () => {
    process.env.OPENROUTER_API_KEY = "env-primary"
    process.env.OPENROUTER_KEY = "env-secondary"
    const resolved = await resolveApiKey()
    assert.equal(resolved, "env-primary")
    delete process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_KEY
  })
})

describe("Format Utilities", () => {
  it("formats currency values accurately", () => {
    assert.equal(formatCurrency(25.5), "$25.50")
    assert.equal(formatCurrency(0), "$0.00")
    assert.equal(formatCurrency(0.0045), "$0.0045")
    assert.equal(formatCurrency(null), "Unlimited")
    assert.equal(formatCurrency(undefined, { fallback: "No limit" }), "No limit")
  })

  it("formats percentages accurately", () => {
    assert.equal(formatPercent(45.2), "45%")
    assert.equal(formatPercent(99.8), "100%")
    assert.equal(formatPercent(NaN), "0%")
  })

  it("formats reset intervals", () => {
    assert.equal(formatResetInterval("monthly"), "Monthly (resets 1st of month)")
    assert.equal(formatResetInterval("weekly"), "Weekly (resets Monday 00:00 UTC)")
    assert.equal(formatResetInterval("daily"), "Daily (resets 00:00 UTC)")
    assert.equal(formatResetInterval(null), "Never (lifetime)")
  })

  it("formats relative times", () => {
    const now = Date.now()
    assert.equal(formatRelativeTime(now), "just now")
    assert.equal(formatRelativeTime(now - 30_000), "30s ago")
    assert.equal(formatRelativeTime(now - 120_000), "2m ago")
    assert.equal(formatRelativeTime(null), "never")
  })

  it("returns appropriate status labels and emojis", () => {
    assert.equal(getStatusLabel("ok"), "Active")
    assert.equal(getStatusLabel("limit_reached"), "Limit Reached")
    assert.equal(getStatusEmoji("ok"), "🪙")
    assert.equal(getStatusEmoji("limit_reached"), "🚫")
    assert.equal(getStatusEmoji("low"), "⚠️")
  })

  it("formats badge text across different states", () => {
    const mockDetails: OpenRouterKeyDetails = {
      label: "sk-or-v1-test",
      limit: 100,
      limitRemaining: 45.5,
      limitReset: "monthly",
      usage: 54.5,
      usageDaily: 2.1,
      usageWeekly: 10.5,
      usageMonthly: 54.5,
      byokUsage: 0,
      isFreeTier: false,
      isManagementKey: false,
      expiresAt: null,
      effectiveBudget: null,
      freeModelQuota: null,
    }

    const stateOk: OpenRouterState = {
      status: "ok",
      keyDetails: mockDetails,
      accountCredits: null,
      lastUpdated: Date.now(),
      error: null,
      apiKeyMasked: "sk-or-v1-tes...test",
    }
    assert.equal(formatBadgeText(stateOk, "compact"), "🪙 $45.50")
    assert.equal(formatBadgeText(stateOk, "detailed"), "🪙 $45.50/$100.00")

    const stateLimitReached: OpenRouterState = {
      ...stateOk,
      status: "limit_reached",
      keyDetails: { ...mockDetails, limitRemaining: 0 },
    }
    assert.equal(formatBadgeText(stateLimitReached), "🚫 Limit reached ($0.00 left)")

    const stateLow: OpenRouterState = {
      ...stateOk,
      status: "low",
      keyDetails: { ...mockDetails, limitRemaining: 1.25 },
    }
    assert.equal(formatBadgeText(stateLow), "⚠️ $1.25 left")

    const stateNoKey: OpenRouterState = {
      status: "no_key",
      keyDetails: null,
      accountCredits: null,
      lastUpdated: null,
      error: null,
      apiKeyMasked: null,
    }
    assert.equal(formatBadgeText(stateNoKey), "🔑 OpenRouter: no key")
  })
})

describe("OpenRouter Client Evaluation & State", () => {
  const client = new OpenRouterClient()

  it("evaluates limit_reached when limitRemaining is zero or negative", () => {
    const details: OpenRouterKeyDetails = {
      label: "test",
      limit: 50,
      limitRemaining: 0,
      limitReset: "monthly",
      usage: 50,
      usageDaily: 10,
      usageWeekly: 30,
      usageMonthly: 50,
      byokUsage: 0,
      isFreeTier: false,
      isManagementKey: false,
      expiresAt: null,
      effectiveBudget: null,
      freeModelQuota: null,
    }
    assert.equal(client.evaluateStatus(details, null), "limit_reached")
  })

  it("evaluates limit_reached when effectiveBudget is exhausted", () => {
    const details: OpenRouterKeyDetails = {
      label: "test",
      limit: 100,
      limitRemaining: 20, // key itself has limit, but guardrail budget is 0
      limitReset: "monthly",
      usage: 80,
      usageDaily: 10,
      usageWeekly: 30,
      usageMonthly: 80,
      byokUsage: 0,
      isFreeTier: false,
      isManagementKey: false,
      expiresAt: null,
      effectiveBudget: {
        budget_id: null,
        guardrail_id: "guard-1",
        include_byok: false,
        limit_usd: 30,
        remaining_usd: 0, // EXHAUSTED
        reset_interval: "weekly",
        resets_at: null,
        scope: "member",
        spend_usd: 30,
      },
      freeModelQuota: null,
    }
    assert.equal(client.evaluateStatus(details, null), "limit_reached")
  })

  it("evaluates low when remaining is below threshold USD", () => {
    const details: OpenRouterKeyDetails = {
      label: "test",
      limit: 100,
      limitRemaining: 1.5, // <= $2.00
      limitReset: "monthly",
      usage: 98.5,
      usageDaily: 5,
      usageWeekly: 20,
      usageMonthly: 98.5,
      byokUsage: 0,
      isFreeTier: false,
      isManagementKey: false,
      expiresAt: null,
      effectiveBudget: null,
      freeModelQuota: null,
    }
    assert.equal(client.evaluateStatus(details, null), "low")
  })

  it("evaluates low when remaining percentage is below threshold percent", () => {
    const details: OpenRouterKeyDetails = {
      label: "test",
      limit: 50,
      limitRemaining: 4, // $4 is > $2, but 4/50 = 8% which is <= 10%
      limitReset: "monthly",
      usage: 46,
      usageDaily: 5,
      usageWeekly: 20,
      usageMonthly: 46,
      byokUsage: 0,
      isFreeTier: false,
      isManagementKey: false,
      expiresAt: null,
      effectiveBudget: null,
      freeModelQuota: null,
    }
    assert.equal(client.evaluateStatus(details, null), "low")
  })

  it("evaluates ok when balance is healthy", () => {
    const details: OpenRouterKeyDetails = {
      label: "test",
      limit: 100,
      limitRemaining: 75,
      limitReset: "monthly",
      usage: 25,
      usageDaily: 1,
      usageWeekly: 5,
      usageMonthly: 25,
      byokUsage: 0,
      isFreeTier: false,
      isManagementKey: false,
      expiresAt: null,
      effectiveBudget: null,
      freeModelQuota: null,
    }
    assert.equal(client.evaluateStatus(details, null), "ok")
  })

  it("returns no_key state when apiKey is missing", async () => {
    const state = await client.getState(undefined)
    assert.equal(state.status, "no_key")
    assert.equal(state.keyDetails, null)
  })

  it("handles caching and cache invalidation", async () => {
    const customClient = new OpenRouterClient("http://127.0.0.1:9999", 60_000)
    // Force a mock state into cache
    const mockDetails: OpenRouterKeyDetails = {
      label: "mock-label",
      limit: 100,
      limitRemaining: 50,
      limitReset: "monthly",
      usage: 50,
      usageDaily: 2,
      usageWeekly: 10,
      usageMonthly: 50,
      byokUsage: 0,
      isFreeTier: false,
      isManagementKey: false,
      expiresAt: null,
      effectiveBudget: null,
      freeModelQuota: null,
    }

    // Replace fetchKeyDetails
    customClient.fetchKeyDetails = async () => mockDetails

    const first = await customClient.getState("test-key")
    assert.equal(first.status, "ok")
    assert.equal(first.keyDetails?.label, "mock-label")

    // Change underlying mock, but do not force refresh
    customClient.fetchKeyDetails = async () => ({ ...mockDetails, label: "changed-label" })
    const cached = await customClient.getState("test-key")
    assert.equal(cached.keyDetails?.label, "mock-label") // still returns cached

    // Invalidate cache
    customClient.invalidateCache()
    const refreshed = await customClient.getState("test-key")
    assert.equal(refreshed.keyDetails?.label, "changed-label")
  })
})
