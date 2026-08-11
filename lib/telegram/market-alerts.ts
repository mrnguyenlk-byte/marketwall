import "server-only"

import { createHash } from "crypto"
import OpenAI from "openai"

import { fetchNewsFromRss, type NormalizedNewsItem } from "@/lib/news/rss"
import { getData as getCalendarData } from "@/lib/providers/calendar-provider"
import { getData as getGlobalMarketData } from "@/lib/providers/global-market-provider"
import type { EconomicEventRecord } from "@/lib/providers/types"
import {
  deleteR2Object,
  getR2ObjectJson,
  isR2Configured,
  putR2Object,
  putR2ObjectIfAbsent,
} from "@/lib/r2"
import { publishTelegramMarketAlert } from "@/lib/publishers/telegram"

const ALERT_PREFIX = "telegram-market-alerts/"
const GOLD_STATE_KEY = `${ALERT_PREFIX}gold-latest.json`
const NEWS_MAX_AGE_MS = 3 * 60 * 60 * 1000
const TRUMP_MAX_AGE_MS = 6 * 60 * 60 * 1000
const GOLD_MAX_AGE_MS = 45 * 60 * 1000
const IMPORTANT_PATTERN =
  /\b(fed|fomc|central bank|interest rates?|rate decision|cpi|inflation|pce|payrolls?|nonfarm|nfp|unemployment|jobless|gdp|pmi|tariff|trade war|sanctions?|ceasefire|war|attack|missile|oil|opec|gold|treasury|yield|currency|dollar|euro|yen|ecb|boj|boe|pboc|china|russia|ukraine|iran|israel|election|government|president|prime minister|debt|budget|default|bank|financial crisis)\b/i
const SENSITIVE_PATTERN =
  /\b(war|attack|killed|death|ceasefire|sanctions?|missile|invasion|coup|terror)\b/i
const TRUMP_MARKET_PATTERN =
  /\b(tariff|trade|china|fed|federal reserve|interest rate|dollar|currency|treasury|oil|opec|gold|sanction|war|ceasefire|russia|ukraine|iran|israel|tax|budget|debt|market|stock|crypto|bitcoin|bank|export|import)\b/i
const IMPORTANT_COUNTRIES = new Set([
  "US", "USA", "UNITED STATES", "EU", "EURO AREA", "DE", "GERMANY",
  "UK", "UNITED KINGDOM", "JP", "JAPAN", "CN", "CHINA", "CA", "CANADA",
  "AU", "AUSTRALIA", "NZ", "NEW ZEALAND", "CH", "SWITZERLAND",
])
const MISSING_VALUES = new Set(["", "—", "-", "n/a", "na", "null", "undefined"])
const CORROBORATION_STOP_WORDS = new Set([
  "about", "after", "against", "amid", "from", "into", "over", "that", "the",
  "their", "this", "with", "says", "said", "will", "would", "could", "have",
  "has", "and", "for", "its", "new", "are", "was", "were",
])

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
  kind: "news" | "trump"
  item: NormalizedNewsItem
  key: string
}

type Candidate = EconomicCandidate | NewsCandidate

type GoldState = {
  price: number
  updatedAt: string
  publishedAt: string
}

type PublishedAlert = {
  kind: Candidate["kind"] | "gold"
  source: string
  messageId: number
}

export type MarketAlertRunResult =
  | { status: "published"; published: PublishedAlert[]; skippedReasons: string[] }
  | { status: "skipped"; reason: string; skippedReasons: string[] }
  | { status: "failed"; reason: string; published: PublishedAlert[]; skippedReasons: string[] }

function ageMs(value: string): number {
  const time = Date.parse(value)
  return Number.isFinite(time) ? Date.now() - time : Number.POSITIVE_INFINITY
}

function isRecentIso(value: string, maxAgeMs: number): boolean {
  const age = ageMs(value)
  return age >= -5 * 60_000 && age <= maxAgeMs
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  return !MISSING_VALUES.has(String(value).trim().toLowerCase())
}

function isImportantCountry(record: EconomicEventRecord): boolean {
  return IMPORTANT_COUNTRIES.has(record.country.trim().toUpperCase())
}

