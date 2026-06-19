import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"
import { getSiteSettings, upsertSiteSettings } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

export async function GET() {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const settings = await getSiteSettings()
  return Response.json({ settings })
}

export async function PUT(request: Request) {
  const authResult = await requireAdminApi()
  if (isAdminApiError(authResult)) return authResult

  const body = (await request.json()) as Record<string, unknown>
  const settings = await upsertSiteSettings({
    email: typeof body.email === "string" ? body.email.trim() || null : null,
    phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
    telegramLink:
      typeof body.telegramLink === "string" ? body.telegramLink.trim() || null : null,
    facebookLink:
      typeof body.facebookLink === "string" ? body.facebookLink.trim() || null : null,
    zaloLink: typeof body.zaloLink === "string" ? body.zaloLink.trim() || null : null,
    communityCta:
      typeof body.communityCta === "string" ? body.communityCta.trim() || null : null,
    footerContent:
      typeof body.footerContent === "string" ? body.footerContent.trim() || null : null,
  })

  return Response.json({ settings })
}
