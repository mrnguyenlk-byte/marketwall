import "server-only"

import { safeFetchJson } from "@/lib/providers/fetch-utils"

import type { CalendarEventRow } from "./types"

/** Requires env: TRADING_ECONOMICS_API_KEY (falls back to TRADING_ECONOMICS_KEY). */
const BASE_URL = "https://api.tradingeconomics.com/calendar"

type TradingEconomicsEvent = {
  CalendarId?: string | number
  Date?: string
  Country?: string
  Currency?: string
  Event?: string
  Importance?: number | string
  Actual?: string | number | null
  Forecast?: string | number | null
  Previous?: string | number | null
  Source?: string
  LastUpdate?: string
}

function getApiKey(): string | null {
  try {
    return (
      process.env.TRADING_ECONOMICS_API_KEY?.trim() ||
      process.env.TRADING_ECONOMICS_KEY?.trim() ||
      null
    )
  } catch {
    return null
  }
}

function mapImpact(importance?: number | string): "high" | "medium" | "low" {
  if (typeof importance === "number") {
    if (importance >= 3) return "high"
    if (importance === 2) return "medium"
    return "low"
  }
  const raw = String(importance ?? "")
    .trim()
    .toLowerCase()
  if (
    raw === "high" ||
    raw === "high impact" ||
    raw === "red" ||
    raw === "3" ||
    raw === "3-star" ||
    raw === "★★★"
  ) {
    return "high"
  }
  if (raw === "medium" || raw === "2") return "medium"
  const asNum = Number.parseFloat(raw)
  if (asNum >= 3) return "high"
  if (asNum === 2) return "medium"
  return "low"
}

function normalizeCountry(country: string): string {
  const raw = country.trim().toUpperCase()
  if (
    raw === "US" ||
    raw === "USA" ||
    raw === "UNITED STATES" ||
    raw === "UNITED STATES OF AMERICA"
  ) {
    return "US"
  }
  return raw
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
}

function extractTime(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return "—"
  }
}

function mapEvent(row: TradingEconomicsEvent): CalendarEventRow | null {
  try {
    if (!row.Event || !row.Country || !row.Date) return null

    return {
      time: extractTime(row.Date),
      country: normalizeCountry(row.Country),
      event: row.Event,
      impact: mapImpact(row.Importance),
      forecast: formatValue(row.Forecast),
      actual: formatValue(row.Actual),
      previous: formatValue(row.Previous),
    }
  } catch {
    return null
  }
}

/** Fetch economic calendar events from Trading Economics. */
export async function fetchTradingEconomicsCalendar(
  limit = 20,
): Promise<CalendarEventRow[]> {
  try {
    const apiKey = getApiKey()
    if (!apiKey) return []

    const url = `${BASE_URL}?c=${encodeURIComponent(apiKey)}&format=json`
    const rows = await safeFetchJson<TradingEconomicsEvent[]>(url, { cache: "no-store" })
    if (!rows?.length) return []

    return rows
      .map(mapEvent)
      .filter((event): event is CalendarEventRow => event != null)
      .slice(0, limit)
  } catch {
    return []
  }
}
