import "server-only"

import { getDailyAnalysisList } from "@/lib/daily-analysis/storage"
import type { DailyAnalysis } from "@/lib/daily-analysis/types"
import { getData } from "@/lib/providers/calendar-provider"
import type { EconomicEventRecord } from "@/lib/providers/types"
import {
  deduplicateUsMacroEvents,
  filterUsMacroCandidates,
  resolveUsMacroSinceMs,
  selectTopUsMacroEvents,
  usMacroEventDedupKey,
  type UsEconomicEvent,
} from "./us-macro-core"

export type { UsEconomicEvent } from "./us-macro-core"
export { US_MACRO_MAX_EVENTS } from "./us-macro-core"

function findPreviousArticle(
  articles: DailyAnalysis[],
  currentDate: string,
): DailyAnalysis | null {
  return (
    articles
      .filter((article) => article.date < currentDate)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  )
}

function findArticleBefore(
  articles: DailyAnalysis[],
  article: DailyAnalysis,
): DailyAnalysis | null {
  return (
    articles
      .filter((candidate) => candidate.date < article.date)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  )
}

async function buildPreviousArticleDedupKeys(
  articles: DailyAnalysis[],
  previousArticle: DailyAnalysis | null,
  records: EconomicEventRecord[],
): Promise<Set<string>> {
  if (!previousArticle) return new Set()

  const articleBeforePrevious = findArticleBefore(articles, previousArticle)
  const sinceMs = resolveUsMacroSinceMs(articleBeforePrevious?.createdAt)
  const untilMs = new Date(previousArticle.createdAt).getTime()

  const previousWindowEvents = filterUsMacroCandidates(records, sinceMs, untilMs)
  const previousSelected = selectTopUsMacroEvents(previousWindowEvents)

  return new Set(previousSelected.map(usMacroEventDedupKey))
}

function logUsMacroCandidates(events: UsEconomicEvent[]): void {
  console.log(
    `US_MACRO_CANDIDATES count=${events.length} events=${events
      .map((event) => `${event.event}@${event.publishedAt}`)
      .join("; ")}`,
  )
}

function logUsMacroSelected(events: UsEconomicEvent[]): void {
  console.log(
    `US_MACRO_SELECTED count=${events.length} events=${events
      .map((event) => `${event.event}@${event.publishedAt}`)
      .join("; ")}`,
  )
}

function logUsMacroDeduped(removedKeys: string[]): void {
  if (!removedKeys.length) return
  console.log(`US_MACRO_DEDUPED removed=${removedKeys.length} keys=${removedKeys.join(", ")}`)
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
    if (actual) lines.push(`  Thực tế: ${actual}`)
    if (event.forecast) lines.push(`  Dự báo: ${event.forecast}`)
    if (event.previous) lines.push(`  Trước đó: ${event.previous}`)
  }

  return lines.join("\n")
}

export async function getUsMacroEventsForArticle(
  currentDate: string,
): Promise<UsEconomicEvent[]> {
  try {
    const [data, articles] = await Promise.all([getData(), getDailyAnalysisList()])
    const previousArticle = findPreviousArticle(articles, currentDate)
    const sinceMs = resolveUsMacroSinceMs(previousArticle?.createdAt)
    const untilMs = Date.now()

    const candidates = filterUsMacroCandidates(data.normalized, sinceMs, untilMs)
    logUsMacroCandidates(candidates)

    const excludeKeys = await buildPreviousArticleDedupKeys(
      articles,
      previousArticle,
      data.normalized,
    )
    const { events: deduped, removedKeys } = deduplicateUsMacroEvents(candidates, excludeKeys)
    logUsMacroDeduped(removedKeys)

    const selected = selectTopUsMacroEvents(deduped)
    if (!selected.length) {
      logUsMacroEmpty()
      return []
    }

    logUsMacroSelected(selected)
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
    const candidates = filterUsMacroCandidates(data.normalized, sinceMs)
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
