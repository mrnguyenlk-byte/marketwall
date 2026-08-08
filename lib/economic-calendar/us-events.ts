import "server-only"

import { getData } from "@/lib/providers/calendar-provider"
import {
  filterUsMacroCandidates,
  selectTopUsMacroEvents,
  type UsEconomicEvent,
  type UsMacroDebugRow,
} from "./us-macro-core"

export type { UsEconomicEvent } from "./us-macro-core"
export { US_MACRO_MAX_EVENTS } from "./us-macro-core"

function logUsMacroRawDebug(rows: UsMacroDebugRow[]): void {
  for (const row of rows) {
    console.log(
      [
        "US_MACRO_RAW",
        `id=${row.id}`,
        `name=${JSON.stringify(row.name)}`,
        `country=${row.country}`,
        `impact=${row.impact}`,
        `actual=${JSON.stringify(row.actual)}`,
        `forecast=${JSON.stringify(row.forecast)}`,
        `publishedAt=${row.publishedAt}`,
        `normalizedPublishedAt=${row.normalizedPublishedAt}`,
        `rejectionReason=${row.rejectionReason}`,
      ].join(" "),
    )
  }
}

function logUsMacroCandidates(events: UsEconomicEvent[]): void {
  console.log(
    `US_MACRO_CANDIDATES count=${events.length} events=${events
      .map((event) => `${event.normalizedName}@${event.normalizedPublishedAt}`)
      .join("; ")}`,
  )
}

function logUsMacroSelected(events: UsEconomicEvent[]): void {
  console.log(
    `US_MACRO_SELECTED count=${events.length} events=${events
      .map((event) => `${event.normalizedName}@${event.normalizedPublishedAt}`)
      .join("; ")}`,
  )
}

function logUsMacroEmpty(): void {
  console.log("US_MACRO_EMPTY")
}

export function formatUsEconomicEventsForPrompt(events: UsEconomicEvent[]): string {
  if (!events.length) return ""

  const lines = ["Sự kiện vĩ mô Mỹ tác động cao (★★★) kể từ bản tin trước:"]

  for (const event of events) {
    lines.push(`- ${event.event}`)
    const actual = event.actual ?? event.verifiedContent
    if (actual !== null && actual !== undefined && actual !== "") {
      lines.push(`  Thực tế: ${actual}`)
    }
    if (event.forecast !== null && event.forecast !== undefined && event.forecast !== "") {
      lines.push(`  Dự báo: ${event.forecast}`)
    }
    if (event.previous !== null && event.previous !== undefined && event.previous !== "") {
      lines.push(`  Trước đó: ${event.previous}`)
    }
  }

  return lines.join("\n")
}

export type UsMacroEventsResult = {
  events: UsEconomicEvent[]
  /** True only when a real calendar provider was successfully queried. */
  calendarChecked: boolean
}

export async function getUsMacroEventsWithStatus(
  _currentDate: string,
): Promise<UsMacroEventsResult> {
  try {
    const data = await getData()

    // Never turn a provider outage into a market statement. Mock records are
    // useful for the dashboard UI, but must not be used in published analysis.
    if (data.source === "mock") {
      console.warn("US_MACRO_UNVERIFIED provider=mock")
      return { events: [], calendarChecked: false }
    }

    const untilMs = Date.now()
    const sinceMs = untilMs - 24 * 60 * 60 * 1000

    console.log(
      `US_MACRO_WINDOW since=${new Date(sinceMs).toISOString()} until=${new Date(untilMs).toISOString()} tz=Asia/Ho_Chi_Minh mode=rolling-24h`,
    )

    const { events: candidates, debugRows } = filterUsMacroCandidates(
      data.normalized,
      sinceMs,
      untilMs,
    )
    logUsMacroRawDebug(debugRows)
    logUsMacroCandidates(candidates)

    const selected = selectTopUsMacroEvents(candidates)
    if (!selected.length) {
      logUsMacroEmpty()
      return { events: [], calendarChecked: true }
    }

    logUsMacroSelected(selected)
    return { events: selected, calendarChecked: true }
  } catch (error) {
    console.warn(
      "[us-events] Failed to fetch US economic events:",
      error instanceof Error ? error.message : String(error),
    )
    logUsMacroEmpty()
    return { events: [], calendarChecked: false }
  }
}

/** Backwards-compatible events-only reader. */
export async function getUsMacroEventsForArticle(
  currentDate: string,
): Promise<UsEconomicEvent[]> {
  return (await getUsMacroEventsWithStatus(currentDate)).events
}

/** @deprecated Use getUsMacroEventsForArticle(currentDate) */
export async function getRecentUsEconomicEvents(
  options?: { hours?: number; currentDate?: string },
): Promise<UsEconomicEvent[]> {
  if (options?.currentDate) {
    return getUsMacroEventsForArticle(options.currentDate)
  }

  try {
    const data = await getData()
    const sinceMs = Date.now() - (options?.hours ?? 24) * 60 * 60 * 1000
    const { events: candidates, debugRows } = filterUsMacroCandidates(
      data.normalized,
      sinceMs,
    )
    logUsMacroRawDebug(debugRows)
    logUsMacroCandidates(candidates)
    const selected = selectTopUsMacroEvents(candidates)
    if (!selected.length) logUsMacroEmpty()
    else logUsMacroSelected(selected)
    return selected
  } catch (error) {
    console.warn(
      "[us-events] Failed to fetch US economic events:",
      error instanceof Error ? error.message : String(error),
    )
    logUsMacroEmpty()
    return []
  }
}
