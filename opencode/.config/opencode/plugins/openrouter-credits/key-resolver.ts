/**
 * @fileoverview Resolves and persists OpenRouter API keys from multiple configuration sources.
 */

import { promises as fs } from "node:fs"
import * as path from "node:path"
import * as os from "node:os"

/**
 * Returns the resolved path to OpenCode's auth.json credential store.
 */
export function getOpenCodeAuthPath(): string {
  const xdgData = process.env.XDG_DATA_HOME
  const baseDir = xdgData && xdgData.trim().length > 0
    ? xdgData
    : path.join(os.homedir(), ".local", "share")
  return path.join(baseDir, "opencode", "auth.json")
}

/**
 * Safely reads and parses OpenCode's auth.json file.
 */
export async function readOpenCodeAuth(): Promise<Record<string, unknown> | null> {
  try {
    const authPath = getOpenCodeAuthPath()
    const content = await fs.readFile(authPath, "utf-8")
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Extracts OpenRouter API key from parsed auth.json content.
 */
export function extractKeyFromAuth(auth: Record<string, unknown> | null): string | undefined {
  if (!auth) return undefined

  // Standard OpenCode auth format: { "openrouter": { "type": "api", "key": "sk-or-..." } }
  const openrouterEntry = auth.openrouter ?? auth.OpenRouter
  if (typeof openrouterEntry === "string" && openrouterEntry.trim().length > 0) {
    return openrouterEntry.trim()
  }

  if (typeof openrouterEntry === "object" && openrouterEntry !== null) {
    const rec = openrouterEntry as Record<string, unknown>
    if (typeof rec.key === "string" && rec.key.trim().length > 0) {
      return rec.key.trim()
    }
    if (typeof rec.apiKey === "string" && rec.apiKey.trim().length > 0) {
      return rec.apiKey.trim()
    }
    if (typeof rec.token === "string" && rec.token.trim().length > 0) {
      return rec.token.trim()
    }
  }

  return undefined
}

/**
 * Resolves the OpenRouter API key following precedence order:
 * 1. Explicit option passed to plugin
 * 2. Environment variable OPENROUTER_API_KEY
 * 3. Environment variable OPENROUTER_KEY
 * 4. Stored credentials in OpenCode auth.json (~/.local/share/opencode/auth.json)
 */
export async function resolveApiKey(options?: { apiKey?: string }): Promise<string | undefined> {
  // 1. Explicit option
  if (options?.apiKey && options.apiKey.trim().length > 0) {
    return options.apiKey.trim()
  }

  // 2. OPENROUTER_API_KEY
  const envKey = process.env.OPENROUTER_API_KEY
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim()
  }

  // 3. OPENROUTER_KEY
  const altEnvKey = process.env.OPENROUTER_KEY
  if (altEnvKey && altEnvKey.trim().length > 0) {
    return altEnvKey.trim()
  }

  // 4. Stored credentials in OpenCode auth.json
  const auth = await readOpenCodeAuth()
  const storedKey = extractKeyFromAuth(auth)
  if (storedKey) {
    return storedKey
  }

  return undefined
}

/**
 * Saves an OpenRouter API key into OpenCode's auth.json credential file.
 */
export async function saveApiKeyToAuth(key: string): Promise<boolean> {
  try {
    const authPath = getOpenCodeAuthPath()
    const dir = path.dirname(authPath)
    await fs.mkdir(dir, { recursive: true })

    let currentAuth: Record<string, unknown> = {}
    try {
      const existing = await fs.readFile(authPath, "utf-8")
      currentAuth = JSON.parse(existing) as Record<string, unknown>
    } catch {
      // Create new file if it doesn't exist
    }

    currentAuth.openrouter = {
      type: "api",
      key: key.trim(),
    }

    await fs.writeFile(authPath, JSON.stringify(currentAuth, null, 2), {
      encoding: "utf-8",
      mode: 0o600, // secure file permissions for credentials
    })
    return true
  } catch {
    return false
  }
}

/**
 * Masks an API key for safe display in UI and logs.
 * Example: "sk-or-v1-abcdef1234567890" -> "sk-or-v1-abc...7890"
 */
export function maskApiKey(key: string | null | undefined): string {
  if (!key) return "none"
  const clean = key.trim()
  if (clean.length <= 12) {
    return clean.slice(0, 3) + "..." + clean.slice(-2)
  }
  const prefix = clean.startsWith("sk-or-v1-") ? clean.slice(0, 13) : clean.slice(0, 8)
  const suffix = clean.slice(-4)
  return `${prefix}...${suffix}`
}
