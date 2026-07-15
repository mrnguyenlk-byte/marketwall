import type { EconomicEventRecord } from "@/lib/providers/types"

export const US_MACRO_MAX_EVENTS = 3
export const US_MACRO_FALLBACK_HOURS = 24
export const VN_TIMEZONE = "Asia/Ho_Chi_Minh"
/** Default Daily Analysis publish time in Vietnam (07:00). */
export const US_MACRO_DEFAULT_REPORT_HOUR_VN = 7

export const US_MACRO_EMPTY_MESSAGE =
  "• Không có dữ liệu kinh tế Mỹ mức tác động cao (★★★) được công bố kể từ bản tin trước."

export type UsMacroImpact = "high" | "medium" | "low"

export type UsEconomicEvent = {
  id: string
  event: string
  /** Normalized display/grouping name (distinguishes CPI MoM vs YoY). */
  normalizedName: string
  actual: string | null
  forecast: string | null
  previous: string | null
  impact: UsMacroImpact
  publishedAt: string
  normalizedPublishedAt: string
  /** Verified narrative for Fed decisions / important speeches when numeric actual is absent. */
  verifiedContent?: string | null
}

export type ForecastComparison = "higher" | "lower" | "in_line" | "unknown"

export type UsMacroRejectionReason =
  | "accepted"
  | "not_us"
  | "not_high_impact"
  | "outside_window"
  | "missing_actual"
  | "invalid_published_at"

export type UsMacroDebugRow = {
  id: string
  name: string
  country: string
  impact: string
  actual: string | null
  forecast: string | null
  publishedAt: string
  normalizedPublishedAt: string | null
  rejectionReason: UsMacroRejectionReason
}

const PLACEHOLDER_ONLY_PATTERN = /^[—–−\-]+$/

export const FORBIDDEN_US_MACRO_PATTERNS: RegExp[] = [
  /hỗ trợ vàng/i,
  /tiêu cực cho chứng khoán/i,
  /\busd\b.*(?:sẽ|tăng|giảm)/i,
  /\bvnindex\b.*sẽ/i,
  /thị trường chắc chắn/i,
  /khuyến nghị đầu tư/i,
  /nên mua|nên bán/i,
]

export function containsForbiddenUsMacroTerms(text: string): boolean {
  return FORBIDDEN_US_MACRO_PATTERNS.some((pattern) => pattern.test(text))
}

/** Explicit missing check — never treat "0", "-0.4%", etc. as missing. */
export function isMissingMacroValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "number") return !Number.isFinite(value)
  const trimmed = value.trim()
  if (trimmed === "") return true
  return PLACEHOLDER_ONLY_PATTERN.test(trimmed)
}

export function toNullableMacroValue(
  value: string | number | null | undefined,
): string | null {
  if (isMissingMacroValue(value)) return null
  return String(value).trim()
}

