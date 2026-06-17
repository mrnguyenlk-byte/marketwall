import {
  getLiveOverride,
  getPlatformUrl,
  LIVE_PLATFORM_PRIORITY,
  livestreamConfig,
  type LivePlatform,
} from "@/lib/livestream-config"

export type LivestreamStatus = {
  isLive: boolean
  activePlatform: LivePlatform | null
  url: string
}

const FETCH_TIMEOUT_MS = 8_000
const USER_AGENT =
  "Mozilla/5.0 (compatible; BTradingLiveBot/1.0; +https://btrading.vn)"

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 0 },
    })
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  }
}

function extractYouTubeChannelId(url: string): string | null {
  const handleMatch = url.match(/youtube\.com\/@([^/?#]+)/i)
  if (handleMatch) return `@${handleMatch[1]}`

  const channelMatch = url.match(/youtube\.com\/channel\/([^/?#]+)/i)
  if (channelMatch) return channelMatch[1]

  return null
}

async function detectYouTubeLive(): Promise<boolean> {
  const override = getLiveOverride("youtube")
  if (override !== null) return override

  const apiKey = livestreamConfig.youtubeApiKey
  const channelRef = extractYouTubeChannelId(livestreamConfig.youtubeUrl)

  if (apiKey && channelRef) {
    try {
      const param = channelRef.startsWith("@")
        ? `forHandle=${encodeURIComponent(channelRef.slice(1))}`
        : `id=${encodeURIComponent(channelRef)}`
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&${param}&type=video&eventType=live&maxResults=1&key=${apiKey}`
      const response = await fetch(apiUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
      if (response.ok) {
        const data = (await response.json()) as { items?: unknown[] }
        return Array.isArray(data.items) && data.items.length > 0
      }
    } catch {
      // fall through to page scrape
    }
  }

  const html = await fetchText(livestreamConfig.youtubeUrl)
  if (!html) return false

  return (
    html.includes('"isLive":true') ||
    html.includes('"isLiveNow":true') ||
    html.includes('"badgeStyle":"LIVE"') ||
    html.includes("LIVE_NOW_BADGE") ||
    /"liveBroadcastDetails"/.test(html)
  )
}

async function detectFacebookLive(): Promise<boolean> {
  const override = getLiveOverride("facebook")
  if (override !== null) return override

  const html = await fetchText(livestreamConfig.facebookLiveUrl)
  if (!html) return false

  return (
    html.includes('"is_live":true') ||
    html.includes('"isLive":true') ||
    /"video_status":"LIVE"/i.test(html) ||
    /"is_live_streaming":true/i.test(html)
  )
}

async function detectTikTokLive(): Promise<boolean> {
  const override = getLiveOverride("tiktok")
  if (override !== null) return override

  const html = await fetchText(livestreamConfig.tiktokUrl)
  if (!html) return false

  return (
    html.includes('"LiveRoom"') ||
    html.includes('"room_id"') ||
    /"status":2/.test(html) ||
    /is_live":true/i.test(html)
  )
}

const detectors: Record<LivePlatform, () => Promise<boolean>> = {
  youtube: detectYouTubeLive,
  facebook: detectFacebookLive,
  tiktok: detectTikTokLive,
}

export async function getLivestreamStatus(): Promise<LivestreamStatus> {
  const offlineUrl = livestreamConfig.facebookPageUrl

  const results = await Promise.all(
    LIVE_PLATFORM_PRIORITY.map(async (platform) => ({
      platform,
      isLive: await detectors[platform](),
    })),
  )

  const active = results.find((r) => r.isLive)

  if (!active) {
    return { isLive: false, activePlatform: null, url: offlineUrl }
  }

  return {
    isLive: true,
    activePlatform: active.platform,
    url: getPlatformUrl(active.platform),
  }
}
