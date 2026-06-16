import { logBrokerClick } from "@/lib/brokers/click-store"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      slug?: string
      source?: string
      campaign?: string
    }

    const slug = body.slug?.trim()
    if (!slug) {
      return Response.json({ error: "Missing slug" }, { status: 400 })
    }

    const event = await logBrokerClick({
      slug,
      referer: request.headers.get("referer") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      source: body.source,
      campaign: body.campaign,
    })

    return Response.json({ ok: true, id: event.id })
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }
}
