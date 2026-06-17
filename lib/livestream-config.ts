import "server-only"

/**
 * Livestream URLs and manual override flags (server-side).
 *
 * URLs:
 *   LIVESTREAM_FACEBOOK_PAGE — Facebook page when offline (also NEXT_PUBLIC_LIVESTREAM_FACEBOOK_PAGE for client fallback)
 *   LIVESTREAM_YOUTUBE_URL — YouTube channel /live URL
 *   LIVESTREAM_FACEBOOK_LIVE_URL — Facebook live URL (defaults to page + /live)
 *   LIVESTREAM_TIKTOK_URL — TikTok live URL
 *
 * Legacy NEXT_PUBLIC_LIVE_STREAM_* vars are still accepted as fallbacks.
 *
 * Manual live overrides (skip auto-detection when set to true or false):
 *   LIVESTREAM_YOUTUBE, LIVESTREAM_FACEBOOK, LIVESTREAM_TIKTOK
 *
 * Optional: YOUTUBE_API_KEY for YouTube Data API live checks.
 */
export type LivePlatform = "youtube" | "facebook" | "tiktok"

const DEFAULT_FACEBOOK_PAGE = "https://www.facebook.com/your-page"

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }
  return undefined
}

function stripLiveSuffix(url: string): string {
  return url.replace(/\/live\/?$/, "")
}

export const livestreamConfig = {
  facebookPageUrl:
    firstEnv("LIVESTREAM_FACEBOOK_PAGE", "NEXT_PUBLIC_LIVESTREAM_FACEBOOK_PAGE") ??
    stripLiveSuffix(
      firstEnv("NEXT_PUBLIC_LIVE_STREAM_FACEBOOK") ?? `${DEFAULT_FACEBOOK_PAGE}/live`,
    ),
  youtubeUrl:
    firstEnv("LIVESTREAM_YOUTUBE_URL", "NEXT_PUBLIC_LIVE_STREAM_YOUTUBE") ??
    "https://www.youtube.com/@your-channel/live",
  facebookLiveUrl:
    firstEnv("LIVESTREAM_FACEBOOK_LIVE_URL", "NEXT_PUBLIC_LIVE_STREAM_FACEBOOK") ??
    `${stripLiveSuffix(
      firstEnv("LIVESTREAM_FACEBOOK_PAGE", "NEXT_PUBLIC_LIVESTREAM_FACEBOOK_PAGE") ??
        DEFAULT_FACEBOOK_PAGE,
    )}/live`,
  tiktokUrl:
    firstEnv("LIVESTREAM_TIKTOK_URL", "NEXT_PUBLIC_LIVE_STREAM_TIKTOK") ??
    "https://www.tiktok.com/@your-handle/live",
  youtubeApiKey: firstEnv("YOUTUBE_API_KEY", "GOOGLE_API_KEY"),
} as const

export const LIVE_PLATFORM_PRIORITY: LivePlatform[] = ["youtube", "facebook", "tiktok"]

export function getPlatformUrl(platform: LivePlatform): string {
  switch (platform) {
    case "youtube":
      return livestreamConfig.youtubeUrl
    case "facebook":
      return livestreamConfig.facebookLiveUrl
    case "tiktok":
      return livestreamConfig.tiktokUrl
  }
}

/** Parse LIVESTREAM_* env as boolean override; null = use auto-detection. */
export function getLiveOverride(platform: LivePlatform): boolean | null {
  const key =
    platform === "youtube"
      ? "LIVESTREAM_YOUTUBE"
      : platform === "facebook"
        ? "LIVESTREAM_FACEBOOK"
        : "LIVESTREAM_TIKTOK"
  const value = process.env[key]
  if (value === "true") return true
  if (value === "false") return false
  return null
}
