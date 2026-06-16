import "server-only"

import type { DataSource } from "@/lib/providers/types"

type CacheEntry<T> = {
  value: T
  expiresAt: number
  source: DataSource
}

const store = new Map<string, CacheEntry<unknown>>()

export const DEFAULT_CACHE_TTL_MS = 60_000

/** Sprint 5 server-side TTLs (reduce Twelve Data overuse). */
export const CACHE_TTL = {
  forex: 60_000,
  crypto: 45_000,
  heatmap: 300_000,
  overview: 30_000,
} as const

export const CACHE_KEYS = {
  crypto: "provider:crypto:markets",
  currency: "provider:currency:strength",
  economic: "provider:economic:calendar",
  marketIndices: "provider:market:indices",
  globalMarkets: "provider:global:quotes",
  vietnamMarkets: "provider:vietnam:markets",
  marketQuotes: "api:market:quotes",
  marketsOverview: "api:markets:overview",
  currencyStrength: "api:currency:strength",
  forexAlphaVantage: "provider:forex:alphavantage:pairs",
  heatmapVietnam: "api:heatmaps:vietnam",
  heatmapUs: "api:heatmaps:us",
  heatmapCrypto: "api:heatmaps:crypto",
  news: "api:news",
  events: "api:events:calendar",
} as const

export function getCached<T>(key: string): { value: T; source: DataSource } | null {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return { value: entry.value, source: entry.source }
}

export function setCached<T>(
  key: string,
  value: T,
  source: DataSource,
  ttlMs = DEFAULT_CACHE_TTL_MS,
): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
    source,
  })
}

export function clearProviderCache(key?: string): void {
  if (key) {
    store.delete(key)
    return
  }
  store.clear()
}

export async function cachedProvider<T>(
  key: string,
  fetcher: () => Promise<{ data: T; source: DataSource } | null>,
  options?: { ttlMs?: number },
): Promise<{ data: T; source: DataSource; fromCache: boolean } | null> {
  const cached = getCached<T>(key)
  if (cached) {
    return { data: cached.value, source: "cache", fromCache: true }
  }

  const result = await fetcher()
  if (!result) return null

  setCached(key, result.data, result.source, options?.ttlMs)
  return { ...result, fromCache: false }
}
