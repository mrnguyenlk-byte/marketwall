import "server-only"

import { safeFetchJson } from "@/lib/providers/fetch-utils"
import { CACHE_KEYS } from "@/lib/providers/cache"
import { chainProviders } from "@/lib/providers/fallback"
import { toEconomicEvents } from "@/lib/providers/mappers"
import type {
  DataSource,
  EconomicCalendarData,
  EconomicEvent,
  EconomicEventRecord,
} from "@/lib/providers/types"

export type { EconomicEvent, EconomicEventRecord, EconomicCalendarData }

/** @deprecated Use EconomicEventRecord */
export type CalendarEventRecord = EconomicEventRecord

/** @deprecated Use EconomicCalendarData */
export type CalendarData = EconomicCalendarData

const MOCK_RECORDS: EconomicEventRecord[] = [
  {
    id: "mock-us-cpi",
    time: "08:30",
    country: "US",
    currency: "USD",
    event: "US CPI",
    impact: "high",
    previous: "3.9%",
    forecast: "4.0%",
    actual: "4.1%",
    source: "BTrading Market Insights",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "mock-vn-cpi",
    time: "08:30",
    country: "VN",
    currency: "VND",
    event: "Vietnam CPI",
    impact: "high",
    previous: "3.9%",
    forecast: "4.0%",
    actual: "4.1%",
    source: "BTrading Market Insights",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "mock-us-retail",
    time: "10:00",
    country: "US",
    currency: "USD",
    event: "US Retail Sales",
    impact: "medium",
    previous: "0.6%",
    forecast: "0.4%",
    actual: "0.5%",
    source: "BTrading Market Insights",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "mock-ecb-rate",
    time: "12:45",
    country: "EU",
    currency: "EUR",
    event: "ECB Rate Decision",
    impact: "high",
    previous: "4.50%",
    forecast: "4.25%",
    actual: "—",
    source: "BTrading Market Insights",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "mock-fomc",
    time: "14:00",
    country: "US",
    currency: "USD",
    event: "FOMC Statement",
    impact: "high",
    previous: "5.50%",
    forecast: "5.25%",
    actual: "5.25%",
    source: "BTrading Market Insights",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "mock-vn-ip",
    time: "14:00",
    country: "VN",
    currency: "VND",
    event: "Vietnam Industrial Production",
    impact: "medium",
    previous: "8.9%",
    forecast: "9.4%",
    actual: "—",
    source: "BTrading Market Insights",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "mock-jp-gdp",
    time: "23:50",
    country: "JP",
    currency: "JPY",
    event: "Japan GDP",
    impact: "high",
    previous: "1.2%",
    forecast: "1.5%",
    actual: "—",
    source: "BTrading Market Insights",
    publishedAt: new Date().toISOString(),
  },
]

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

function mapImpact(importance?: number | string): "high" | "medium" | "low" {
  if (typeof importance === "number") {
    if (importance >= 3) return "high"
    if (importance === 2) return "medium"
    return "low"
  }

  const raw = String(importance ?? "")
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
    raw === "★★★" ||
    raw.includes("★★★")
  ) {
    return "high"
  }
  if (raw === "medium" || raw === "orange" || raw === "2" || raw === "★★") return "medium"
  if ((Number.parseFloat(raw) || 0) >= 3) return "high"
  if ((Number.parseFloat(raw) || 0) === 2) return "medium"
  return "low"
}

