import { getData, getMockData } from "@/lib/providers/crypto-provider"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getData()
    return Response.json(
      toApiJson({
        source: data.source,
        assets: data.assets,
        heatmapTiles: data.heatmapTiles,
      }),
    )
  } catch {
    const mock = getMockData()
    return Response.json(
      toApiJsonFromMock({
        source: mock.source,
        assets: mock.assets,
        heatmapTiles: mock.heatmapTiles,
      }),
    )
  }
}
