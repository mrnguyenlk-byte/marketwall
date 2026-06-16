import { fetchTradingEconomicsCalendar } from "@/lib/api/tradingEconomics"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"
import { getMockData } from "@/lib/providers/economic-provider"
import { CACHE_KEYS, cachedProvider } from "@/lib/providers/cache"

export const dynamic = "force-dynamic"

const CACHE_TTL_MS = 600_000

function mockEvents() {
  return getMockData().normalized.map((record) => ({
    time: record.time,
    country: record.country,
    event: record.event,
    impact: record.impact,
    forecast: record.forecast,
    actual: record.actual,
    previous: record.previous,
  }))
}

export async function GET() {
  try {
    const cached = await cachedProvider(
      CACHE_KEYS.events,
      async () => {
        const events = await fetchTradingEconomicsCalendar()
        if (!events.length) return null
        return { data: events, source: "live" as const }
      },
      { ttlMs: CACHE_TTL_MS },
    )

    const events = cached?.data ?? (await fetchTradingEconomicsCalendar())
    if (events.length) {
      return Response.json(
        toApiJson({
          source: cached?.source === "live" ? "live" : "mock",
          events,
        }),
      )
    }

    return Response.json(
      toApiJsonFromMock({
        source: "mock",
        events: mockEvents(),
      }),
    )
  } catch {
    return Response.json(
      toApiJsonFromMock({
        source: "mock",
        events: mockEvents(),
      }),
    )
  }
}
