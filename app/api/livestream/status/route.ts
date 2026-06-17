import { getLivestreamStatus } from "@/lib/livestream/detect"

export const dynamic = "force-dynamic"

let cache: { data: Awaited<ReturnType<typeof getLivestreamStatus>>; ts: number } | null = null
const CACHE_MS = 30_000

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_MS) {
      return Response.json(cache.data)
    }

    const data = await getLivestreamStatus()
    cache = { data, ts: Date.now() }
    return Response.json(data)
  } catch {
    return Response.json({
      isLive: false,
      activePlatform: null,
      url:
        process.env.LIVESTREAM_FACEBOOK_PAGE ??
        process.env.NEXT_PUBLIC_LIVESTREAM_FACEBOOK_PAGE ??
        "https://www.facebook.com/your-page",
    })
  }
}
