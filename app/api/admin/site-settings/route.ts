import { isAdminApiError, requireAdminApi } from "@/lib/admin/auth"
import { parseOptionalUrl } from "@/lib/brokers/offer-policy"
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

  const liveUrlParsed = parseOptionalUrl(typeof body.liveUrl === "string" ? body.liveUrl : null)
  if (!liveUrlParsed.ok) {
    return Response.json({ error: `Live Link: ${liveUrlParsed.error}` }, { status: 400 })
  }

  const liveStreamUrlParsed = parseOptionalUrl(
    typeof body.liveStreamUrl === "string" ? body.liveStreamUrl : null,
  )
  if (!liveStreamUrlParsed.ok) {
    return Response.json(
      { error: `Live stream (TikTok/YouTube/Facebook): ${liveStreamUrlParsed.error}` },
      { status: 400 },
    )
  }

  const telegramParsed = parseOptionalUrl(
    typeof body.telegramLink === "string" ? body.telegramLink : null,
  )
  const facebookParsed = parseOptionalUrl(
    typeof body.facebookLink === "string" ? body.facebookLink : null,
  )
  const zaloParsed = parseOptionalUrl(
    typeof body.zaloLink === "string" ? body.zaloLink : null,
  )
  const communityCtaUrlParsed = parseOptionalUrl(
    typeof body.communityCtaUrl === "string" ? body.communityCtaUrl : null,
  )
  if (!telegramParsed.ok) {
    return Response.json({ error: `Telegram link: ${telegramParsed.error}` }, { status: 400 })
  }
  if (!facebookParsed.ok) {
    return Response.json({ error: `Facebook link: ${facebookParsed.error}` }, { status: 400 })
  }
  if (!zaloParsed.ok) {
    return Response.json({ error: `Zalo link: ${zaloParsed.error}` }, { status: 400 })
  }
  if (!communityCtaUrlParsed.ok) {
    return Response.json(
      { error: `Community CTA link: ${communityCtaUrlParsed.error}` },
      { status: 400 },
    )
  }

  const settings = await upsertSiteSettings({
    email: typeof body.email === "string" ? body.email.trim() || null : null,
    phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
    telegramLink: telegramParsed.value,
    facebookLink: facebookParsed.value,
    zaloLink: zaloParsed.value,
    liveUrl: liveUrlParsed.value,
    liveStreamUrl: liveStreamUrlParsed.value,
    communityCtaUrl: communityCtaUrlParsed.value,
    communityCta:
      typeof body.communityCta === "string" ? body.communityCta.trim() || null : null,
    footerContent:
      typeof body.footerContent === "string" ? body.footerContent.trim() || null : null,
  })

  return Response.json({ settings })
}
