import { buildAffiliateUrl } from "@/lib/brokers/affiliate"
import { logBrokerClick } from "@/lib/brokers/click-store"
import { findBrokerBySlug } from "@/lib/brokers/registry"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get("slug")?.trim()
  const source = url.searchParams.get("source") ?? undefined
  const campaign = url.searchParams.get("campaign") ?? undefined

  if (!slug) {
    return Response.json({ error: "Missing slug parameter" }, { status: 400 })
  }

  const broker = findBrokerBySlug(slug)
  if (!broker) {
    return Response.json({ error: "Broker not found" }, { status: 404 })
  }

  await logBrokerClick({
    slug: broker.slug,
    referer: request.headers.get("referer") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
    source,
    campaign,
  })

  const destination = buildAffiliateUrl(broker, { source, campaign })
  return Response.redirect(destination, 302)
}
