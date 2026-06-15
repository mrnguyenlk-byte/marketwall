import { getData, getMockData } from "@/lib/providers/global-market-provider"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getData()
    return Response.json({
      source: data.source,
      quotes: data.quotes,
    })
  } catch {
    const mock = getMockData()
    return Response.json({
      source: mock.source,
      quotes: mock.quotes,
    })
  }
}
