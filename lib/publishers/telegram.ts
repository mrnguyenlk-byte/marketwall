import { SITE_DOMAIN } from "@/lib/brand"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import { buildDailyAnalysisSocialCaption } from "@/lib/publishers/daily-analysis-caption"

const TELEGRAM_CAPTION_MAX = 1024
const TELEGRAM_API_BASE = "https://api.telegram.org"

export type TelegramPublishResult =
  | { ok: true; messageId: number }
  | { ok: false; error: string }

type TelegramSendPhotoResponse = {
  ok: boolean
  result?: { message_id: number }
  description?: string
}

type TelegramSendMediaGroupResponse = {
  ok: boolean
  result?: Array<{ message_id: number }>
  description?: string
}

function telegramEnv(): { token: string; channelId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const channelId = process.env.TELEGRAM_CHANNEL_ID?.trim()
  if (!token || !channelId) return null
  return { token, channelId }
}

/** Resolve image for Telegram sendPhoto — absolute HTTP(S) URL required. */
export function resolveTelegramPhotoUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image
  }
  if (image.startsWith("/")) {
    return `${SITE_DOMAIN}${image}`
  }
  return `${SITE_DOMAIN}/${image.replace(/^\//, "")}`
}

function hasImage(image: string | undefined): image is string {
  return Boolean(image?.trim())
}

function resolveCaption(article: DailyAnalysis): string {
  return buildDailyAnalysisSocialCaption(article, { maxLength: TELEGRAM_CAPTION_MAX })
}

async function telegramRequest<T>(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<{ response: Response; payload: T } | { error: string }> {
  let response: Response
  try {
    response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram request failed"
    return { error: message }
  }

  let payload: T
  try {
    payload = (await response.json()) as T
  } catch {
    return { error: `Telegram API returned HTTP ${response.status}` }
  }

  return { response, payload }
}

async function sendPhoto(
  token: string,
  channelId: string,
  photo: string,
  caption?: string,
): Promise<TelegramPublishResult> {
  const body: Record<string, unknown> = {
    chat_id: channelId,
    photo,
  }
  if (caption) {
    body.caption = caption
    body.parse_mode = "HTML"
  }

  const result = await telegramRequest<TelegramSendPhotoResponse>(token, "sendPhoto", body)
  if ("error" in result) {
    return { ok: false, error: result.error }
  }

  const { response, payload } = result
  if (!response.ok || !payload.ok || !payload.result?.message_id) {
    const detail = payload.description ?? `HTTP ${response.status}`
    return { ok: false, error: detail }
  }

  return { ok: true, messageId: payload.result.message_id }
}

async function uploadPhoto(
  token: string,
  channelId: string,
  imageUrl: string,
  caption: string,
): Promise<TelegramPublishResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12_000)
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BTradingMarketInsights/1.0)" },
      signal: controller.signal,
      cache: "no-store",
    }).finally(() => clearTimeout(timeout))
    const type = response.headers.get("content-type")?.split(";")[0] ?? ""
    const declaredSize = Number(response.headers.get("content-length") ?? "0")
    if (!response.ok || !type.startsWith("image/") || declaredSize > 8_000_000) {
      return { ok: false, error: `Publisher image unavailable (HTTP ${response.status})` }
    }
    const bytes = await response.arrayBuffer()
    if (!bytes.byteLength || bytes.byteLength > 8_000_000) {
      return { ok: false, error: "Publisher image is empty or too large" }
    }

    const body = new FormData()
    body.set("chat_id", channelId)
    body.set("caption", caption)
    body.set("parse_mode", "HTML")
    body.set("photo", new Blob([bytes], { type }), "news-image")
    const telegram = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendPhoto`, {
      method: "POST",
      body,
    })
    const payload = (await telegram.json()) as TelegramSendPhotoResponse
    if (!telegram.ok || !payload.ok || !payload.result?.message_id) {
      return { ok: false, error: payload.description ?? `HTTP ${telegram.status}` }
    }
    return { ok: true, messageId: payload.result.message_id }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Image upload failed" }
  }
}

async function sendMediaGroup(
  token: string,
  channelId: string,
  vnindexPhoto: string,
  goldPhoto: string,
  caption: string,
): Promise<TelegramPublishResult> {
  const result = await telegramRequest<TelegramSendMediaGroupResponse>(
    token,
    "sendMediaGroup",
    {
      chat_id: channelId,
      media: [
        { type: "photo", media: vnindexPhoto, caption },
        { type: "photo", media: goldPhoto },
      ],
    },
  )

  if ("error" in result) {
    return { ok: false, error: result.error }
  }

  const { response, payload } = result
  const firstMessageId = payload.result?.[0]?.message_id
  if (!response.ok || !payload.ok || !firstMessageId) {
    const detail = payload.description ?? `HTTP ${response.status}`
    return { ok: false, error: detail }
  }

  return { ok: true, messageId: firstMessageId }
}

export async function publishDailyAnalysisToTelegram(
  article: DailyAnalysis,
): Promise<TelegramPublishResult> {
  const env = telegramEnv()
  if (!env) {
    return { ok: false, error: "skipped: missing env" }
  }

  const hasVnindex = hasImage(article.vnindexImage)
  const hasGold = hasImage(article.goldImage)
  const caption = resolveCaption(article)

  if (!hasVnindex && !hasGold) {
    return { ok: false, error: "No images available to publish" }
  }

  if (hasVnindex && hasGold) {
    const vnindexPhoto = resolveTelegramPhotoUrl(article.vnindexImage)
    const goldPhoto = resolveTelegramPhotoUrl(article.goldImage)

    const mediaGroupResult = await sendMediaGroup(
      env.token,
      env.channelId,
      vnindexPhoto,
      goldPhoto,
      caption,
    )
    if (mediaGroupResult.ok) {
      return mediaGroupResult
    }

    const vnResult = await sendPhoto(env.token, env.channelId, vnindexPhoto, caption)
    if (!vnResult.ok) {
      return vnResult
    }

    const goldResult = await sendPhoto(env.token, env.channelId, goldPhoto)
    if (!goldResult.ok) {
      return {
        ok: false,
        error: `VNIndex sent (id ${vnResult.messageId}) but gold image failed: ${goldResult.error}`,
      }
    }

    return vnResult
  }

  const photo = resolveTelegramPhotoUrl(
    hasVnindex ? article.vnindexImage : article.goldImage,
  )
  return sendPhoto(env.token, env.channelId, photo, caption)
}


/** Publish a short, source-attributed market alert to the configured channel. */
export async function publishTelegramMarketAlert(
  text: string,
  imageUrl?: string,
): Promise<TelegramPublishResult> {
  const env = telegramEnv()
  if (!env) return { ok: false, error: "skipped: missing env" }

  if (imageUrl) {
    const photoResult = await sendPhoto(env.token, env.channelId, imageUrl, text)
    if (photoResult.ok) return photoResult
    const uploadResult = await uploadPhoto(env.token, env.channelId, imageUrl, text)
    if (uploadResult.ok) return uploadResult
    console.warn("[telegram] original news image failed; falling back to text", {
      urlError: photoResult.error,
      uploadError: uploadResult.error,
    })
  }

  const result = await telegramRequest<TelegramSendPhotoResponse>(
    env.token,
    "sendMessage",
    {
      chat_id: env.channelId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    },
  )
  if ("error" in result) return { ok: false, error: result.error }

  const { response, payload } = result
  if (!response.ok || !payload.ok || !payload.result?.message_id) {
    return { ok: false, error: payload.description ?? `HTTP ${response.status}` }
  }
  return { ok: true, messageId: payload.result.message_id }
}
