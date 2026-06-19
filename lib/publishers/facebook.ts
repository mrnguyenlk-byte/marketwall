import { SITE_DOMAIN } from "@/lib/brand"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import { resolveTelegramPhotoUrl } from "@/lib/publishers/telegram"

const FACEBOOK_CAPTION_MAX = 63206
const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v25.0"

export type FacebookPublishResult =
  | { ok: true; postId: string; photoIds: string[] }
  | { ok: false; error: string }

type FacebookApiResponse = {
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

function hasImage(image: string | undefined): boolean {
  return Boolean(image?.trim())
}

async function facebookApiPost(
  path: string,
  params: URLSearchParams,
): Promise<{ ok: true; payload: FacebookApiResponse } | { ok: false; error: string }> {
  let response: Response
  try {
    response = await fetch(`${FACEBOOK_GRAPH_API}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Facebook request failed"
    return { ok: false, error: message }
  }

  let payload: FacebookApiResponse
  try {
    payload = (await response.json()) as FacebookApiResponse
  } catch {
    return { ok: false, error: `Facebook API returned HTTP ${response.status}` }
  }

  if (!response.ok || payload.error) {
    const detail = payload.error?.message ?? `HTTP ${response.status}`
    return { ok: false, error: detail }
  }

  return { ok: true, payload }
}

async function uploadUnpublishedPhoto(
  pageId: string,
  accessToken: string,
  photoUrl: string,
): Promise<{ ok: true; photoId: string } | { ok: false; error: string }> {
  const body = new URLSearchParams()
  body.set("url", photoUrl)
  body.set("published", "false")
  body.set("access_token", accessToken)

  const result = await facebookApiPost(`${pageId}/photos`, body)
  if (!result.ok) return result

  if (!result.payload.id) {
    return { ok: false, error: "Facebook API did not return a photo id" }
  }

  return { ok: true, photoId: result.payload.id }
}

async function createFeedPostWithMedia(
  pageId: string,
  accessToken: string,
  message: string,
  photoIds: string[],
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  const body = new URLSearchParams()
  body.set("message", message)
  body.set("access_token", accessToken)
  for (let i = 0; i < photoIds.length; i++) {
    body.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: photoIds[i] }))
  }

  const result = await facebookApiPost(`${pageId}/feed`, body)
  if (!result.ok) return result

  const postId = result.payload.id ?? result.payload.post_id
  if (!postId) {
    return { ok: false, error: "Facebook API did not return a post id" }
  }

  return { ok: true, postId }
}

async function publishPublishedPhoto(
  pageId: string,
  accessToken: string,
  photoUrl: string,
  caption?: string,
): Promise<{ ok: true; postId: string; photoId: string } | { ok: false; error: string }> {
  const body = new URLSearchParams()
  body.set("url", photoUrl)
  body.set("published", "true")
  body.set("access_token", accessToken)
  if (caption) {
    body.set("caption", caption)
  }

  const result = await facebookApiPost(`${pageId}/photos`, body)
  if (!result.ok) return result

  if (!result.payload.id) {
    return { ok: false, error: "Facebook API did not return a photo id" }
  }

  const postId = result.payload.post_id ?? result.payload.id
  return { ok: true, postId, photoId: result.payload.id }
}

export async function publishDailyAnalysisToFacebook(
  article: DailyAnalysis,
): Promise<FacebookPublishResult> {
  const env = facebookEnv()
  if (!env) {
    return { ok: false, error: "skipped: missing env" }
  }

  const hasVnindex = hasImage(article.vnindexImage)
  const hasGold = hasImage(article.goldImage)

  if (!hasVnindex && !hasGold) {
    return { ok: false, error: "No images available to publish" }
  }

  const caption = buildFacebookCaption(article)

  if (hasVnindex && !hasGold) {
    const photoUrl = resolveTelegramPhotoUrl(article.vnindexImage)
    const result = await publishPublishedPhoto(env.pageId, env.accessToken, photoUrl, caption)
    if (!result.ok) return result
    return { ok: true, postId: result.postId, photoIds: [result.photoId] }
  }

  if (hasGold && !hasVnindex) {
    const photoUrl = resolveTelegramPhotoUrl(article.goldImage)
    const result = await publishPublishedPhoto(env.pageId, env.accessToken, photoUrl, caption)
    if (!result.ok) return result
    return { ok: true, postId: result.postId, photoIds: [result.photoId] }
  }

  const vnindexUrl = resolveTelegramPhotoUrl(article.vnindexImage)
  const goldUrl = resolveTelegramPhotoUrl(article.goldImage)

  const vnUpload = await uploadUnpublishedPhoto(env.pageId, env.accessToken, vnindexUrl)
  if (!vnUpload.ok) return vnUpload

  const goldUpload = await uploadUnpublishedPhoto(env.pageId, env.accessToken, goldUrl)
  if (!goldUpload.ok) return goldUpload

  const feedPost = await createFeedPostWithMedia(
    env.pageId,
    env.accessToken,
    caption,
    [vnUpload.photoId, goldUpload.photoId],
  )

  if (feedPost.ok) {
    return {
      ok: true,
      postId: feedPost.postId,
      photoIds: [vnUpload.photoId, goldUpload.photoId],
    }
  }

  const vnFallback = await publishPublishedPhoto(
    env.pageId,
    env.accessToken,
    vnindexUrl,
    caption,
  )
  if (!vnFallback.ok) return vnFallback

  const goldFallback = await publishPublishedPhoto(env.pageId, env.accessToken, goldUrl)
  if (!goldFallback.ok) {
    return {
      ok: false,
      error: `VNIndex posted (id ${vnFallback.postId}) but gold image failed: ${goldFallback.error}`,
    }
  }

  return {
    ok: true,
    postId: vnFallback.postId,
    photoIds: [vnFallback.photoId, goldFallback.photoId],
  }
}
