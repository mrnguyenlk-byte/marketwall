import { getData, getMockData } from "@/lib/providers/crypto-provider"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getData()
    return Response.json({
      source: data.source,
      assets: data.assets,
      heatmapTiles: data.heatmapTiles,
    })
  } catch {
    const mock = getMockData()
    return Response.json({
      source: mock.source,
      assets: mock.assets,
      heatmapTiles: mock.heatmapTiles,
    })
  }
}
