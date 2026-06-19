import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import { buildDailyAnalysisSocialCaption } from "@/lib/publishers/daily-analysis-caption"
import { resolveTelegramPhotoUrl } from "@/lib/publishers/telegram"

const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v25.0"

type FacebookGraphError = {
  message?: string
  type?: string
  code?: number
  error_subcode?: number
  fbtrace_id?: string
}

export type FacebookPublishResult =
  | { ok: true; postId: string; photoIds: string[] }
  | {
      ok: false
      error: string
      errorCode?: number | string
      errorResponse?: FacebookGraphError | unknown
    }

type FacebookApiResponse = {
  id?: string
  post_id?: string
  error?: FacebookGraphError
}

function facebookEnv(): { pageId: string; accessToken: string } | null {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim()
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim()
  if (!pageId || !accessToken) return null
  return { pageId, accessToken }
}

function hasImage(image: string | undefined): boolean {
  return Boolean(image?.trim())
}

function failureFromPayload(
  payload: FacebookApiResponse,
  httpStatus: number,
): { ok: false; error: string; errorCode?: number; errorResponse?: unknown } {
  const graphError = payload.error
  const message = graphError?.message ?? `HTTP ${httpStatus}`
  return {
    ok: false,
    error: message,
    errorCode: graphError?.code ?? graphError?.error_subcode ?? httpStatus,
    errorResponse: graphError ?? payload,
  }
}

async function facebookApiPost(
  path: string,
  params: URLSearchParams,
): Promise<
  | { ok: true; payload: FacebookApiResponse }
  | { ok: false; error: string; errorCode?: number; errorResponse?: unknown }
> {
  let response: Response
  try {
    response = await fetch(`${FACEBOOK_GRAPH_API}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })
  } catch (error) {
    console.error("FACEBOOK_ERROR", error)
    console.error("FACEBOOK_ERROR_RESPONSE", undefined)
    const message = error instanceof Error ? error.message : "Facebook request failed"
    return { ok: false, error: message }
  }

  let payload: FacebookApiResponse
  try {
    payload = (await response.json()) as FacebookApiResponse
  } catch {
    const networkError = {
      ok: false as const,
      error: `Facebook API returned HTTP ${response.status}`,
      errorCode: response.status,
    }
    console.error("FACEBOOK_ERROR", networkError.error)
    console.error("FACEBOOK_ERROR_RESPONSE", { status: response.status })
    return networkError
  }

  if (!response.ok || payload.error) {
    const failed = failureFromPayload(payload, response.status)
    console.error("FACEBOOK_ERROR", failed.error)
    console.error("FACEBOOK_ERROR_RESPONSE", failed.errorResponse)
    return failed
  }

  return { ok: true, payload }
}

async function uploadUnpublishedPhoto(
  pageId: string,
  accessToken: string,
  photoUrl: string,
): Promise<{ ok: true; photoId: string } | { ok: false; error: string; errorCode?: number; errorResponse?: unknown }> {
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
): Promise<{ ok: true; postId: string } | { ok: false; error: string; errorCode?: number; errorResponse?: unknown }> {
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
): Promise<
  | { ok: true; postId: string; photoId: string }
  | { ok: false; error: string; errorCode?: number; errorResponse?: unknown }
> {
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
  console.log("FACEBOOK_START")

  const env = facebookEnv()
  if (!env) {
    console.error("FACEBOOK_ERROR", "skipped: missing env")
    return { ok: false, error: "skipped: missing env" }
  }

  const { pageId, accessToken } = env
  console.log("FACEBOOK_PAGE_ID", pageId)

  const hasVnindex = hasImage(article.vnindexImage)
  const hasGold = hasImage(article.goldImage)

  if (!hasVnindex && !hasGold) {
    const error = "No images available to publish"
    console.error("FACEBOOK_ERROR", error)
    return { ok: false, error }
  }

  const caption = buildDailyAnalysisSocialCaption(article)

  let result: FacebookPublishResult

  if (hasVnindex && !hasGold) {
    const photoUrl = resolveTelegramPhotoUrl(article.vnindexImage)
    const photo = await publishPublishedPhoto(pageId, accessToken, photoUrl, caption)
    if (!photo.ok) return photo
    result = { ok: true, postId: photo.postId, photoIds: [photo.photoId] }
    console.log("FACEBOOK_SUCCESS", result)
    return result
  }

  if (hasGold && !hasVnindex) {
    const photoUrl = resolveTelegramPhotoUrl(article.goldImage)
    const photo = await publishPublishedPhoto(pageId, accessToken, photoUrl, caption)
    if (!photo.ok) return photo
    result = { ok: true, postId: photo.postId, photoIds: [photo.photoId] }
    console.log("FACEBOOK_SUCCESS", result)
    return result
  }

  const vnindexUrl = resolveTelegramPhotoUrl(article.vnindexImage)
  const goldUrl = resolveTelegramPhotoUrl(article.goldImage)

  const vnUpload = await uploadUnpublishedPhoto(pageId, accessToken, vnindexUrl)
  if (!vnUpload.ok) return vnUpload

  const goldUpload = await uploadUnpublishedPhoto(pageId, accessToken, goldUrl)
  if (!goldUpload.ok) return goldUpload

  const feedPost = await createFeedPostWithMedia(pageId, accessToken, caption, [
    vnUpload.photoId,
    goldUpload.photoId,
  ])

  if (feedPost.ok) {
    result = {
      ok: true,
      postId: feedPost.postId,
      photoIds: [vnUpload.photoId, goldUpload.photoId],
    }
    console.log("FACEBOOK_SUCCESS", result)
    return result
  }

  const vnFallback = await publishPublishedPhoto(pageId, accessToken, vnindexUrl, caption)
  if (!vnFallback.ok) return vnFallback

  const goldFallback = await publishPublishedPhoto(pageId, accessToken, goldUrl)
  if (!goldFallback.ok) {
    return {
      ok: false,
      error: `VNIndex posted (id ${vnFallback.postId}) but gold image failed: ${goldFallback.error}`,
      errorCode: goldFallback.errorCode,
      errorResponse: goldFallback.errorResponse,
    }
  }

  result = {
    ok: true,
    postId: vnFallback.postId,
    photoIds: [vnFallback.photoId, goldFallback.photoId],
  }
  console.log("FACEBOOK_SUCCESS", result)
  return result
}

/** @deprecated Alias — use publishDailyAnalysisToFacebook */
export const publishToFacebook = publishDailyAnalysisToFacebook
