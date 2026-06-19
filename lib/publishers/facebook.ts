import { SITE_DOMAIN } from "@/lib/brand"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import { resolveTelegramPhotoUrl } from "@/lib/publishers/telegram"

const FACEBOOK_CAPTION_MAX = 63206
const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v25.0"

export type FacebookPublishResult =
  | { ok: true; postId?: string; photoId?: string }
  | { ok: false; error: string }

type FacebookPhotoResponse = {
  id?: string
  post_id?: string
  error?: { message?: string }
}

function facebookEnv(): { pageId: string; accessToken: string } | null {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim()
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim()
  if (!pageId || !accessToken) return null
  return { pageId, accessToken }
}

function dailyAnalysisUrl(slug: string): string {
  return `${SITE_DOMAIN}/daily-analysis/${slug}`
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  if (maxLen <= 1) return text.slice(0, maxLen)
  return `${text.slice(0, maxLen - 1).trimEnd()}…`
}

function buildFacebookCaption(article: DailyAnalysis): string {
  const linkBlock = `Đọc đầy đủ:\n${dailyAnalysisUrl(article.slug)}`
  const hashtags = "#BTrading #VNIndex #Gold #MarketAnalysis"
  const suffix = `\n\n${linkBlock}\n\n${hashtags}`

  const title = article.title.trim()
  const summary = article.summary.trim()
  const vnLabel = "VNIndex:"
  const goldLabel = "Gold:"

  let vnText = article.vnindexAnalysis.trim()
  let goldText = article.goldAnalysis.trim()

  const header = `${title}\n\n${summary}\n\n${vnLabel}\n`
  const goldSectionPrefix = `\n\n${goldLabel}\n`
  const maxBody = FACEBOOK_CAPTION_MAX - suffix.length

  let bodyBudget = maxBody - header.length - goldSectionPrefix.length
  if (bodyBudget < 80) {
    return truncateText(`${title}\n\n${summary}${suffix}`, FACEBOOK_CAPTION_MAX)
  }

  if (vnText.length + goldText.length > bodyBudget) {
    const halfBudget = Math.floor(bodyBudget / 2)
    vnText = truncateText(vnText, Math.max(40, halfBudget))
    goldText = truncateText(goldText, Math.max(40, bodyBudget - vnText.length))
  }

  let body = `${header}${vnText}${goldSectionPrefix}${goldText}${suffix}`
  if (body.length > FACEBOOK_CAPTION_MAX) {
    body = truncateText(body, FACEBOOK_CAPTION_MAX)
  }

  return body
}

export async function publishDailyAnalysisToFacebook(
  article: DailyAnalysis,
): Promise<FacebookPublishResult> {
  const env = facebookEnv()
  if (!env) {
    return { ok: false, error: "skipped: missing env" }
  }

  if (!article.vnindexImage?.trim()) {
    return { ok: false, error: "No VNIndex image available to publish" }
  }

  const photoUrl = resolveTelegramPhotoUrl(article.vnindexImage)
  const caption = buildFacebookCaption(article)

  const body = new URLSearchParams()
  body.set("url", photoUrl)
  body.set("caption", caption)
  body.set("access_token", env.accessToken)

  let response: Response
  try {
    response = await fetch(`${FACEBOOK_GRAPH_API}/${env.pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Facebook request failed"
    return { ok: false, error: message }
  }

  let payload: FacebookPhotoResponse
  try {
    payload = (await response.json()) as FacebookPhotoResponse
  } catch {
    return { ok: false, error: `Facebook API returned HTTP ${response.status}` }
  }

  if (!response.ok || payload.error) {
    const detail = payload.error?.message ?? `HTTP ${response.status}`
    return { ok: false, error: detail }
  }

  if (!payload.id) {
    return { ok: false, error: "Facebook API did not return a photo id" }
  }

  return {
    ok: true,
    photoId: payload.id,
    postId: payload.post_id,
  }
}