function normalizeCountryCode(country: string): string {
  const raw = country.trim().toUpperCase()
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

function formatValue(value: string | number | null | undefined): string {
  // Preserve numeric zero and negatives (e.g. -0.4) — only null/undefined/"" are missing.
  if (value === null || value === undefined || value === "") return "—"
  return String(value)
}

function extractTime(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function mapTradingEconomicsEvent(row: TradingEconomicsEvent): EconomicEventRecord | null {
  if (!row.Event || !row.Country || !row.Date) return null

  const country = normalizeCountryCode(row.Country)
  // Prefer scheduled release time (Date) for windowing; LastUpdate can lag or be fetch-time.
  const publishedAt = row.Date

  return {
    id: String(row.CalendarId ?? `${country}-${row.Event}-${row.Date}`),
    time: extractTime(row.Date),
    country,
    currency: row.Currency ?? "—",
    event: row.Event,
    impact: mapImpact(row.Importance),
    previous: formatValue(row.Previous),
    forecast: formatValue(row.Forecast),
    actual: formatValue(row.Actual),
    source: row.Source ?? "Trading Economics",
    publishedAt,
  }
}

function buildCalendarData(records: EconomicEventRecord[], source: DataSource): EconomicCalendarData {
  const vietnam = toEconomicEvents(records.filter((r) => r.country === "VN"))
  const global = toEconomicEvents(records.filter((r) => r.country !== "VN"))
  const events = toEconomicEvents(records)

  return {
    normalized: records,
    vietnam,
    global,
    events,
    source,
  }
}

export function getMockData(): EconomicCalendarData {
  return buildCalendarData(MOCK_RECORDS, "mock")
}

const FF_CALENDAR_URL =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json"

type FairEconomyEvent = {
  title?: string
  country?: string
  date?: string
  impact?: string
  forecast?: string
  previous?: string
  actual?: string
}

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: "US",
  EUR: "EU",
  GBP: "GB",
  JPY: "JP",
  AUD: "AU",
  NZD: "NZ",
  CAD: "CA",
  CHF: "CH",
  CNY: "CN",
  VND: "VN",
  KRW: "KR",
  SGD: "SG",
  HKD: "HK",
  INR: "IN",
  THB: "TH",
  IDR: "ID",
  MYR: "MY",
  PHP: "PH",
  SEK: "SE",
  NOK: "NO",
  DKK: "DK",
  PLN: "PL",
  TRY: "TR",
  ZAR: "ZA",
  BRL: "BR",
  MXN: "MX",
}

function mapFairEconomyEvent(row: FairEconomyEvent, index: number): EconomicEventRecord | null {
  if (!row.title || !row.date) return null

  const currency = row.country?.toUpperCase() ?? "—"
  const mapped = CURRENCY_TO_COUNTRY[currency] ?? currency.slice(0, 2)
  const country = normalizeCountryCode(mapped)
  const publishedAt = row.date

  return {
    id: `ff-${country}-${index}-${row.title.slice(0, 24)}`,
    time: extractTime(row.date),
    country,
    currency,
    event: row.title,
    impact: mapImpact(row.impact),
    previous: formatValue(row.previous),
    forecast: formatValue(row.forecast),
    actual: formatValue(row.actual),
    source: "Forex Factory (Fair Economy)",
    publishedAt,
  }
}

async function fetchFairEconomyCalendar(): Promise<EconomicEventRecord[] | null> {
  const rows = await safeFetchJson<FairEconomyEvent[]>(FF_CALENDAR_URL, { cache: "no-store" })
  if (!rows?.length) return null

  const records = rows
    .map(mapFairEconomyEvent)
    .filter((e): e is EconomicEventRecord => e != null)
    .slice(0, 30)

  return records.length ? records : null
}

async function fetchTradingEconomics(): Promise<EconomicEventRecord[] | null> {
  // Prefer the legacy mapper path which preserves release Date as publishedAt
  // and normalizes United States → US (CalendarEventRow path previously stamped "now").
  return fetchTradingEconomicsLegacy()
}

async function fetchTradingEconomicsLegacy(): Promise<EconomicEventRecord[] | null> {
  const key =
    process.env.TRADING_ECONOMICS_API_KEY?.trim() ||
    process.env.TRADING_ECONOMICS_KEY?.trim()
  if (!key) return null

  const url = `https://api.tradingeconomics.com/calendar?c=${encodeURIComponent(key)}&format=json`
  const rows = await safeFetchJson<TradingEconomicsEvent[]>(url, { cache: "no-store" })
  if (!rows?.length) return null

  const records = rows
    .map(mapTradingEconomicsEvent)
    .filter((e): e is EconomicEventRecord => e != null)
    .slice(0, 20)

  return records.length ? records : null
}

export async function getData(): Promise<EconomicCalendarData> {
  const resolved = await chainProviders(
    [
      { name: "trading-economics-api", fetch: fetchTradingEconomics },
      { name: "fair-economy", fetch: fetchFairEconomyCalendar },
      { name: "trading-economics-legacy", fetch: fetchTradingEconomicsLegacy },
    ],
    () => MOCK_RECORDS,
    { cacheKey: CACHE_KEYS.economic, cacheTtlMs: 600_000 },
  )

  return buildCalendarData(
    resolved.data,
    resolved.source === "mock" ? "mock" : resolved.source,
  )
}

export { toEconomicEvents } from "@/lib/providers/mappers"