function economicKey(record: EconomicEventRecord): string {
  const normalized = [record.country, record.event, record.publishedAt.slice(0, 16)]
    .join("|")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
  return `${ALERT_PREFIX}economic-${createHash("sha256").update(normalized).digest("hex")}.json`
}

function newsKey(item: NormalizedNewsItem): string {
  return `${ALERT_PREFIX}${item.category === "trump" ? "trump" : "news"}-${createHash("sha256").update(item.url).digest("hex")}.json`
}

function chooseEconomicCandidate(records: EconomicEventRecord[]): EconomicCandidate | null {
  const record = records
    .filter((row) => isImportantCountry(row) && row.impact === "high")
    .filter((row) => {
      const forecastOptional = /\b(fomc|rate decision|interest rate decision)\b/i.test(row.event)
      return (
        hasValue(row.actual) &&
        hasValue(row.previous) &&
        (forecastOptional || hasValue(row.forecast)) &&
        isRecentIso(row.publishedAt, NEWS_MAX_AGE_MS)
      )
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0]

  return record
    ? { kind: "economic", record, eventAt: record.publishedAt, key: economicKey(record) }
    : null
}

function significantTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !CORROBORATION_STOP_WORDS.has(token)),
  )
}

function hasIndependentCorroboration(item: NormalizedNewsItem, items: NormalizedNewsItem[]): boolean {
  const sourceTokens = significantTokens(item.title)
  return items.some((other) => {
    if (other.url === item.url || other.source === item.source || other.sourceTier !== 1) return false
    if (!isRecentIso(other.publishedAt, NEWS_MAX_AGE_MS)) return false
    const overlap = [...significantTokens(other.title)].filter((token) => sourceTokens.has(token))
    return overlap.length >= 2
  })
}

function chooseNewsCandidate(items: NormalizedNewsItem[]): NewsCandidate | null {
  const item = items
    .filter((row) => row.category !== "trump" && row.sourceTier === 1)
    .filter((row) => IMPORTANT_PATTERN.test(`${row.title} ${row.description ?? ""}`))
    .filter((row) => isRecentIso(row.publishedAt, NEWS_MAX_AGE_MS))
    .filter((row) => !SENSITIVE_PATTERN.test(row.title) || hasIndependentCorroboration(row, items))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0]

  return item ? { kind: "news", item, key: newsKey(item) } : null
}

function chooseTrumpCandidate(items: NormalizedNewsItem[]): NewsCandidate | null {
  const item = items
    .filter((row) => row.category === "trump")
    .filter((row) => TRUMP_MARKET_PATTERN.test(`${row.title} ${row.description ?? ""}`))
    .filter((row) => isRecentIso(row.publishedAt, TRUMP_MAX_AGE_MS))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0]

  return item ? { kind: "trump", item, key: newsKey(item) } : null
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

function vietnamTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    hour12: false,
  }).format(new Date(iso))
}

function vietnamDateHour(date: Date): { date: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  }
}

function formatEconomicAlert(candidate: EconomicCandidate): string {
  const { record } = candidate
  const country = record.country.trim() || record.currency.trim()
  const sourceUrl = /forex factory|fair economy/i.test(record.source)
    ? "https://www.forexfactory.com/calendar"
    : "https://tradingeconomics.com/calendar"
  return [
    `🔴 <b>${escapeHtml(record.event)} — ${escapeHtml(country)}</b>`,
    "",
    `Thực tế: <b>${escapeHtml(String(record.actual))}</b>`,
    `Dự báo: ${escapeHtml(hasValue(record.forecast) ? String(record.forecast) : "chưa có")}`,
    `Trước đó: ${escapeHtml(hasValue(record.previous) ? String(record.previous) : "chưa có")}`,
    "",
    "Tác động: Chênh lệch giữa thực tế và dự báo có thể ảnh hưởng đến tiền tệ, lợi suất, Gold và tâm lý rủi ro toàn cầu.",
    "",
    `Nguồn: ${escapeHtml(record.source)} · ${vietnamTime(candidate.eventAt)} (giờ Việt Nam)`,
    sourceUrl,
    "",
    "⚠️ Thông tin tham khảo, không phải khuyến nghị đầu tư.",
  ].join("\n")
}

