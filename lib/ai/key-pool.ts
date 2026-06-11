/**
 * lib/ai/key-pool.ts
 * ------------------
 * Server-side pool of AI API keys with automatic rotation and fallback.
 *
 * Users do NOT bring their own keys. The pool is loaded once from environment
 * variables, and each request picks the first key that isn't currently flagged
 * as exhausted (rate-limited, daily-quota-hit, or auth-failed). When a key
 * fails, callers can flag it via `markKeyExhausted(key, reason)` and it will
 * be skipped until the cool-down expires.
 *
 * Quotas usually reset on a daily UTC boundary, so the default cool-down for
 * "quota_exceeded" matches that. Transient rate-limit failures cool down for
 * a few minutes; auth failures cool down for the rest of the day.
 *
 * The pool is in-memory only — across server restarts the cool-down resets,
 * which is fine because the upstream quotas will likely have refilled too.
 *
 *   import { getAiKey, withKeyRotation } from "@/lib/ai/key-pool"
 *
 *   // Simple: just grab the next available key.
 *   const key = getAiKey()
 *
 *   // Better: wrap a call so it automatically retries with the next key on
 *   // 429 / 401 / 402 / 403 failures.
 *   const result = await withKeyRotation(async (key) => {
 *     const res = await fetch("https://api.groq.com/...", {
 *       headers: { Authorization: `Bearer ${key}` }, ...
 *     })
 *     if (!res.ok) throw new KeyFailureError(res.status)
 *     return res.json()
 *   })
 */

// ─── Pool loading ────────────────────────────────────────────────────────────

/**
 * Parse the comma/whitespace-separated `GROQ_API_KEYS` env var. Falls back to
 * the single-key vars (`GROQ_API_KEY`, `GEMINI_API_KEY`) so existing setups
 * keep working in dev.
 */
function loadPool(): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const push = (raw: string | undefined | null) => {
    if (!raw) return
    raw
      .split(/[\s,]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 10)
      .forEach((k) => {
        if (!seen.has(k)) {
          seen.add(k)
          out.push(k)
        }
      })
  }
  push(process.env.GROQ_API_KEYS)
  // Optional secondary list — useful if you want Gemini failover too.
  push(process.env.GEMINI_API_KEYS)
  // Single-key vars as last-resort fallbacks (keeps existing dev setups working).
  push(process.env.GROQ_API_KEY)
  push(process.env.GEMINI_API_KEY)
  return out
}

const POOL: string[] = loadPool()

// ─── Cool-down tracking ──────────────────────────────────────────────────────

type FailureReason =
  | "rate_limited" // 429: transient, retry soon
  | "quota_exceeded" // 429 with daily-limit text: retry tomorrow
  | "auth_failed" // 401 / 403: key is bad, skip for a long time
  | "server_error" // 5xx from provider: short cool-down
  | "unknown"

const COOLDOWN_MS: Record<FailureReason, number> = {
  rate_limited: 60 * 1000, // 1 minute
  quota_exceeded: 24 * 60 * 60 * 1000, // 24 hours
  auth_failed: 24 * 60 * 60 * 1000, // 24 hours
  server_error: 30 * 1000, // 30 seconds
  unknown: 60 * 1000, // 1 minute
}

interface KeyState {
  exhaustedUntil: number // epoch ms; 0 = available
  lastReason?: FailureReason
  failureCount: number
}

const state = new Map<string, KeyState>()

function getOrInit(key: string): KeyState {
  let s = state.get(key)
  if (!s) {
    s = { exhaustedUntil: 0, failureCount: 0 }
    state.set(key, s)
  }
  return s
}

function isAvailable(key: string, now: number): boolean {
  const s = state.get(key)
  if (!s) return true
  return s.exhaustedUntil <= now
}

/**
 * Mark a key as temporarily out of service. `reason` controls the cool-down
 * window — use "quota_exceeded" for daily-limit errors, "rate_limited" for
 * per-minute throttles, "auth_failed" for bad keys.
 */
export function markKeyExhausted(key: string, reason: FailureReason = "unknown") {
  if (!key) return
  const s = getOrInit(key)
  s.exhaustedUntil = Date.now() + COOLDOWN_MS[reason]
  s.lastReason = reason
  s.failureCount += 1
}

/**
 * Mark a key as healthy (call after a successful response). Resets the
 * failure counter so flaky transient errors don't accumulate.
 */
export function markKeySuccess(key: string) {
  if (!key) return
  const s = getOrInit(key)
  s.exhaustedUntil = 0
  s.failureCount = 0
  s.lastReason = undefined
}

// ─── Key selection ───────────────────────────────────────────────────────────

/**
 * Round-robin starting point so that under healthy conditions the load is
 * spread across keys rather than always hammering the first one. This isn't
 * load-balancing across processes — each Next.js process keeps its own
 * counter — but it avoids a single key absorbing all the daily quota on a
 * single server.
 */
let rrCursor = 0

/**
 * Return the next available key from the pool, or "" if none are available.
 * Prefers keys that are not currently in cool-down. Within available keys,
 * iterates round-robin so traffic is spread.
 */
