import "server-only"

import { logProviderFallback } from "@/lib/providers/provider-diagnostics"
import { cachedProvider } from "@/lib/providers/cache"
import type { DataSource } from "@/lib/providers/types"

export type ProviderResult<T> = {
  data: T
  source: DataSource
  /** True when mock or error fallback data is returned instead of live upstream. */
  fallback: boolean
  provider: string
  fetchedAt: string
  fromCache?: boolean
  error?: string
}

type FallbackOptions = {
  provider: string
  cacheKey?: string
  cacheTtlMs?: number
}

type ChainProvider<T> = {
  name: string
  fetch: () => Promise<T | null>
}

function result<T>(
  data: T,
  source: DataSource,
  provider: string,
  extra?: Partial<ProviderResult<T>>,
): ProviderResult<T> {
  return {
    data,
    source,
    fallback: source === "mock" || Boolean(extra?.error),
    provider,
    fetchedAt: new Date().toISOString(),
    ...extra,
  }
}

/** Run a live fetcher and fall back to mock data when it fails or returns empty. */
export async function withFallback<T>(
  primary: () => Promise<T | null>,
  fallback: () => T,
  options: FallbackOptions,
): Promise<ProviderResult<T>> {
  const { provider, cacheKey, cacheTtlMs } = options

  if (cacheKey) {
    const cached = await cachedProvider<T>(
      cacheKey,
      async () => {
        const live = await primary()
        return live ? { data: live, source: "live" as const } : null
      },
      { ttlMs: cacheTtlMs },
    )

    if (cached) {
      if (cached.source !== "live") {
        logProviderFallback(provider, "cached_non_live_source", { fromCache: cached.fromCache })
      }
      return result(cached.data, cached.source, provider, { fromCache: cached.fromCache })
    }
  } else {
    try {
      const live = await primary()
      if (live != null) return result(live, "live", provider)
    } catch (error) {
      const message = error instanceof Error ? error.message : "provider failed"
      logProviderFallback(provider, message)
      return result(fallback(), "mock", provider, { error: message })
    }
  }

  logProviderFallback(provider, "primary_returned_null")
  return result(fallback(), "mock", provider)
}

/** Try providers in order until one returns data, then fall back to mock. */
export async function chainProviders<T>(
  providers: ChainProvider<T>[],
  fallback: () => T,
  options?: { cacheKey?: string; cacheTtlMs?: number },
): Promise<ProviderResult<T>> {
  if (options?.cacheKey) {
    return withFallback(
      async () => {
        for (const entry of providers) {
          try {
            const value = await entry.fetch()
            if (value != null) return value
          } catch {
            continue
          }
        }
        return null
      },
      fallback,
      {
        provider: providers.map((p) => p.name).join("->"),
        cacheKey: options.cacheKey,
        cacheTtlMs: options.cacheTtlMs,
      },
    )
  }

  for (const entry of providers) {
    try {
      const value = await entry.fetch()
      if (value != null) return result(value, "live", entry.name)
    } catch {
      continue
    }
  }

  return result(fallback(), "mock", "mock")
}
