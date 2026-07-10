import type { EconomicEventRecord } from "@/lib/providers/types"

export const US_MACRO_MAX_EVENTS = 3
export const US_MACRO_FALLBACK_HOURS = 24

export const US_MACRO_EMPTY_MESSAGE =
  "• Không có dữ liệu kinh tế Mỹ mức tác động cao (★★★) được công bố kể từ bản tin trước."

export type UsEconomicEvent = {
  id: string
  event: string
  actual: string | null
  forecast: string | null
  previous: string | null
  impact: "high" | "medium" | "low"
  publishedAt: string
  /** Verified narrative for Fed decisions / important speeches when numeric actual is absent. */
  verifiedContent?: string | null
}

export type ForecastComparison = "higher" | "lower" | "in_line" | "unknown"

const EMPTY_VALUE_PATTERN = /^[—\-–]+$/

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

export function toNullableMacroValue(value: string | undefined | null): string | null {
  const trimmed = (value ?? "").trim()
  if (!trimmed || EMPTY_VALUE_PATTERN.test(trimmed)) return null
  return trimmed
}

export function isHighImpactUsEvent(record: EconomicEventRecord): boolean {
  return record.country === "US" && record.impact === "high"
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
  if (event.actual?.trim()) return true
  if (isFedExceptionEvent(event.event) && event.verifiedContent?.trim()) return true
  return false
}

export function mapRecordToUsEvent(record: EconomicEventRecord): UsEconomicEvent {
  const rawActual = toNullableMacroValue(record.actual)
  const isException = isFedExceptionEvent(record.event)
  const isNumericActual =
    rawActual != null && /^-?[\d.,]+\s*%?$/.test(rawActual.replace(/,/g, ""))

  if (isException && rawActual && !isNumericActual) {
    return {
      id: record.id,
      event: record.event,
      actual: null,
      forecast: toNullableMacroValue(record.forecast),
      previous: toNullableMacroValue(record.previous),
      impact: record.impact,
      publishedAt: record.publishedAt,
      verifiedContent: rawActual,
    }
  }

  return {
    id: record.id,
    event: record.event,
    actual: rawActual,
    forecast: toNullableMacroValue(record.forecast),
    previous: toNullableMacroValue(record.previous),
    impact: record.impact,
    publishedAt: record.publishedAt,
    verifiedContent: null,
  }
}

export function getUsMacroEventPriority(eventName: string): number {
  const name = eventName.toLowerCase()

  if (isFedRateDecisionEvent(name)) return 100
  if (/non[-\s]?farm\s+payrolls|\bnfp\b/i.test(name)) return 95
  if (/core\s+cpi/i.test(name)) return 90
  if (/\bcpi\b/i.test(name)) return 92
  if (/unemployment\s+rate/i.test(name)) return 88
  if (/core\s+pce/i.test(name)) return 87
  if (/ppi/i.test(name)) return 85
  if (/\bgdp\b/i.test(name)) return 82
  if (/retail\s+sales/i.test(name)) return 80
  if (/ism\s+(manufacturing|services)/i.test(name)) return 78
  if (/jobless\s+claims/i.test(name)) return 72
  if (isFedSpeechEvent(name)) return 70

  return 60
}

export function usMacroEventDedupKey(event: UsEconomicEvent): string {
  if (event.id?.trim()) return `id:${event.id.trim()}`
  return `name:${event.event.trim().toLowerCase()}|at:${event.publishedAt}`
}

export function parseNumericValue(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim()
  const match = cleaned.match(/-?[\d.]+/)
  if (!match) return null
  const parsed = Number.parseFloat(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

export function compareActualToForecast(
  actual: string,
  forecast: string | null,
): ForecastComparison {
  if (!forecast) return "unknown"

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

export function filterUsMacroCandidates(
  records: EconomicEventRecord[],
  sinceMs: number,
  untilMs: number = Date.now(),
): UsEconomicEvent[] {
  return records
    .filter(isHighImpactUsEvent)
    .filter((record) => {
      const publishedAt = new Date(record.publishedAt).getTime()
      return (
        !Number.isNaN(publishedAt) && publishedAt >= sinceMs && publishedAt <= untilMs
      )
    })
    .map(mapRecordToUsEvent)
    .filter(hasReleasedUsMacroData)
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
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
}

export function selectTopUsMacroEvents(
  events: UsEconomicEvent[],
  max = US_MACRO_MAX_EVENTS,
): UsEconomicEvent[] {
  return sortUsMacroEventsByPriority(events).slice(0, max)
}

export function resolveUsMacroSinceMs(
  previousArticleCreatedAt: string | null | undefined,
  nowMs: number = Date.now(),
): number {
  if (previousArticleCreatedAt) {
    const parsed = new Date(previousArticleCreatedAt).getTime()
    if (!Number.isNaN(parsed)) return parsed
  }
  return nowMs - US_MACRO_FALLBACK_HOURS * 60 * 60 * 1000
}
