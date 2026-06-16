import "server-only"

import type { FxPairQuote } from "@/lib/forex/types"
import type { MarketQuote } from "@/types/market"

const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; MarketWall/1.0)",
  Accept: "application/json",
} as const

const CHART_INTERVAL = "1d"
const CHART_RANGE = "1d"
const FX_CONCURRENCY = 8
const STOCK_CONCURRENCY = 10
const REQUEST_GAP_MS = 60

type YahooChartMeta = {
  regularMarketPrice?: number
  chartPreviousClose?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  regularMarketTime?: number
}

type YahooChartResponse = {
  chart?: {
    result?: Array<{ meta?: YahooChartMeta }>
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

/** `EUR/USD` → `EURUSD=X` */
export function fxPairToYahooSymbol(pair: string): string {
  return `${pair.replace("/", "").toUpperCase()}=X`
}

/** Dashboard / heatmap symbol → Yahoo ticker. */
export function stockToYahooSymbol(symbol: string, apiSymbol?: string): string {
  const raw = (apiSymbol ?? symbol).trim()
  if (raw.includes("/")) return raw.replace("/", "-")
  if (raw === "BRKB") return "BRK-B"
  return raw
}

async function fetchYahooChartMeta(yahooSymbol: string): Promise<YahooChartMeta | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${CHART_INTERVAL}&range=${CHART_RANGE}`

  try {
    const res = await fetch(url, { headers: YAHOO_HEADERS, cache: "no-store" })
    if (!res.ok) return null
    const json = (await res.json()) as YahooChartResponse
    return json.chart?.result?.[0]?.meta ?? null
  } catch {
    return null
  }
}

function metaToQuoteFields(meta: YahooChartMeta): {
  price: number
  change: number
  changePercent: number
  updatedAt: string
} | null {
  const price = meta.regularMarketPrice
  if (price == null || !Number.isFinite(price)) return null

  const previousClose = meta.chartPreviousClose ?? price
  const change = meta.regularMarketChange ?? round2(price - previousClose)
  const changePercent =
    meta.regularMarketChangePercent ??
    (previousClose ? round2((change / previousClose) * 100) : 0)
  const updatedAt = meta.regularMarketTime
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : new Date().toISOString()

  return { price: round2(price), change: round2(change), changePercent: round2(changePercent), updatedAt }
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)
    const chunkResults = await Promise.all(chunk.map(mapper))
    for (const row of chunkResults) {
      if (row) results.push(row)
    }
    if (i + concurrency < items.length) await sleep(REQUEST_GAP_MS)
  }
  return results
}

/** Fetch FX pair quotes via Yahoo Finance chart API (no API key). */
export async function fetchYahooFxPairQuotes(pairs: readonly string[]): Promise<FxPairQuote[]> {
  const quotes = await mapWithConcurrency(pairs, FX_CONCURRENCY, async (pair) => {
    const meta = await fetchYahooChartMeta(fxPairToYahooSymbol(pair))
    if (!meta) return null
    const fields = metaToQuoteFields(meta)
    if (!fields) return null
    return {
      symbol: pair.replace("/", ""),
      price: fields.price,
      changePercent: fields.changePercent,
      updatedAt: fields.updatedAt,
    } satisfies FxPairQuote
  })

  console.log(
    `[provider:yahoo] context=fetchFxPairQuotes requested=${pairs.length} parsed=${quotes.length}`,
  )

  return quotes
}

export type YahooStockRequest = {
  symbol: string
  apiSymbol?: string
  name?: string
}

/** Fetch US equity quotes via Yahoo Finance chart API (no API key). */
export async function fetchYahooStockQuotes(requests: YahooStockRequest[]): Promise<MarketQuote[]> {
  const quotes = await mapWithConcurrency(requests, STOCK_CONCURRENCY, async (req) => {
    const yahooSymbol = stockToYahooSymbol(req.symbol, req.apiSymbol)
    const meta = await fetchYahooChartMeta(yahooSymbol)
    if (!meta) return null
    const fields = metaToQuoteFields(meta)
    if (!fields) return null

    return {
      symbol: req.symbol,
      name: req.name ?? req.symbol,
      price: fields.price,
      change: fields.change,
      changePercent: fields.changePercent,
      open: fields.price - fields.change,
      high: fields.price,
      low: fields.price,
      volume: 0,
      updatedAt: fields.updatedAt,
    } satisfies MarketQuote
  })

  console.log(
    `[provider:yahoo] context=fetchStockQuotes requested=${requests.length} parsed=${quotes.length}`,
  )

  return quotes
}