async function translateAndSummarize(candidate: NewsCandidate): Promise<AlertDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  const isTrump = candidate.kind === "trump"
  const client = new OpenAI({ apiKey })
  const completion = await client.chat.completions.create({
    model: process.env.MARKET_ALERT_OPENAI_MODEL?.trim() || "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: [
          "Bạn là biên tập viên tin nhanh BTrading. Chỉ dùng dữ kiện trong tiêu đề và mô tả nguồn.",
          "Không thêm số, phát biểu hoặc diễn biến không có trong dữ liệu. Viết tiếng Việt trung lập, không khuyến nghị đầu tư.",
          isTrump
            ? "Đây là bài đăng của Donald Trump: chỉ mô tả rằng ông đã viết/phát biểu điều gì; không coi nội dung bài đăng là sự thật đã được xác minh."
            : "Phân biệt sự kiện đã xác nhận với tác động thị trường có điều kiện.",
          "Trả JSON gồm headlineVi (tối đa 120 ký tự), summaryVi (1-2 câu tối đa 260 ký tự), marketImpactVi (một câu có điều kiện, tối đa 180 ký tự), priority ('critical','high','medium','low').",
          "Chỉ dùng critical/high khi nội dung có khả năng tác động rộng tới Gold, USD, lãi suất, dầu, tiền tệ hoặc chỉ số lớn.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          title: candidate.item.title,
          description: candidate.item.description,
          source: candidate.item.source,
          publishedAt: candidate.item.publishedAt,
          url: candidate.item.url,
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

function formatNewsAlert(candidate: NewsCandidate, draft: AlertDraft): string {
  const label = candidate.kind === "trump" ? "🇺🇸 BÀI ĐĂNG CỦA TRUMP" : "⚡ TIN THỊ TRƯỜNG QUỐC TẾ"
  const note = candidate.kind === "trump"
    ? "Lưu ý: Đây là nội dung ông Trump đăng tải; các tuyên bố bên trong chưa mặc nhiên được xem là dữ kiện độc lập đã xác minh."
    : ""
  return [
    `<b>${label}</b>`,
    "",
    `<b>${escapeHtml(draft.headlineVi)}</b>`,
    escapeHtml(draft.summaryVi),
    note,
    `Tác động: ${escapeHtml(draft.marketImpactVi)}`,
    "",
    `Nguồn: ${escapeHtml(candidate.item.source)} · ${vietnamTime(candidate.item.publishedAt)} (giờ Việt Nam)`,
    candidate.item.url,
    "",
    "⚠️ Thông tin tham khảo, không phải khuyến nghị đầu tư.",
  ].filter(Boolean).join("\n")
}

function signedPercent(value: number): string {
  const normalized = Math.abs(value) < 0.005 ? 0 : value
  return `${normalized >= 0 ? "+" : ""}${normalized.toFixed(2)}%`
}

function goldHourKey(now: Date): string | null {
  const local = vietnamDateHour(now)
  if (local.minute >= 15) return null
  return `${ALERT_PREFIX}gold-${local.date}-${String(local.hour).padStart(2, "0")}.json`
}

async function publishHourlyGold(now: Date): Promise<PublishedAlert | { skipped: string }> {
  const key = goldHourKey(now)
  if (!key) return { skipped: "gold update is outside the hourly publication window" }

  const market = await getGlobalMarketData()
  const gold = market.quotes.find((quote) => quote.symbol === "GOLD")
  if (!gold || gold.source !== "live") return { skipped: "gold live quote is unavailable" }
  if (!isRecentIso(gold.updatedAt, GOLD_MAX_AGE_MS)) return { skipped: "gold quote is stale" }

  const claimed = await putR2ObjectIfAbsent({
    key,
    body: JSON.stringify({ status: "processing", kind: "gold", createdAt: now.toISOString() }),
    contentType: "application/json",
  })
  if (!claimed) return { skipped: "gold hour already published" }

  try {
    const previous = await getR2ObjectJson<GoldState>(GOLD_STATE_KEY)
    const previousAge = previous ? now.getTime() - Date.parse(previous.publishedAt) : Number.POSITIVE_INFINITY
    const hourlyChange = previous && previousAge >= 0 && previousAge <= 2 * 60 * 60 * 1000 && previous.price
      ? ((gold.price - previous.price) / previous.price) * 100
      : null
    const lines = [
      `📣 <b>Cập nhật giá vàng ${vietnamTime(now.toISOString())}</b>`,
      "",
      `Giá tham chiếu: <b>${gold.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD/oz</b>`,
      hourlyChange == null ? "So với 1 giờ trước: chưa có mốc hợp lệ" : `So với 1 giờ trước: ${signedPercent(hourlyChange)}`,
      `So với đóng cửa trước: ${signedPercent(gold.changePercent)}`,
      "",
      "Nguồn: Yahoo Finance · Gold Futures (GC=F)",
      `Cập nhật nguồn: ${vietnamTime(gold.updatedAt)} (giờ Việt Nam)`,
      "",
      "⚠️ Giá tham chiếu có thể khác báo giá XAUUSD của từng sàn.",
    ]
    const result = await publishTelegramMarketAlert(lines.join("\n"))
    if (!result.ok) throw new Error(result.error)

    await putR2Object({
      key: GOLD_STATE_KEY,
      body: JSON.stringify({ price: gold.price, updatedAt: gold.updatedAt, publishedAt: now.toISOString() } satisfies GoldState),
      contentType: "application/json",
    })
    return { kind: "gold", source: "Yahoo Finance", messageId: result.messageId }
  } catch (error) {
    await deleteR2Object(key)
    throw error
  }
}

async function chooseCandidates(): Promise<Candidate[]> {
  const [calendar, news] = await Promise.all([getCalendarData(), fetchNewsFromRss()])
  const candidates: Candidate[] = []
  if (calendar.source !== "mock") {
    const economic = chooseEconomicCandidate(calendar.normalized)
    if (economic) candidates.push(economic)
  }
  const trump = chooseTrumpCandidate(news)
  if (trump) candidates.push(trump)
  const international = chooseNewsCandidate(news)
  if (international && !candidates.some((candidate) => candidate.key === international.key)) {
    candidates.push(international)
  }
  return candidates
}

async function publishCandidate(candidate: Candidate): Promise<PublishedAlert | { skipped: string }> {
  const claimed = await putR2ObjectIfAbsent({
    key: candidate.key,
    body: JSON.stringify({ status: "processing", kind: candidate.kind, createdAt: new Date().toISOString() }),
    contentType: "application/json",
  })
  if (!claimed) return { skipped: `duplicate ${candidate.kind} item` }

  try {
    let text: string
    let source: string
    if (candidate.kind === "economic") {
      text = formatEconomicAlert(candidate)
      source = candidate.record.source
    } else {
      const draft = await translateAndSummarize(candidate)
      if (!draft || (draft.priority !== "critical" && draft.priority !== "high")) {
        await deleteR2Object(candidate.key)
        return { skipped: `${candidate.kind} item did not pass the high-impact gate` }
      }
      text = formatNewsAlert(candidate, draft)
      source = candidate.item.source
    }

    const result = await publishTelegramMarketAlert(text)
    if (!result.ok) throw new Error(result.error)
    return { kind: candidate.kind, source, messageId: result.messageId }
  } catch (error) {
    await deleteR2Object(candidate.key)
    throw error
  }
}

/**
 * One invocation may publish one hourly gold snapshot plus at most one item in
 * each editorial lane (economic, Trump, international). Every item is claimed
 * in R2 before Telegram is called, so concurrent/retried runs cannot duplicate it.
 */
export async function runTelegramMarketAlerts(): Promise<MarketAlertRunResult> {
  if (!isR2Configured()) {
    return { status: "skipped", reason: "R2 is not configured", skippedReasons: [] }
  }

  const published: PublishedAlert[] = []
  const skippedReasons: string[] = []
  try {
    const goldResult = await publishHourlyGold(new Date())
    if ("skipped" in goldResult) skippedReasons.push(goldResult.skipped)
    else published.push(goldResult)

    const candidates = await chooseCandidates()
    if (!candidates.length) skippedReasons.push("no verified recent high-impact news item")
    for (const candidate of candidates) {
      const result = await publishCandidate(candidate)
      if ("skipped" in result) skippedReasons.push(result.skipped)
      else published.push(result)
    }

    if (published.length) return { status: "published", published, skippedReasons }
    return { status: "skipped", reason: "nothing passed publication gates", skippedReasons }
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : String(error),
      published,
      skippedReasons,
    }
  }
}
