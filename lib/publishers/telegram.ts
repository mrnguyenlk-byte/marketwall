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
