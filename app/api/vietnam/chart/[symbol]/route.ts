import { computeMaBundle } from "@/lib/vietnam/chart-indicators"
import { cachedProvider } from "@/lib/providers/cache"
import { fetchVietnamChartHistory } from "@/lib/providers/vietnam-chart-provider"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ symbol: string }> }

const CACHE_TTL_MS = 300_000

export async function GET(_request: Request, context: RouteContext) {
  const { symbol } = await context.params
  const ticker = symbol?.trim().toUpperCase()

  if (!ticker || !/^[A-Z0-9]{2,10}$/.test(ticker)) {
    return Response.json({ error: "Invalid symbol" }, { status: 400 })
  }

  try {
    const cacheKey = `api:vietnam:chart:${ticker}`
    const cached = await cachedProvider(
      cacheKey,
      async () => {
        const payload = await fetchVietnamChartHistory(ticker)
        return payload ? { data: payload, source: "live" as const } : null
      },
      { ttlMs: CACHE_TTL_MS },
    )

    if (!cached?.data) {
      return Response.json({ symbol: ticker, unavailable: true, bars: [] }, { status: 404 })
    }

    const { ma10, ma20, ma50 } = computeMaBundle(cached.data.bars)

    return Response.json({
      ...cached.data,
      ma10,
      ma20,
      ma50,
      unavailable: false,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    return Response.json({ symbol: ticker, unavailable: true, bars: [] }, { status: 500 })
  }
}