/** Map provider impact strings / stars / colors onto high|medium|low. */
export function normalizeImpactLevel(
  impact: string | number | null | undefined,
): UsMacroImpact {
  if (typeof impact === "number") {
    if (impact >= 3) return "high"
    if (impact === 2) return "medium"
    return "low"
  }

  const raw = String(impact ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")

  if (
    raw === "high" ||
    raw === "high impact" ||
    raw === "red" ||
    raw === "3" ||
    raw === "3-star" ||
    raw === "3 star" ||
    raw === "3*" ||
    raw === "★★★" ||
    raw === "★ ★ ★" ||
    raw.includes("high impact") ||
    raw.includes("★★★")
  ) {
    return "high"
  }

  if (raw === "medium" || raw === "orange" || raw === "2" || raw === "★★" || raw.includes("medium")) {
    return "medium"
  }

  return "low"
}

export function normalizeUsCountry(country: string | null | undefined): string {
  const raw = (country ?? "").trim().toUpperCase()
  if (!raw) return ""
  if (
    raw === "US" ||
    raw === "USA" ||
    raw === "UNITED STATES" ||
    raw === "UNITED STATES OF AMERICA" ||
    raw === "U.S." ||
    raw === "U.S.A."
  ) {
    return "US"
  }
  return raw
}

export function isUsCountry(country: string | null | undefined): boolean {
  return normalizeUsCountry(country) === "US"
}

export function normalizeUsMacroEventName(eventName: string): string {
  const name = eventName.trim().toLowerCase().replace(/\s+/g, " ")

  if (/core\s+cpi/.test(name) && /(y\/?y|year|yo\s*y|theo năm)/.test(name)) {
    return "core_cpi_yoy"
  }
  if (/core\s+cpi/.test(name) && /(m\/?m|month|mo\s*m|theo tháng)/.test(name)) {
    return "core_cpi_mom"
  }
  if (/core\s+cpi/.test(name)) return "core_cpi"

  if (/\bcpi\b/.test(name) && /(y\/?y|year|yo\s*y|theo năm)/.test(name)) {
    return "cpi_yoy"
  }
  if (/\bcpi\b/.test(name) && /(m\/?m|month|mo\s*m|theo tháng)/.test(name)) {
    return "cpi_mom"
  }
  if (/\bcpi\b/.test(name)) return "cpi"

  if (/non[-\s]?farm\s+payrolls|\bnfp\b/.test(name)) return "nfp"
  if (isFedRateDecisionEvent(name)) return "fomc_rate"
  if (isFedSpeechEvent(name)) return "fed_speech"
  if (/unemployment\s+rate/.test(name)) return "unemployment_rate"
  if (/core\s+pce/.test(name)) return "core_pce"
  if (/ppi/.test(name)) return "ppi"
  if (/\bgdp\b/.test(name)) return "gdp"
  if (/retail\s+sales/.test(name)) return "retail_sales"
  if (/ism\s+manufacturing/.test(name)) return "ism_manufacturing"
  if (/ism\s+services/.test(name)) return "ism_services"
  if (/jobless\s+claims/.test(name)) return "jobless_claims"

  return name
}

export function isFedRateDecisionEvent(eventName: string): boolean {
  return /fomc.*rate|federal funds rate|fed funds rate|interest rate decision|fed rate decision/i.test(
    eventName,
  )
}

export function isFedSpeechEvent(eventName: string): boolean {
  return /powell|fed.*speech|fomc.*minutes|fed chair/i.test(eventName)
}

export function isFedExceptionEvent(eventName: string): boolean {
  return isFedRateDecisionEvent(eventName) || isFedSpeechEvent(eventName)
}

export function hasReleasedUsMacroData(event: UsEconomicEvent): boolean {
  if (!isMissingMacroValue(event.actual)) return true
  if (isFedExceptionEvent(event.event) && !isMissingMacroValue(event.verifiedContent)) {
    return true
  }
  return false
}

export function parsePublishedAtMs(publishedAt: string): number | null {
  const trimmed = publishedAt.trim()
  if (!trimmed) return null
  const parsed = Date.parse(trimmed)
  if (!Number.isNaN(parsed)) return parsed
  return null
}

export function formatNormalizedPublishedAt(publishedAt: string): string | null {
  const ms = parsePublishedAtMs(publishedAt)
  if (ms === null) return null
  return new Date(ms).toISOString()
}

/** Convert a YYYY-MM-DD calendar date at hour:00 Vietnam time to UTC epoch ms. */
export function vietnamWallTimeToUtcMs(
  dateYmd: string,
  hour = US_MACRO_DEFAULT_REPORT_HOUR_VN,
  minute = 0,
): number {
  const [year, month, day] = dateYmd.split("-").map((part) => Number.parseInt(part, 10))
  if (!year || !month || !day) return Number.NaN

  // Iterate to map desired Vietnam wall-clock onto UTC (handles DST-free +07:00).
  let guess = Date.UTC(year, month - 1, day, hour - 7, minute, 0)
  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: VN_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess))

    const pick = (type: Intl.DateTimeFormatPartTypes) =>
      Number.parseInt(parts.find((part) => part.type === type)?.value ?? "0", 10)

    const asUtcGuess = Date.UTC(
      pick("year"),
      pick("month") - 1,
      pick("day"),
      pick("hour"),
      pick("minute"),
      0,
    )
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0)
    guess += desired - asUtcGuess
  }

  return guess
}

