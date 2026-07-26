import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"
import { persistBrokerLogoFromWebsite } from "@/lib/brokers/logo-fetch"
import { readOfferPolicyFromFormData } from "@/lib/brokers/offer-policy"
import { prisma } from "@/lib/prisma"
import { isR2Configured, putR2Object } from "@/lib/r2"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ slug: string }> }

const MAX_LOGO_BYTES = 5 * 1024 * 1024

async function uploadBrokerLogo(slug: string, file: File): Promise<string> {
  if (!isR2Configured()) throw new Error("Cloudflare R2 is required for logo upload")
  if (file.size <= 0 || file.size > MAX_LOGO_BYTES) throw new Error("Invalid logo file size")

  const buffer = Buffer.from(await file.arrayBuffer())
  return putR2Object({
    key: `admin/brokers/${slug}.png`,
    body: buffer,
    contentType: file.type || "image/png",
  })
}

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const { slug } = await context.params
  const broker = await prisma.broker.findUnique({ where: { slug } })
  if (!broker) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ broker })
}

export async function PUT(request: Request, context: RouteContext) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const { slug } = await context.params
  const formData = await request.formData()

  const logoFile = formData.get("logo")
  const autoFetchLogo = formData.get("autoFetchLogo") === "true"
  let logoUrl: string | undefined
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await uploadBrokerLogo(slug, logoFile)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logo upload failed"
      return Response.json({ error: message }, { status: 400 })
    }
  } else if (autoFetchLogo) {
    const websiteUrl = String(formData.get("websiteUrl") ?? "").trim()
    const existing = await prisma.broker.findUnique({ where: { slug }, select: { websiteUrl: true } })
    const url = websiteUrl || existing?.websiteUrl
    if (url) {
      try {
        const fetched = await persistBrokerLogoFromWebsite(slug, url)
        if (fetched) logoUrl = fetched
      } catch {
        return Response.json({ error: "Could not fetch logo from website" }, { status: 400 })
      }
    }
    if (autoFetchLogo && !logoUrl && !websiteUrl && !existing?.websiteUrl) {
      return Response.json({ error: "Website URL required to fetch logo" }, { status: 400 })
    }
  }

  const offerPolicy = formData.has("backcomType")
    ? readOfferPolicyFromFormData(formData)
    : undefined

  const broker = await prisma.broker.update({
    where: { slug },
    data: {
      name: String(formData.get("name") ?? "").trim() || undefined,
      initials: String(formData.get("initials") ?? "").trim() || undefined,
      category: String(formData.get("category") ?? "").trim() || undefined,
      websiteUrl: String(formData.get("websiteUrl") ?? "").trim() || undefined,
      affiliateUrl: formData.has("affiliateUrl")
        ? String(formData.get("affiliateUrl") ?? "").trim() || null
        : undefined,
      description: formData.has("description")
        ? String(formData.get("description") ?? "").trim() || null
        : undefined,
      rating: formData.has("rating") ? Number(formData.get("rating")) : undefined,
      minDeposit: formData.has("minDeposit")
        ? String(formData.get("minDeposit") ?? "").trim() || undefined
        : undefined,
      minDepositValue: formData.has("minDepositValue")
        ? Number(formData.get("minDepositValue"))
        : undefined,
      trustScore: formData.has("trustScore") ? Number(formData.get("trustScore")) : undefined,
      spread: formData.has("spread")
        ? String(formData.get("spread") ?? "").trim() || undefined
        : undefined,
      spreadValue: formData.has("spreadValue") ? Number(formData.get("spreadValue")) : undefined,
      leverage: formData.has("leverage")
        ? String(formData.get("leverage") ?? "").trim() || undefined
        : undefined,
      isActive: formData.has("isActive") ? formData.get("isActive") === "true" : undefined,
      featured: formData.has("featured") ? formData.get("featured") === "true" : undefined,
      ...(offerPolicy ?? {}),
      ...(logoUrl ? { logoUrl } : {}),
    },
  })

  return Response.json({ broker })
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const { slug } = await context.params
  const body = (await request.json()) as { isActive?: boolean; featured?: boolean }

  const broker = await prisma.broker.update({
    where: { slug },
    data: {
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      ...(typeof body.featured === "boolean" ? { featured: body.featured } : {}),
    },
  })

  return Response.json({ broker })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const { slug } = await context.params
  await prisma.broker.delete({ where: { slug } })
  return Response.json({ ok: true })
}
