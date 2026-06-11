/**
 * lib/email/verify.ts
 * -------------------
 * Server-only helpers for email deliverability signals and pattern guessing.
 *
 *   - domainAcceptsMail(domain): DNS MX lookup (with A-record fallback, since
 *     a domain with no MX but an A record can still receive mail per RFC 5321).
 *     This is the same first-line check commercial email finders run — a
 *     domain with no mail setup can never have a valid address, so we can
 *     both reject bad guesses and boost confidence in good ones.
 *
 *   - generateEmailPatterns(name, domain): ordered candidate local-parts using
 *     the most common corporate/academic conventions (first.last is the most
 *     widespread, followed by flast / first / last).
 *
 * NOTE: imports node:dns — only use from API routes / server code.
 */

import { resolveMx, resolve4 } from "node:dns/promises"

// Per-process cache — repeated lookups for the same domain are instant.
const mxCache = new Map<string, boolean>()

/** True if the domain can receive email (has MX, or at least an A record). */
export async function domainAcceptsMail(domain: string, timeoutMs = 4000): Promise<boolean> {
  const d = domain.toLowerCase().replace(/^www\./, "").trim()
  if (!d || !d.includes(".")) return false
  const hit = mxCache.get(d)
  if (hit !== undefined) return hit

  const withTimeout = <T>(p: Promise<T>): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error("dns-timeout")), timeoutMs)),
    ])

  let ok = false
  try {
    const mx = await withTimeout(resolveMx(d))
    ok = Array.isArray(mx) && mx.length > 0
  } catch {
    // No MX — RFC 5321 fallback: an A record alone can still accept mail.
    try {
      const a = await withTimeout(resolve4(d))
      ok = Array.isArray(a) && a.length > 0
    } catch {
      ok = false
    }
  }
  mxCache.set(d, ok)
  return ok
}

function cleanNamePart(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics: José -> jose
    .replace(/[^a-z]/g, "")
}

export interface NameParts {
  first: string
  last: string
  fi: string // first initial
  li: string // last initial
}

export function splitName(fullName: string): NameParts | null {
  const parts = fullName
    .trim()
    .replace(/\b(dr|prof|professor|mr|mrs|ms|phd|md)\.?\b/gi, "")
    .split(/\s+/)
    .map(cleanNamePart)
    .filter((p) => p.length > 0)
  if (parts.length === 0) return null
  const first = parts[0]
  const last = parts.length > 1 ? parts[parts.length - 1] : ""
  if (!first) return null
  return { first, last, fi: first[0] || "", li: last[0] || "" }
}

/**
 * Ordered list of likely addresses for a person at a domain. Order reflects
 * real-world frequency: first.last is by far the most common corporate
 * pattern; academia leans toward flast / last / first.
 */
export function generateEmailPatterns(
  fullName: string,
  domain: string,
  opts?: { academic?: boolean }
): string[] {
  const n = splitName(fullName)
  const d = domain.toLowerCase().replace(/^www\./, "").trim()
  if (!n || !d) return []
  const { first, last, fi } = n

  const corporate = last
    ? [
        `${first}.${last}`, // john.smith — most common
        `${fi}${last}`,     // jsmith
        `${first}${last}`,  // johnsmith
        `${first}`,         // john (small companies)
        `${first}_${last}`, // john_smith
        `${last}.${first}`, // smith.john
        `${last}${fi}`,     // smithj
      ]
    : [`${first}`]

  const academic = last
    ? [
        `${fi}${last}`,     // jsmith — very common in .edu
        `${first}.${last}`, // john.smith
        `${first}_${last}`, // john_smith — used by e.g. Harvard GSE
        `${last}`,          // smith
        `${first}${last}`,  // johnsmith
        `${last}.${first}`, // smith.john
        `${first}`,         // john
      ]
    : [`${first}`]

  const locals = opts?.academic ? academic : corporate
  // Dedupe while preserving order.
  return [...new Set(locals)].map((l) => `${l}@${d}`)
}

/**
 * Best-effort pattern guess: returns the most likely address candidates for
 * the person *only if* the domain actually accepts mail. Used as a last
 * resort when scraping + AI search both come up empty — clearly labelled
 * low-confidence so the UI can show it as a guess, not a verified find.
 */
export async function patternGuess(
  fullName: string,
  domain: string,
  opts?: { academic?: boolean }
): Promise<{ best: string; alternatives: string[] } | null> {
  const candidates = generateEmailPatterns(fullName, domain, opts)
  if (candidates.length === 0) return null
  const deliverable = await domainAcceptsMail(domain)
  if (!deliverable) return null
  return { best: candidates[0], alternatives: candidates.slice(1, 4) }
}
