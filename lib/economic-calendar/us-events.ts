import "server-only"

import { getData } from "@/lib/providers/calendar-provider"
import type { EconomicEventRecord } from "@/lib/providers/types"

export type UsEconomicEvent = {
  event: string
  actual: string | null
  forecast: string | null
  previous: string | null
  impact: "high" | "medium" | "low"
}

const MAJOR_US_EVENT_PATTERNS: RegExp[] = [
  /initial\s+jobless\s+claims/i,
  /non[-\s]?farm\s+payrolls/i,
  /core\s+cpi/i,
  /\bcpi\b/i,
  /\bppi\b/i,
  /retail\s+sales/i,
  /\bfomc\b/i,
  /\bgdp\b/i,
  /consumer\s+confidence/i,
]

const EMPTY_VALUE_PATTERN = /^[—\-–]+$/

function isMajorUsEvent(eventName: string): boolean {
  return MAJOR_US_EVENT_PATTERNS.some((pattern) => pattern.test(eventName))
}

function toNullableValue(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed || EMPTY_VALUE_PATTERN.test(trimmed)) return null
  return trimmed
}

function isWithinLastHours(isoDate: string, hours: number): boolean {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return false
  const cutoff = Date.now() - hours * 60 * 60 * 1000
  return date.getTime() >= cutoff
}

function mapRecordToUsEvent(record: EconomicEventRecord): UsEconomicEvent {
  return {
    event: record.event,
    actual: toNullableValue(record.actual),
    forecast: toNullableValue(record.forecast),
    previous: toNullableValue(record.previous),
    impact: record.impact,
  }
}

export function formatUsEconomicEventsForPrompt(events: UsEconomicEvent[]): string {
  if (!events.length) return ""

  const lines = ["Sự kiện vĩ mô Mỹ trong 24 giờ qua:"]

  for (const event of events) {
    lines.push(`- ${event.event} (tác động: ${event.impact})`)
    if (event.actual) lines.push(`  Thực tế: ${event.actual}`)
    if (event.forecast) lines.push(`  Dự báo: ${event.forecast}`)
    if (event.previous) lines.push(`  Trước đó: ${event.previous}`)
  }

  return lines.join("\n")
}

export async function getRecentUsEconomicEvents(
  options?: { hours?: number },
): Promise<UsEconomicEvent[]> {
  const hours = options?.hours ?? 24

  try {
    const data = await getData()
    return data.normalized
      .filter((record) => record.country === "US")
      .filter((record) => isMajorUsEvent(record.event))
      .filter((record) => isWithinLastHours(record.publishedAt, hours))
      .map(mapRecordToUsEvent)
  } catch (error) {
    console.warn(
      "[us-events] Failed to fetch US economic events:",
      error instanceof Error ? error.message : String(error),
    )
    return []
  }
}
