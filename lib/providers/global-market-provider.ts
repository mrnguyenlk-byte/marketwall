import { type Trend, toTrend, spark } from "@/lib/market-utils"
import { fetchWithTimeout, safeFetchJson } from "@/lib/providers/fetch-utils"

export type GlobalQuoteCategory = "indices" | "commodities" | "forex"

export type GlobalQuote = {
  symbol: string
  name: string
  category: GlobalQuoteCategory
  price: number
  change: number
  changePercent: number
  updatedAt: string
  source: "live" | "mock"
}

export type GlobalMarketData = {
  quotes: GlobalQuote[]
  source: "live" | "mock"
}

type InstrumentDef = {
  yahoo: string
  stooq: string
  symbol: string
  name: string
  category: GlobalQuoteCategory
  mockPrice: number
  mockChangePercent: number
}

const INSTRUMENTS: InstrumentDef[] = [
  {
    yahoo: "^GSPC",
    stooq: "^spx",
    symbol: "S&P 500",
    name: "S&P 500",
    category: "indices",
    mockPrice: 5431.6,
    mockChangePercent: 0.34,
  },
  {
    yahoo: "^IXIC",
    stooq: "^ndq",
    symbol: "NASDAQ",
    name: "NASDAQ Composite",
    category: "indices",
    mockPrice: 17688.9,
    mockChangePercent: 0.54,
  },
  {
    yahoo: "^DJI",
    stooq: "^dji",
    symbol: "DOW JONES",
    name: "Dow Jones Industrial Average",
    category: "indices",
    mockPrice: 38712.2,
    mockChangePercent: -0.28,
  },
  {
    yahoo: "GC=F",
    stooq: "xauusd.us",
    symbol: "GOLD",
    name: "Gold",
    category: "commodities",
    mockPrice: 2347.8,
    mockChangePercent: 0.53,
  },
  {
    yahoo: "CL=F",
    stooq: "cl.f",
    symbol: "WTI OIL",
    name: "WTI Crude Oil",
    category: "commodities",
    mockPrice: 78.42,
    mockChangePercent: -1.08,
  },
  {
    yahoo: "DX-Y.NYB",
    stooq: "dxy.us",
    symbol: "DXY",
    name: "US Dollar Index",
    category: "forex",
    mockPrice: 104.32,
    mockChangePercent: -0.17,
  },
  {
    yahoo: "SI=F",
    stooq: "xagusd.us",
    symbol: "SILVER",
    name: "Silver",
    category: "commodities",
    mockPrice: 29.84,
    mockChangePercent: -0.7,
  },
]

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; FinancialDashboard/1.0)",
} as const

const instrumentByYahoo = new Map(INSTRUMENTS.map((i) => [i.yahoo, i]))
const instrumentByStooq = new Map(INSTRUMENTS.map((i) => [i.stooq.toLowerCase(), i]))

function round2(value: number): number {
  return Number(value.toFixed(2))
}

function changeFromPercent(price: number, changePercent: number): number {
  return round2((price * changePercent) / 100)
}

function buildQuote(
  instrument: InstrumentDef,
  price: number,
  change: number,
  changePercent: number,
  updatedAt: string,
  source: "live" | "mock",
): GlobalQuote {
  return {
    symbol: instrument.symbol,
    name: instrument.name,
    category: instrument.category,
    price: round2(price),
    change: round2(change),
    changePercent: round2(changePercent),
    updatedAt,
    source,
  }
}

function buildMockQuote(instrument: InstrumentDef): GlobalQuote {
  const change = changeFromPercent(instrument.mockPrice, instrument.mockChangePercent)
  return buildQuote(
    instrument,
    instrument.mockPrice,
    change,
    instrument.mockChangePercent,
    new Date().toISOString(),
    "mock",
  )
}

const MOCK_QUOTES: GlobalQuote[] = INSTRUMENTS.map(buildMockQuote)

export function getMockData(): GlobalMarketData {
  return { quotes: MOCK_QUOTES, source: "mock" }
}

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number
        chartPreviousClose?: number
        regularMarketChange?: number
        regularMarketChangePercent?: number
        regularMarketTime?: number
        symbol?: string
      }
    }>
  }
}

type YahooQuoteResponse = {
  quoteResponse?: {
    result?: Array<{
      symbol?: string
      regularMarketPrice?: number
      regularMarketChange?: number
      regularMarketChangePercent?: number
      regularMarketTime?: number
    }>
  }
}

