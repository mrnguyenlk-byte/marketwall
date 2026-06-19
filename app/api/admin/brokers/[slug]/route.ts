import { put } from "@vercel/blob"

import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ slug: string }> }

const MAX_LOGO_BYTES = 5 * 1024 * 1024

async function uploadBrokerLogo(slug: string, file: File): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is required for logo upload")
  if (file.size <= 0 || file.size > MAX_LOGO_BYTES) throw new Error("Invalid logo file size")

  const buffer = Buffer.from(await file.arrayBuffer())
  const blob = await put(`admin/brokers/${slug}.png`, buffer, {
    access: "public",
    contentType: file.type || "image/png",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  return blob.url
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
  let logoUrl: string | undefined
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await uploadBrokerLogo(slug, logoFile)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logo upload failed"
      return Response.json({ error: message }, { status: 400 })
    }
  }

  const broker = await prisma.broker.update({
    where: { slug },
    data: {
      name: String(formData.get("name") ?? "").trim() || undefined,
      initials: String(formData.get("initials") ?? "").trim() || undefined,
      category: String(formData.get("category") ?? "").trim() || undefined,
      websiteUrl: String(formData.get("websiteUrl") ?? "").trim() || undefined,
      affiliateUrl: String(formData.get("affiliateUrl") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      rating: formData.has("rating") ? Number(formData.get("rating")) : undefined,
      minDeposit: String(formData.get("minDeposit") ?? "").trim() || undefined,
      minDepositValue: formData.has("minDepositValue")
        ? Number(formData.get("minDepositValue"))
        : undefined,
      trustScore: formData.has("trustScore") ? Number(formData.get("trustScore")) : undefined,
      spread: String(formData.get("spread") ?? "").trim() || undefined,
      spreadValue: formData.has("spreadValue") ? Number(formData.get("spreadValue")) : undefined,
      leverage: String(formData.get("leverage") ?? "").trim() || undefined,
      isActive: formData.has("isActive") ? formData.get("isActive") === "true" : undefined,
      featured: formData.has("featured") ? formData.get("featured") === "true" : undefined,
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