export function resolveUsMacroSinceMs(
  previousArticle:
    | { date?: string; createdAt?: string | null }
    | string
    | null
    | undefined,
  nowMs: number = Date.now(),
): number {
  if (typeof previousArticle === "string") {
    const parsed = Date.parse(previousArticle)
    if (!Number.isNaN(parsed)) return parsed
    return nowMs - US_MACRO_FALLBACK_HOURS * 60 * 60 * 1000
  }

  if (previousArticle?.createdAt) {
    const parsed = Date.parse(previousArticle.createdAt)
    if (!Number.isNaN(parsed)) return parsed
  }

  if (previousArticle?.date) {
    const fromDate = vietnamWallTimeToUtcMs(previousArticle.date)
    if (!Number.isNaN(fromDate)) return fromDate
  }

  return nowMs - US_MACRO_FALLBACK_HOURS * 60 * 60 * 1000
}

export function mapRecordToUsEvent(record: EconomicEventRecord): UsEconomicEvent {
  const rawActual = toNullableMacroValue(record.actual)
  const isException = isFedExceptionEvent(record.event)
  const isNumericActual =
    rawActual !== null && /^-?[\d.,]+\s*%?$/.test(rawActual.replace(/,/g, ""))

  const normalizedPublishedAt =
    formatNormalizedPublishedAt(record.publishedAt) ?? record.publishedAt

  if (isException && rawActual !== null && !isNumericActual) {
    return {
      id: record.id,
      event: record.event,
      normalizedName: normalizeUsMacroEventName(record.event),
      actual: null,
      forecast: toNullableMacroValue(record.forecast),
      previous: toNullableMacroValue(record.previous),
      impact: normalizeImpactLevel(record.impact),
      publishedAt: record.publishedAt,
      normalizedPublishedAt,
      verifiedContent: rawActual,
    }
  }

  return {
    id: record.id,
    event: record.event,
    normalizedName: normalizeUsMacroEventName(record.event),
    actual: rawActual,
    forecast: toNullableMacroValue(record.forecast),
    previous: toNullableMacroValue(record.previous),
    impact: normalizeImpactLevel(record.impact),
    publishedAt: record.publishedAt,
    normalizedPublishedAt,
    verifiedContent: null,
  }
}

export function getUsMacroEventPriority(eventName: string): number {
  const key = normalizeUsMacroEventName(eventName)

  if (key === "fomc_rate") return 100
  if (key === "nfp") return 95
  if (key === "cpi" || key === "cpi_mom" || key === "cpi_yoy") return 92
  if (key === "core_cpi" || key === "core_cpi_mom" || key === "core_cpi_yoy") return 90
  if (key === "unemployment_rate") return 88
  if (key === "core_pce") return 87
  if (key === "ppi") return 85
  if (key === "gdp") return 82
  if (key === "retail_sales") return 80
  if (key === "ism_manufacturing" || key === "ism_services") return 78
  if (key === "jobless_claims") return 72
  if (key === "fed_speech") return 70

  return 60
}

/**
 * Deduplicate only by exact event id, or normalized name + published timestamp.
 * Different CPI variants (MoM / YoY / Core) keep distinct normalized names.
 */
export function usMacroEventDedupKey(event: UsEconomicEvent): string {
  if (event.id?.trim()) return `id:${event.id.trim()}`
  const published =
    event.normalizedPublishedAt || formatNormalizedPublishedAt(event.publishedAt) || event.publishedAt
  return `name:${event.normalizedName}|at:${published}`
}

