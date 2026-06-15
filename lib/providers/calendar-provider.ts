import { type Bi } from "@/lib/market-utils"
import { safeFetchJson } from "@/lib/providers/fetch-utils"

export type CalendarEventRecord = {
  id: string
  time: string
  country: string
  currency: string
  event: string
  impact: "high" | "medium" | "low"
  previous: string
  forecast: string
  actual: string
  source: string
  publishedAt: string
}

/** UI-facing event shape used by the dashboard component */
export type EconomicEvent = {
  id: string
  time: string
  country: string
  flag: string
  event: Bi
  impact: "high" | "medium" | "low"
  actual: string
  forecast: string
  previous: string
}

export type CalendarData = {
  normalized: CalendarEventRecord[]
  vietnam: EconomicEvent[]
  global: EconomicEvent[]
  events: EconomicEvent[]
  source: "live" | "mock"
}

const COUNTRY_FLAGS: Record<string, string> = {
  VN: "🇻🇳",
  US: "🇺🇸",
  UK: "🇬🇧",
  JP: "🇯🇵",
  EU: "🇪🇺",
  CN: "🇨🇳",
}

const MOCK_RECORDS: CalendarEventRecord[] = [
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
  Importance?: number
  Actual?: string | number | null
  Forecast?: string | number | null
  Previous?: string | number | null
  Source?: string
  LastUpdate?: string
}

function mapImpact(importance?: number): "high" | "medium" | "low" {
  if ((importance ?? 0) >= 3) return "high"
  if ((importance ?? 0) === 2) return "medium"
  return "low"
}

function formatValue(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—"
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

function mapTradingEconomicsEvent(row: TradingEconomicsEvent): CalendarEventRecord | null {
  if (!row.Event || !row.Country || !row.Date) return null

  const country = row.Country.toUpperCase()
  const publishedAt = row.LastUpdate ?? row.Date

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

export function toEconomicEvents(records: CalendarEventRecord[]): EconomicEvent[] {
  return records.map((record) => ({
    id: record.id,
    time: record.time,
    country: record.country,
    flag: COUNTRY_FLAGS[record.country] ?? "🌐",
    event: { vi: record.event, en: record.event },
    impact: record.impact,
    actual: record.actual,
    forecast: record.forecast,
    previous: record.previous,
  }))
}

function buildCalendarData(records: CalendarEventRecord[], source: "live" | "mock"): CalendarData {
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

export function getMockData(): CalendarData {
  return buildCalendarData(MOCK_RECORDS, "mock")
}

async function fetchTradingEconomics(): Promise<CalendarEventRecord[] | null> {
  const key = process.env.TRADING_ECONOMICS_KEY?.trim()
  if (!key) return null

  const url = `https://api.tradingeconomics.com/calendar?c=${encodeURIComponent(key)}&format=json`
  const rows = await safeFetchJson<TradingEconomicsEvent[]>(url, { cache: "no-store" })
  if (!rows?.length) return null

  const records = rows
    .map(mapTradingEconomicsEvent)
    .filter((e): e is CalendarEventRecord => e != null)
    .slice(0, 20)

  return records.length ? records : null
}

export async function getData(): Promise<CalendarData> {
  const mock = getMockData()

  try {
    const live = await fetchTradingEconomics()
    if (live?.length) return buildCalendarData(live, "live")
  } catch {
    // fall through to mock
  }

  return mock
}
