import "server-only"

import { createHash } from "crypto"
import OpenAI from "openai"

import { fetchNewsFromRss, type NormalizedNewsItem } from "@/lib/news/rss"
import {
  deleteR2Object,
  isR2Configured,
  putR2ObjectIfAbsent,
} from "@/lib/r2"
import { publishTelegramMarketAlert } from "@/lib/publishers/telegram"

const ALERT_PREFIX = "telegram-market-alerts/"
const MAX_AGE_MS = 90 * 60 * 1000
const IMPORTANT_PATTERN =
  /\b(fed|fomc|interest rates?|rate decision|cpi|inflation|pce|payrolls?|nonfarm|nfp|unemployment|jobless|gdp|tariff|sanctions?|ceasefire|war|oil|opec|gold|treasury|yield)\b/i

type AlertDraft = {
  headlineVi: string
  summaryVi: string
  impact: "Cao" | "Đáng chú ý"
}

function isRecent(item: NormalizedNewsItem): boolean {
  const time = Date.parse(item.publishedAt)
  return Number.isFinite(time) && Date.now() - time >= -5 * 60_000 && Date.now() - time <= MAX_AGE_MS
}

function keyFor(item: NormalizedNewsItem): string {
  return `${ALERT_PREFIX}${createHash("sha256").update(item.url).digest("hex")}.json`
}

function chooseCandidate(items: NormalizedNewsItem[]): NormalizedNewsItem | null {
  return (
    items
      .filter((item) => IMPORTANT_PATTERN.test(item.title))
      .filter(isRecent)
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0] ?? null
  )
}

async function translateAndSummarize(item: NormalizedNewsItem): Promise<AlertDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const client = new OpenAI({ apiKey })
  const completion = await client.chat.completions.create({
    model: process.env.MARKET_ALERT_OPENAI_MODEL?.trim() || "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.15,
    messages: [
      {
        role: "system",
        content:
          "Bạn là biên tập viên tin nhanh tài chính BTrading. Chỉ dịch và tóm tắt đúng tiêu đề nguồn được cung cấp; không thêm số liệu, không suy đoán, không đưa khuyến nghị đầu tư. Trả JSON: headlineVi (tối đa 120 ký tự), summaryVi (1-2 câu tối đa 240 ký tự), impact ('Cao' hoặc 'Đáng chú ý').",
      },
      {
        role: "user",
        content: JSON.stringify({
          title: item.title,
          source: item.source,
          publishedAt: item.publishedAt,
          url: item.url,
        }),
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AlertDraft>
    if (
      typeof parsed.headlineVi !== "string" ||
      typeof parsed.summaryVi !== "string" ||
      (parsed.impact !== "Cao" && parsed.impact !== "Đáng chú ý")
    ) return null
    return {
      headlineVi: parsed.headlineVi.trim().slice(0, 120),
      summaryVi: parsed.summaryVi.trim().slice(0, 240),
      impact: parsed.impact,
    }
  } catch {
    return null
  }
}

function formatAlert(item: NormalizedNewsItem, draft: AlertDraft): string {
  return [
    `🚨 TIN NHANH | ${draft.impact}`,
    "",
    `<b>${draft.headlineVi}</b>`,
    draft.summaryVi,
    "",
    `Nguồn: ${item.source}`,
    item.url,
    "",
    "⚠️ Thông tin tham khảo, không phải khuyến nghị đầu tư.",
  ].join("\n")
}

export type MarketAlertRunResult =
  | { status: "published"; source: string; messageId: number }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string }

/**
 * Checks trusted RSS headlines, then publishes at most one source-attributed
 * high-impact update. R2 makes deduplication survive serverless instances.
 */
export async function runTelegramMarketAlerts(): Promise<MarketAlertRunResult> {
  if (!isR2Configured()) return { status: "skipped", reason: "R2 is not configured" }

  const candidate = chooseCandidate(await fetchNewsFromRss())
  if (!candidate) return { status: "skipped", reason: "no recent high-impact item" }

  const key = keyFor(candidate)
  const claimed = await putR2ObjectIfAbsent({
    key,
    body: JSON.stringify({ status: "processing", url: candidate.url, createdAt: new Date().toISOString() }),
    contentType: "application/json",
  })
  if (!claimed) return { status: "skipped", reason: "duplicate item" }

  try {
    const draft = await translateAndSummarize(candidate)
    if (!draft) {
      await deleteR2Object(key)
      return { status: "failed", reason: "translation unavailable" }
    }

    const result = await publishTelegramMarketAlert(formatAlert(candidate, draft))
    if (!result.ok) {
      await deleteR2Object(key)
      return { status: "failed", reason: result.error }
    }

    return { status: "published", source: candidate.source, messageId: result.messageId }
  } catch (error) {
    await deleteR2Object(key)
    return { status: "failed", reason: error instanceof Error ? error.message : String(error) }
  }
}
