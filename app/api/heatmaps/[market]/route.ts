import {
  fetchHeatmapMarket,
  resolveHeatmapMarketParam,
} from "@/lib/market/heatmap"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"
import { CACHE_KEYS, CACHE_TTL, cachedProvider } from "@/lib/providers/cache"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ market: string }>
}

function cacheKeyForMarket(market: string) {
  if (market === "vn") return CACHE_KEYS.heatmapVietnam
  if (market === "us") return CACHE_KEYS.heatmapUs
  return CACHE_KEYS.heatmapCrypto
}

export async function GET(_request: Request, context: RouteContext) {
  const { market: rawMarket } = await context.params
  const market = resolveHeatmapMarketParam(rawMarket)

  if (!market) {
    return Response.json({ error: "Unknown heatmap market" }, { status: 404 })
  }

  try {
    const cached = await cachedProvider(
      cacheKeyForMarket(market),
      async () => {
        const data = await fetchHeatmapMarket(market)
        return { data, source: data.source === "live" ? ("live" as const) : ("mock" as const) }
      },
      { ttlMs: CACHE_TTL.heatmap },
    )

    const payload = cached?.data ?? (await fetchHeatmapMarket(market))

    return Response.json(
      toApiJson({
        source: payload.source,
        items: payload.items,
        unavailable: payload.unavailable,
      }),
    )
  } catch {
    return Response.json(
      toApiJsonFromMock({
        source: "mock",
        items: [],
        unavailable: true,
      }),
    )
  }
}