export function parseNumericValue(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim()
  // Keep leading minus (ASCII or unicode) for negative prints like -0.4%
  const match = cleaned.match(/[-−]?[\d.]+/)
  if (!match) return null
  const normalized = match[0].replace("−", "-")
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function compareActualToForecast(
  actual: string,
  forecast: string | null,
): ForecastComparison {
  if (forecast === null || forecast === undefined || forecast === "") return "unknown"
  if (isMissingMacroValue(forecast)) return "unknown"

  const actualNum = parseNumericValue(actual)
  const forecastNum = parseNumericValue(forecast)

  if (actualNum !== null && forecastNum !== null) {
    const diff = actualNum - forecastNum
    const tolerance = Math.max(Math.abs(forecastNum) * 0.001, 0.01)
    if (Math.abs(diff) <= tolerance) return "in_line"
    return diff > 0 ? "higher" : "lower"
  }

  if (actual.trim().toLowerCase() === forecast.trim().toLowerCase()) {
    return "in_line"
  }

  return "unknown"
}

export function evaluateUsMacroRecord(
  record: EconomicEventRecord,
  sinceMs: number,
  untilMs: number,
): { debug: UsMacroDebugRow; event: UsEconomicEvent | null } {
  const normalizedPublishedAt = formatNormalizedPublishedAt(record.publishedAt)
  const debugBase = {
    id: record.id,
    name: record.event,
    country: record.country,
    impact: String(record.impact),
    actual: toNullableMacroValue(record.actual),
    forecast: toNullableMacroValue(record.forecast),
    publishedAt: record.publishedAt,
    normalizedPublishedAt,
  }

  if (!isUsCountry(record.country)) {
    return {
      debug: { ...debugBase, rejectionReason: "not_us" },
      event: null,
    }
  }

  if (normalizeImpactLevel(record.impact) !== "high") {
    return {
      debug: { ...debugBase, rejectionReason: "not_high_impact" },
      event: null,
    }
  }

  const publishedMs = parsePublishedAtMs(record.publishedAt)
  if (publishedMs === null) {
    return {
      debug: { ...debugBase, rejectionReason: "invalid_published_at" },
      event: null,
    }
  }

  if (publishedMs < sinceMs || publishedMs > untilMs) {
    return {
      debug: { ...debugBase, rejectionReason: "outside_window" },
      event: null,
    }
  }

  const event = mapRecordToUsEvent(record)
  if (!hasReleasedUsMacroData(event)) {
    return {
      debug: { ...debugBase, rejectionReason: "missing_actual" },
      event: null,
    }
  }

  return {
    debug: { ...debugBase, rejectionReason: "accepted" },
    event,
  }
}

export function filterUsMacroCandidates(
  records: EconomicEventRecord[],
  sinceMs: number,
  untilMs: number = Date.now(),
): { events: UsEconomicEvent[]; debugRows: UsMacroDebugRow[] } {
  const events: UsEconomicEvent[] = []
  const debugRows: UsMacroDebugRow[] = []

  for (const record of records) {
    // Log every US (or US-currency) adjacent event; also log all for diagnosis.
    const { debug, event } = evaluateUsMacroRecord(record, sinceMs, untilMs)
    // Always emit debug for US-labelled OR accepted-path interest; emit all records
    // so operators can see why CPI was dropped if country mistyped.
    debugRows.push(debug)
    if (event) events.push(event)
  }

  return { events, debugRows }
}

export function deduplicateUsMacroEvents(
  events: UsEconomicEvent[],
  excludeKeys: Set<string> = new Set(),
): { events: UsEconomicEvent[]; removedKeys: string[] } {
  const seen = new Set<string>(excludeKeys)
  const removedKeys: string[] = []
  const kept: UsEconomicEvent[] = []

  for (const event of events) {
    const key = usMacroEventDedupKey(event)
    if (seen.has(key)) {
      removedKeys.push(key)
      continue
    }
    seen.add(key)
    kept.push(event)
  }

  return { events: kept, removedKeys }
}

export function sortUsMacroEventsByPriority(events: UsEconomicEvent[]): UsEconomicEvent[] {
  return [...events].sort((a, b) => {
    const priorityDiff = getUsMacroEventPriority(b.event) - getUsMacroEventPriority(a.event)
    if (priorityDiff !== 0) return priorityDiff

    const aTime = parsePublishedAtMs(a.publishedAt) ?? 0
    const bTime = parsePublishedAtMs(b.publishedAt) ?? 0
    if (bTime !== aTime) return bTime - aTime

    return a.normalizedName.localeCompare(b.normalizedName)
  })
}

export function selectTopUsMacroEvents(
  events: UsEconomicEvent[],
  max = US_MACRO_MAX_EVENTS,
): UsEconomicEvent[] {
  return sortUsMacroEventsByPriority(events).slice(0, max)
}
