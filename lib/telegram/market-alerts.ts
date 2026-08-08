import "server-only"

import { createHash } from "crypto"
import OpenAI from "openai"

import { fetchNewsFromRss, type NormalizedNewsItem } from "@/lib/news/rss"
import { getData } from "@/lib/providers/calendar-provider"
import type { EconomicEventRecord } from "@/lib/providers/types"
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
const SENSITIVE_PATTERN = /\b(war|attack|killed|death|ceasefire|sanctions?|missile|invasion)\b/i
const MISSING_VALUES = new Set(["", "—", "-", "n/a", "na", "null", "undefined"])

type AlertDraft = {
  headlineVi: string
  summaryVi: string
  marketImpactVi: string
  priority: "critical" | "high" | "medium" | "low"
}

type EconomicCandidate = {
  kind: "economic"
  record: EconomicEventRecord
  eventAt: string
  key: string
}

type NewsCandidate = {
  kind: "news"
  item: NormalizedNewsItem
  key: string
}

type Candidate = EconomicCandidate | NewsCandidate

function isRecentIso(value: string): boolean {
  const time = Date.parse(value)
  const age = Date.now() - time
  return Number.isFinite(time) && age >= -5 * 60_000 && age <= MAX_AGE_MS
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  return !MISSING_VALUES.has(String(value).trim().toLowerCase())
}

function isUs(record: EconomicEventRecord): boolean {
  const country = record.country.trim().toUpperCase()
  return country === "US" || country === "USA" || country === "UNITED STATES"
}

function economicKey(record: EconomicEventRecord): string {
  const normalized = [record.event, record.publishedAt.slice(0, 16)]
    .join("|")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
  return `${ALERT_PREFIX}economic-${createHash("sha256").update(normalized).digest("hex")}.json`
}

function newsKey(item: NormalizedNewsItem): string {
  return `${ALERT_PREFIX}news-${createHash("sha256").update(item.url).digest("hex")}.json`
}

function chooseEconomicCandidate(records: EconomicEventRecord[]): EconomicCandidate | null {
  const record = records
    .filter((row) => isUs(row) && row.impact === "high")
    .filter((row) => {
      const forecastOptional = /\b(fomc|rate decision|interest rate decision)\b/i.test(row.event)
      return (
        hasValue(row.actual) &&
        hasValue(row.previous) &&
        (forecastOptional || hasValue(row.forecast)) &&
        isRecentIso(row.publishedAt)
      )
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0]

  return record
    ? { kind: "economic", record, eventAt: record.publishedAt, key: economicKey(record) }
    : null
}

function chooseNewsCandidate(items: NormalizedNewsItem[]): NewsCandidate | null {
  // A single RSS headline is not enough for sensitive geopolitical claims.
  // Those wait for an official source or a future two-source matcher.
  const item = items
    .filter((row) => row.sourceTier === 1)
    .filter((row) => IMPORTANT_PATTERN.test(row.title))
    .filter((row) => !SENSITIVE_PATTERN.test(row.title))
    .filter((row) => isRecentIso(row.publishedAt))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0]

  return item ? { kind: "news", item, key: newsKey(item) } : null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function vietnamTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    hour12: false,
  }).format(date)
}

function formatEconomicAlert(candidate: EconomicCandidate): string {
  const { record } = candidate
  return [
    `🔴 <b>${escapeHtml(record.event)}</b>`,
    "",
    `Thực tế: <b>${escapeHtml(String(record.actual))}</b>`,
    `Dự báo: ${escapeHtml(hasValue(record.forecast) ? String(record.forecast) : "chưa có")}`,
    `Trước đó: ${escapeHtml(hasValue(record.previous) ? String(record.previous) : "chưa có")}`,
    "",
    "Tác động: Chênh lệch giữa thực tế và dự báo có thể làm biến động USD, lợi suất trái phiếu, Gold và chứng khoán Mỹ.",
    "",
    `Nguồn: ${escapeHtml(record.source)} · ${vietnamTime(candidate.eventAt)} (giờ Việt Nam)`,
    "",
    "⚠️ Thông tin tham khảo, không phải khuyến nghị đầu tư.",
  ].join("\n")
}

