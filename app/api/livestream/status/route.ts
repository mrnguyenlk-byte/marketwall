import { getLivestreamStatus } from "@/lib/livestream/detect"
import { getSiteSettings, resolveLiveOverrideUrl } from "@/lib/site-settings"

export const dynamic = "force-dynamic"

let cache: { data: Awaited<ReturnType<typeof getLivestreamStatus>>; ts: number } | null = null
const CACHE_MS = 30_000

export async function GET() {
  try {
    const settings = await getSiteSettings()
    const liveUrl = resolveLiveOverrideUrl(settings)

    if (cache && Date.now() - cache.ts < CACHE_MS) {
      const cached = cache.data
      return Response.json(liveUrl ? { ...cached, url: liveUrl } : cached)
    }

    const data = await getLivestreamStatus()
    cache = { data, ts: Date.now() }
    return Response.json(liveUrl ? { ...data, url: liveUrl } : data)
  } catch {
    let fallbackUrl =
      process.env.LIVESTREAM_FACEBOOK_PAGE ??
      process.env.NEXT_PUBLIC_LIVESTREAM_FACEBOOK_PAGE ??
      "https://www.facebook.com/your-page"
    try {
      const settings = await getSiteSettings()
      const override = resolveLiveOverrideUrl(settings)
      if (override) fallbackUrl = override
    } catch {
      // keep env fallback
    }
    return Response.json({
      isLive: false,
      activePlatform: null,
      url: fallbackUrl,
    })
  }
}
