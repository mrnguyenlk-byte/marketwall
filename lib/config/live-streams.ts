/** Live stream platform URLs — edit here or override via NEXT_PUBLIC_LIVE_STREAM_* env vars. */
export const LIVE_STREAM_URLS = {
  youtube:
    process.env.NEXT_PUBLIC_LIVE_STREAM_YOUTUBE ??
    "https://www.youtube.com/@your-channel/live",
  facebook:
    process.env.NEXT_PUBLIC_LIVE_STREAM_FACEBOOK ??
    "https://www.facebook.com/your-page/live",
  tiktok:
    process.env.NEXT_PUBLIC_LIVE_STREAM_TIKTOK ??
    "https://www.tiktok.com/@your-handle/live",
} as const

/** Primary link target when user clicks LIVE (YouTube preferred). */
export const PRIMARY_LIVE_STREAM_URL = LIVE_STREAM_URLS.youtube

/** Toggle live indicator: set NEXT_PUBLIC_LIVE_STREAM_ACTIVE=true in .env.local */
export function isLiveStreamActive(): boolean {
  return process.env.NEXT_PUBLIC_LIVE_STREAM_ACTIVE === "true"
}
