/**
 * Tiny in-memory TTL cache + concurrency limiter.
 *
 * Used to:
 *   - dedupe identical /maps/search and /maps/details calls within a process
 *   - throttle fan-out scrapes / details lookups when the pipeline runs
 *
 * For multi-instance deploys swap this with Redis or the optional Supabase
 * pipeline_cache table (see supabase migration).
 */

interface Entry<T> { value: T; expiresAt: number }

export class TTLCache<T> {
  private store = new Map<string, Entry<T>>()
  constructor(private defaultTtlMs: number) {}

  get(key: string): T | undefined {
    const e = this.store.get(key)
    if (!e) return undefined
    if (e.expiresAt < Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return e.value
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) })
    // Cheap GC: prune randomly when the map grows
    if (this.store.size > 500) this.gc()
  }

  private gc() {
    const now = Date.now()
    for (const [k, v] of this.store) if (v.expiresAt < now) this.store.delete(k)
  }
}

// Module-level singletons — survive across requests in the same Node process.
declare global {
  // eslint-disable-next-line no-var
  var __mapsCaches: {
    search: TTLCache<unknown>
    details: TTLCache<unknown>
    scrape: TTLCache<unknown>
  } | undefined
}

const caches = (globalThis.__mapsCaches ??= {
  search:  new TTLCache<unknown>(15 * 60 * 1000),  // 15m — search results turn over fast
  details: new TTLCache<unknown>(60 * 60 * 1000),  // 1h  — details are stable
  scrape:  new TTLCache<unknown>(24 * 60 * 60 * 1000), // 24h — homepages rarely change
})

export const searchCache  = caches.search  as TTLCache<unknown>
export const detailsCache = caches.details as TTLCache<unknown>
export const scrapeCache  = caches.scrape  as TTLCache<unknown>

// ─── Concurrency limiter (no `p-limit` dep) ──────────────────────────────────

/**
 * Run `tasks` with at most `concurrency` in flight. Returns results in the
 * same order as the input. Errors are caught per-task and surfaced as
 * `{ error: Error }` so one failure doesn't kill the whole pipeline.
 */
export async function mapWithLimit<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, idx: number) => Promise<R>,
): Promise<Array<R | { error: Error }>> {
  const results = new Array<R | { error: Error }>(items.length)
  let cursor = 0

  async function worker() {
    while (true) {
      const i = cursor++
      if (i >= items.length) return
      try {
        results[i] = await fn(items[i], i)
      } catch (err) {
        results[i] = { error: err instanceof Error ? err : new Error(String(err)) }
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}
