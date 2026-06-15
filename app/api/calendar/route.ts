import { getData, getMockData } from "@/lib/providers/calendar-provider"
import { toApiJson, toApiJsonFromMock } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getData()
    return Response.json(
      toApiJson({
        source: data.source,
        items: data.normalized,
        uiEvents: data.events,
      }),
    )
  } catch {
    const mock = getMockData()
    return Response.json(
      toApiJsonFromMock({
        source: mock.source,
        items: mock.normalized,
        uiEvents: mock.events,
      }),
    )
  }
}
