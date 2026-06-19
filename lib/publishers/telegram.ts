import { SITE_DOMAIN } from "@/lib/brand"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"

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

function telegramEnv(): { token: string; channelId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const channelId = process.env.TELEGRAM_CHANNEL_ID?.trim()
  if (!token || !channelId) return null
  return { token, channelId }
}

function dailyAnalysisUrl(slug: string): string {
  return `${SITE_DOMAIN}/daily-analysis/${slug}`
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

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  if (maxLen <= 1) return text.slice(0, maxLen)
  return `${text.slice(0, maxLen - 1).trimEnd()}…`
}

function truncateCaptionPreservingLink(caption: string, link: string): string {
  const linkSuffix = `\n\n${link}`
  const maxBody = TELEGRAM_CAPTION_MAX - linkSuffix.length
  if (maxBody <= 0) return truncateText(link, TELEGRAM_CAPTION_MAX)

  if (caption.includes(link)) {
    const withoutLink = caption.replace(link, "").trimEnd()
    if (withoutLink.length + linkSuffix.length <= TELEGRAM_CAPTION_MAX) {
      return `${withoutLink}${linkSuffix}`
    }
    return `${truncateText(withoutLink, maxBody)}${linkSuffix}`
  }

  if (caption.length + linkSuffix.length <= TELEGRAM_CAPTION_MAX) {
    return `${caption}${linkSuffix}`
  }
  return `${truncateText(caption, maxBody)}${linkSuffix}`
}

function buildDailyAnalysisCaption(article: DailyAnalysis): string {
  const link = dailyAnalysisUrl(article.slug)
  const linkSuffix = `\n\n${link}`
  const maxBody = TELEGRAM_CAPTION_MAX - linkSuffix.length

  const title = article.title.trim()
  const summary = article.summary.trim()
  const vnLabel = "VN-Index:"
  const goldLabel = "Vàng:"

  let vnText = article.vnindexAnalysis.trim()
  let goldText = article.goldAnalysis.trim()

  const header = `${title}\n\n${summary}\n\n`
  const labelsOverhead = `${vnLabel} \n\n${goldLabel} `.length

  let bodyBudget = maxBody - header.length - labelsOverhead
  if (bodyBudget < 40) {
    return truncateCaptionPreservingLink(`${title}\n\n${summary}`, link)
  }

  const halfBudget = Math.floor(bodyBudget / 2)
  if (vnText.length + goldText.length > bodyBudget) {
    vnText = truncateText(vnText, Math.max(40, halfBudget))
    goldText = truncateText(goldText, Math.max(40, bodyBudget - vnText.length))
  }

  let body = `${header}${vnLabel} ${vnText}\n\n${goldLabel} ${goldText}`
  if (body.length > maxBody) {
    body = truncateText(body, maxBody)
  }

  return `${body}${linkSuffix}`
}

function resolveCaption(article: DailyAnalysis): string {
  const link = dailyAnalysisUrl(article.slug)
  const openAiCaption = article.telegramCaption?.trim()

  if (openAiCaption && openAiCaption.length <= TELEGRAM_CAPTION_MAX) {
    return openAiCaption
  }

  if (openAiCaption) {
    return truncateCaptionPreservingLink(openAiCaption, link)
  }

  return buildDailyAnalysisCaption(article)
}

export async function publishDailyAnalysisToTelegram(
  article: DailyAnalysis,
): Promise<TelegramPublishResult> {
  const env = telegramEnv()
  if (!env) {
    return { ok: false, error: "skipped: missing env" }
  }

  const photo = resolveTelegramPhotoUrl(article.vnindexImage)
  const caption = resolveCaption(article)

  let response: Response
  try {
    response = await fetch(`${TELEGRAM_API_BASE}/bot${env.token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.channelId,
        photo,
        caption,
      }),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telegram request failed"
    return { ok: false, error: message }
  }

  let payload: TelegramSendPhotoResponse
  try {
    payload = (await response.json()) as TelegramSendPhotoResponse
  } catch {
    return { ok: false, error: `Telegram API returned HTTP ${response.status}` }
  }

  if (!response.ok || !payload.ok || !payload.result?.message_id) {
    const detail = payload.description ?? `HTTP ${response.status}`
    return { ok: false, error: detail }
  }

  return { ok: true, messageId: payload.result.message_id }
}