async function fetchYahooChartQuote(instrument: InstrumentDef): Promise<GlobalQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(instrument.yahoo)}?interval=1d&range=1d`
  const json = await safeFetchJson<YahooChartResponse>(url, {
    headers: YAHOO_HEADERS,
    cache: "no-store",
  })

  const meta = json?.chart?.result?.[0]?.meta
  if (!meta?.regularMarketPrice) return null

  const price = meta.regularMarketPrice
  const previousClose = meta.chartPreviousClose ?? price
  const change =
    meta.regularMarketChange ?? round2(price - previousClose)
  const changePercent =
    meta.regularMarketChangePercent ??
    (previousClose ? round2((change / previousClose) * 100) : 0)
  const updatedAt = meta.regularMarketTime
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : new Date().toISOString()

  return buildQuote(instrument, price, change, changePercent, updatedAt, "live")
}

async function fetchYahooV8Quotes(): Promise<Map<string, GlobalQuote>> {
  const results = await Promise.all(
    INSTRUMENTS.map(async (instrument) => {
      try {
        const quote = await fetchYahooChartQuote(instrument)
        return quote ? ([instrument.symbol, quote] as const) : null
      } catch {
        return null
      }
    }),
  )

  return new Map(results.filter((entry): entry is [string, GlobalQuote] => entry != null))
}

async function fetchYahooV7Quotes(): Promise<Map<string, GlobalQuote>> {
  const symbols = encodeURIComponent(INSTRUMENTS.map((i) => i.yahoo).join(","))
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`
  const json = await safeFetchJson<YahooQuoteResponse>(url, {
    headers: YAHOO_HEADERS,
    cache: "no-store",
  })

  const rows = json?.quoteResponse?.result
  if (!rows?.length) return new Map()

  const map = new Map<string, GlobalQuote>()

  for (const row of rows) {
    const instrument = row.symbol ? instrumentByYahoo.get(row.symbol) : undefined
    if (!instrument || row.regularMarketPrice == null) continue

    const price = row.regularMarketPrice
    const change = row.regularMarketChange ?? 0
    const changePercent = row.regularMarketChangePercent ?? 0
    const updatedAt = row.regularMarketTime
      ? new Date(row.regularMarketTime * 1000).toISOString()
      : new Date().toISOString()

    map.set(
      instrument.symbol,
      buildQuote(instrument, price, change, changePercent, updatedAt, "live"),
    )
  }

  return map
}

async function safeFetchText(url: string, init?: RequestInit): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, init)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function parseStooqRow(line: string): GlobalQuote | null {
  const parts = line.split(",")
  if (parts.length < 7) return null

  const stooqSymbol = parts[0]?.trim().toLowerCase()
  const instrument = stooqSymbol ? instrumentByStooq.get(stooqSymbol) : undefined
  if (!instrument) return null

  const open = Number(parts[3])
  const close = Number(parts[6])
  if (!Number.isFinite(open) || !Number.isFinite(close) || open === 0) return null

  const change = round2(close - open)
  const changePercent = round2((change / open) * 100)
  const datePart = parts[1]?.trim()
  const timePart = parts[2]?.trim()
  const updatedAt =
    datePart && timePart
      ? new Date(`${datePart}T${timePart}Z`).toISOString()
      : new Date().toISOString()

  return buildQuote(instrument, close, change, changePercent, updatedAt, "live")
}

async function fetchStooqQuotes(): Promise<Map<string, GlobalQuote>> {
  const stooqSymbols = INSTRUMENTS.map((i) => i.stooq).join(",")
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbols)}&f=sd2t2ohlcv&h&e=csv`
  const text = await safeFetchText(url, { cache: "no-store" })
  if (!text) return new Map()

  const map = new Map<string, GlobalQuote>()
  for (const line of text.split("\n")) {
    if (!line.trim() || line.startsWith("Symbol")) continue
    const quote = parseStooqRow(line)
    if (quote) map.set(quote.symbol, quote)
  }

  return map
}

function mergeLiveMaps(...maps: Map<string, GlobalQuote>[]): Map<string, GlobalQuote> {
  const merged = new Map<string, GlobalQuote>()
  for (const map of maps) {
    for (const [symbol, quote] of map) {
      merged.set(symbol, quote)
    }
  }
  return merged
}

function buildResultFromLive(liveMap: Map<string, GlobalQuote>): GlobalMarketData {
  const quotes = INSTRUMENTS.map((instrument) => {
    return liveMap.get(instrument.symbol) ?? buildMockQuote(instrument)
  })

  const hasLive = quotes.some((q) => q.source === "live")
  return {
    quotes,
    source: hasLive ? "live" : "mock",
  }
}

export async function getData(): Promise<GlobalMarketData> {
  try {
    const [v8, v7, stooq] = await Promise.all([
      fetchYahooV8Quotes(),
      fetchYahooV7Quotes(),
      fetchStooqQuotes(),
    ])

    const liveMap = mergeLiveMaps(v8, v7, stooq)
    if (liveMap.size >= 3) {
      return buildResultFromLive(liveMap)
    }
  } catch {
    // fall through to mock
  }

  return getMockData()
}

export function globalSparkline(symbol: string, trend: Trend): number[] {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return spark(seed, 14, trend === "up" ? 1 : -1)
}

/** @deprecated Use changePercent with toTrend — kept for overlay helpers */
export function globalQuoteTrend(quote: GlobalQuote): Trend {
  return toTrend(quote.changePercent)
}