async function translateAndSummarize(item: NormalizedNewsItem): Promise<AlertDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const client = new OpenAI({ apiKey })
  const completion = await client.chat.completions.create({
    model: process.env.MARKET_ALERT_OPENAI_MODEL?.trim() || "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "Bạn là biên tập viên tin nhanh BTrading. Chỉ dùng dữ kiện trong tiêu đề và mô tả nguồn. Không thêm con số, phát biểu hoặc diễn biến không có trong dữ liệu. Viết tiếng Việt trung lập, không khuyến nghị đầu tư. Trả JSON gồm headlineVi (tối đa 120 ký tự), summaryVi (1-2 câu tối đa 260 ký tự), marketImpactVi (một câu có điều kiện, tối đa 180 ký tự), priority ('critical','high','medium','low'). Chỉ dùng critical/high cho sự kiện có khả năng tác động rộng tới Gold, USD, lãi suất, dầu hoặc chỉ số lớn.",
      },
      {
        role: "user",
        content: JSON.stringify({
          title: item.title,
          description: item.description,
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
      typeof parsed.marketImpactVi !== "string" ||
      !["critical", "high", "medium", "low"].includes(parsed.priority ?? "")
    ) return null
    return {
      headlineVi: parsed.headlineVi.trim().slice(0, 120),
      summaryVi: parsed.summaryVi.trim().slice(0, 260),
      marketImpactVi: parsed.marketImpactVi.trim().slice(0, 180),
      priority: parsed.priority as AlertDraft["priority"],
    }
  } catch {
    return null
  }
}

function formatNewsAlert(item: NormalizedNewsItem, draft: AlertDraft): string {
  return [
    "⚡ <b>TIN THỊ TRƯỜNG</b>",
    "",
    `<b>${escapeHtml(draft.headlineVi)}</b>`,
    escapeHtml(draft.summaryVi),
    `Tác động: ${escapeHtml(draft.marketImpactVi)}`,
    "",
    `Nguồn: ${escapeHtml(item.source)} · ${vietnamTime(item.publishedAt)} (giờ Việt Nam)`,
    item.url,
    "",
    "⚠️ Thông tin tham khảo, không phải khuyến nghị đầu tư.",
  ].join("\n")
}

export type MarketAlertRunResult =
  | { status: "published"; source: string; messageId: number; kind: Candidate["kind"] }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string }

async function chooseCandidate(): Promise<Candidate | null> {
  const [calendar, news] = await Promise.all([getData(), fetchNewsFromRss()])
  const economic = calendar.source === "mock"
    ? null
    : chooseEconomicCandidate(calendar.normalized)
  return economic ?? chooseNewsCandidate(news)
}

/** Publish at most one verified, high-impact update per run. */
export async function runTelegramMarketAlerts(): Promise<MarketAlertRunResult> {
  if (!isR2Configured()) return { status: "skipped", reason: "R2 is not configured" }

  const candidate = await chooseCandidate()
  if (!candidate) return { status: "skipped", reason: "no verified recent high-impact item" }

  const claimed = await putR2ObjectIfAbsent({
    key: candidate.key,
    body: JSON.stringify({ status: "processing", kind: candidate.kind, createdAt: new Date().toISOString() }),
    contentType: "application/json",
  })
  if (!claimed) return { status: "skipped", reason: "duplicate item" }

  try {
    let text: string
    let source: string

    if (candidate.kind === "economic") {
      text = formatEconomicAlert(candidate)
      source = candidate.record.source
    } else {
      const draft = await translateAndSummarize(candidate.item)
      if (!draft || (draft.priority !== "critical" && draft.priority !== "high")) {
        await deleteR2Object(candidate.key)
        return { status: "skipped", reason: "news did not pass the high-impact gate" }
      }
      text = formatNewsAlert(candidate.item, draft)
      source = candidate.item.source
    }

    const result = await publishTelegramMarketAlert(text)
    if (!result.ok) {
      await deleteR2Object(candidate.key)
      return { status: "failed", reason: result.error }
    }

    return { status: "published", source, messageId: result.messageId, kind: candidate.kind }
  } catch (error) {
    await deleteR2Object(candidate.key)
    return { status: "failed", reason: error instanceof Error ? error.message : String(error) }
  }
}
