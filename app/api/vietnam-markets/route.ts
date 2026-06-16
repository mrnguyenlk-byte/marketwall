import { getData, getMockData } from "@/lib/providers/vietnam-market-provider"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getData()
    return Response.json(
      toApiJson({
        source: data.source,
        volumeUnit: data.volumeUnit,
        indices: data.indices,
        heatmapMarket: data.heatmapMarket,
        heatmapStocks: data.heatmapStocks,
        dashboard: data.dashboard,
        heatmapProvider: data.heatmapProvider,
        enrichmentProvider: data.enrichmentProvider,
        analytics: data.analytics,
      }),
    )
  } catch {
    const mock = getMockData()
    return Response.json(
      toApiJsonFromMock({
        source: mock.source,
        volumeUnit: mock.volumeUnit,
        indices: mock.indices,
        heatmapMarket: mock.heatmapMarket,
        heatmapStocks: mock.heatmapStocks,
        dashboard: mock.dashboard,
        analytics: mock.analytics,
      }),
    )
  }
}
