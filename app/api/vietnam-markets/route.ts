import { getData, getMockData } from "@/lib/providers/vietnam-market-provider"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getData()
    return Response.json(
      toApiJson({
        source: data.source,
        indices: data.indices,
        heatmapMarket: data.heatmapMarket,
        heatmapStocks: data.heatmapStocks,
      }),
    )
  } catch {
    const mock = getMockData()
    return Response.json(
      toApiJsonFromMock({
        source: mock.source,
        indices: mock.indices,
        heatmapMarket: mock.heatmapMarket,
        heatmapStocks: mock.heatmapStocks,
      }),
    )
  }
}
