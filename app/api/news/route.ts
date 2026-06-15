import { getData, getMockData } from "@/lib/providers/news-provider"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getData()
    return Response.json({
      source: data.source,
      items: data.normalized,
      uiItems: data.items,
    })
  } catch {
    const mock = getMockData()
    return Response.json({
      source: mock.source,
      items: mock.normalized,
      uiItems: mock.items,
    })
  }
}
