import { fetchLiveCurrencyStrength, fetchMockCurrencyStrength } from "@/lib/market/currency-strength"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"
import { CACHE_KEYS, CACHE_TTL, cachedProvider } from "@/lib/providers/cache"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cached = await cachedProvider(
      CACHE_KEYS.currencyStrength,
      async () => {
        const result = await fetchLiveCurrencyStrength()
        return {
          data: result,
          source: result.source,
        }
      },
      { ttlMs: CACHE_TTL.forex },
    )

    const result = cached?.data ?? (await fetchLiveCurrencyStrength())

    return Response.json(
      toApiJson({
        source: result.source,
        items: result.items,
        unavailable: result.unavailable,
        pairCount: result.pairCount,
        coverage: result.coverage,
      }),
    )
  } catch {
    const fallback = fetchMockCurrencyStrength()
    return Response.json(
      toApiJsonFromMock({
        source: fallback.source,
        items: fallback.items,
        unavailable: fallback.unavailable,
        pairCount: fallback.pairCount,
        coverage: fallback.coverage,
      }),
    )
  }
}
