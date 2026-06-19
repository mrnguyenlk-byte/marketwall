import { put } from "@vercel/blob"

import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"
import { brokerCreateDefaults, slugify } from "@/lib/admin/broker-defaults"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const MAX_LOGO_BYTES = 5 * 1024 * 1024

async function uploadBrokerLogo(slug: string, file: File): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for logo upload")
  }
  if (file.size <= 0 || file.size > MAX_LOGO_BYTES) {
    throw new Error("Invalid logo file size")
  }

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

export async function GET() {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const brokers = await prisma.broker.findMany({
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    select: {
      slug: true,
      name: true,
      category: true,
      rating: true,
      minDeposit: true,
      isActive: true,
      featured: true,
      logoUrl: true,
    },
  })

  return Response.json({ brokers })
}

export async function POST(request: Request) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 })
  }

  const slug = slugify(String(formData.get("slug") ?? ""))
  const name = String(formData.get("name") ?? "").trim()
  const initials = String(formData.get("initials") ?? "").trim()
  const category = String(formData.get("category") ?? "global").trim()
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim()

  if (!slug || !name || !initials || !websiteUrl) {
    return Response.json({ error: "slug, name, initials, and websiteUrl are required" }, { status: 400 })
  }

  const logoFile = formData.get("logo")
  let logoUrl: string | null = null
  if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await uploadBrokerLogo(slug, logoFile)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logo upload failed"
      return Response.json({ error: message }, { status: 400 })
    }
  }

  const data = brokerCreateDefaults({
    slug,
    name,
    initials,
    category,
    websiteUrl,
    affiliateUrl: String(formData.get("affiliateUrl") ?? "").trim() || null,
    logoUrl,
    description: String(formData.get("description") ?? "").trim() || null,
    rating: Number(formData.get("rating") ?? 4.5),
    trustScore: Number(formData.get("trustScore") ?? 85),
    minDeposit: String(formData.get("minDeposit") ?? "$100"),
    minDepositValue: Number(formData.get("minDepositValue") ?? 100),
    spread: String(formData.get("spread") ?? "0.5 pips"),
    spreadValue: Number(formData.get("spreadValue") ?? 0.5),
    leverage: String(formData.get("leverage") ?? "1:500"),
    isActive: formData.get("isActive") !== "false",
    featured: formData.get("featured") === "true",
  })

  try {
    const broker = await prisma.broker.create({ data })
    return Response.json({ broker }, { status: 201 })
  } catch {
    return Response.json({ error: "Broker already exists or invalid data" }, { status: 400 })
  }
}