export function getAiKey(): string {
  if (POOL.length === 0) return ""
  const now = Date.now()
  // First pass: find an available key starting from the cursor.
  for (let i = 0; i < POOL.length; i++) {
    const idx = (rrCursor + i) % POOL.length
    const key = POOL[idx]
    if (isAvailable(key, now)) {
      rrCursor = (idx + 1) % POOL.length
      return key
    }
  }
  // All keys are in cool-down. Pick the one with the soonest recovery so we
  // at least try the least-stale option. (This handles the edge case where
  // a transient blip cooled everything down briefly.)
  let best = POOL[0]
  let bestUntil = state.get(best)?.exhaustedUntil ?? 0
  for (const k of POOL) {
    const until = state.get(k)?.exhaustedUntil ?? 0
    if (until < bestUntil) {
      best = k
      bestUntil = until
    }
  }
  return best
}

/**
 * Returns the full ordered list of keys to try, starting with the most
 * available. Use this when you want to attempt every key before giving up.
 */
export function getAiKeysInOrder(): string[] {
  if (POOL.length === 0) return []
  const now = Date.now()
  const available: string[] = []
  const exhausted: string[] = []
  for (let i = 0; i < POOL.length; i++) {
    const idx = (rrCursor + i) % POOL.length
    const key = POOL[idx]
    if (isAvailable(key, now)) {
      available.push(key)
    } else {
      exhausted.push(key)
    }
  }
  // Within "exhausted", prefer the one whose cool-down ends soonest.
  exhausted.sort(
    (a, b) =>
      (state.get(a)?.exhaustedUntil ?? 0) - (state.get(b)?.exhaustedUntil ?? 0)
  )
  return [...available, ...exhausted]
}

// ─── Error classification ────────────────────────────────────────────────────

export class KeyFailureError extends Error {
  constructor(public reason: FailureReason, public status?: number, message?: string) {
    super(message || `Key failure: ${reason}${status ? ` (HTTP ${status})` : ""}`)
    this.name = "KeyFailureError"
  }
}

/**
 * Map an HTTP status (and optional body text) to a FailureReason. Use this
 * when wrapping fetch calls so the right cool-down is applied.
 */
export function classifyKeyFailure(
  status: number,
  bodyText?: string
): FailureReason {
  if (status === 401 || status === 403) return "auth_failed"
  if (status === 402) return "quota_exceeded" // payment-required ≈ out of credit
  if (status === 429) {
    if (bodyText) {
      const lower = bodyText.toLowerCase()
      if (
        lower.includes("daily") ||
        lower.includes("quota") ||
        lower.includes("monthly") ||
        lower.includes("exhausted")
      ) {
        return "quota_exceeded"
      }
    }
    return "rate_limited"
  }
  if (status >= 500 && status < 600) return "server_error"
  return "unknown"
}

// ─── High-level helper ───────────────────────────────────────────────────────

/**
 * Run `fn(key)` against successive keys, rotating to the next one whenever
 * the previous attempt throws a KeyFailureError. The wrapped function should
 * call `classifyKeyFailure(res.status, await res.text())` on a non-OK
 * response and throw `new KeyFailureError(reason, status, body)`.
 *
 * Stops after either a success, or all keys have been tried.
 */
export async function withKeyRotation<T>(
  fn: (key: string, attempt: number) => Promise<T>,
  opts?: { maxAttempts?: number }
): Promise<T> {
  const keys = getAiKeysInOrder()
  if (keys.length === 0) {
    throw new Error("No AI keys configured. Set GROQ_API_KEYS in the server environment.")
  }
  const maxAttempts = Math.min(opts?.maxAttempts ?? keys.length, keys.length)
  let lastErr: unknown
  for (let i = 0; i < maxAttempts; i++) {
    const key = keys[i]
    try {
      const out = await fn(key, i)
      markKeySuccess(key)
      return out
    } catch (e) {
      lastErr = e
      if (e instanceof KeyFailureError) {
        markKeyExhausted(key, e.reason)
        continue
      }
      // Non-key error — don't burn through the rest of the pool.
      throw e
    }
  }
  throw lastErr ?? new Error("All AI keys are currently unavailable")
}

// ─── Debug / health ──────────────────────────────────────────────────────────

/**
 * Snapshot of pool health, for logging or an internal status endpoint. Never
 * include this in a response to an end user — it would expose key shapes.
 */
export function getPoolStatus() {
  const now = Date.now()
  return {
    size: POOL.length,
    available: POOL.filter((k) => isAvailable(k, now)).length,
    keys: POOL.map((k) => ({
      // Only return the last 4 chars so logs aren't a credential dump.
      tail: k.slice(-4),
      available: isAvailable(k, now),
      lastReason: state.get(k)?.lastReason,
      failureCount: state.get(k)?.failureCount ?? 0,
      cooldownMsLeft: Math.max(0, (state.get(k)?.exhaustedUntil ?? 0) - now),
    })),
  }
}
