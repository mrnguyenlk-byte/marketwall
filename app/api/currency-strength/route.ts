import { fetchLiveCurrencyStrength, fetchMockCurrencyStrength } from "@/lib/market/currency-strength"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"
import {
  CACHE_KEYS,
  CACHE_TTL,
  cachedProvider,
  getCacheTiming,
} from "@/lib/providers/cache"

export const dynamic = "force-dynamic"

const TTL_MS = CACHE_TTL.currencyStrength

function resolveCacheTimestamps(): { updatedAt: string; nextUpdateAt: string } {
  const timing = getCacheTiming(CACHE_KEYS.currencyStrength)
  const now = Date.now()

  if (timing) {
    return {
      updatedAt: new Date(timing.cachedAt).toISOString(),
      nextUpdateAt: new Date(timing.expiresAt).toISOString(),
    }
  }

  return {
    updatedAt: new Date(now).toISOString(),
    nextUpdateAt: new Date(now + TTL_MS).toISOString(),
  }
}

export async function GET() {
  try {
    const cached = await cachedProvider(
      CACHE_KEYS.currencyStrength,
      async () => {
        const result = await fetchLiveCurrencyStrength()
        return {
          data: result,
          source: result.source === "mock" ? "mock" : "live",
        }
      },
      { ttlMs: TTL_MS },
    )

    const result = cached?.data ?? (await fetchLiveCurrencyStrength())
    const { updatedAt, nextUpdateAt } = resolveCacheTimestamps()

    return Response.json(
      toApiJson({
        source: result.source,
        items: result.items,
        unavailable: result.unavailable,
        pairCount: result.pairCount,
        coverage: result.coverage,
        updatedAt,
        nextUpdateAt,
      }),
    )
  } catch {
    const fallback = fetchMockCurrencyStrength()
    const now = Date.now()
    return Response.json(
      toApiJsonFromMock({
        source: fallback.source,
        items: fallback.items,
        unavailable: fallback.unavailable,
        pairCount: fallback.pairCount,
        coverage: fallback.coverage,
        updatedAt: new Date(now).toISOString(),
        nextUpdateAt: new Date(now + TTL_MS).toISOString(),
      }),
    )
  }
}
