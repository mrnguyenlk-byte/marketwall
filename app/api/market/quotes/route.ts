import { fetchMarketQuotes, getMockMarketQuotes } from "@/lib/api/market-quotes"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"
import { CACHE_KEYS, cachedProvider } from "@/lib/providers/cache"

export const dynamic = "force-dynamic"

const CACHE_TTL_MS = 30_000

export async function GET() {
  try {
    const cached = await cachedProvider(
      CACHE_KEYS.marketQuotes,
      async () => {
        const data = await fetchMarketQuotes()
        return { data, source: data.source === "live" ? ("live" as const) : ("mock" as const) }
      },
      { ttlMs: CACHE_TTL_MS },
    )

    const payload = cached?.data ?? (await fetchMarketQuotes())

    return Response.json(
      toApiJson({
        source: payload.source,
        quotes: payload.quotes,
      }),
    )
  } catch {
    const mock = getMockMarketQuotes()
    return Response.json(
      toApiJsonFromMock({
        source: "mock",
        quotes: mock,
      }),
    )
  }
}
