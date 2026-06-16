import "server-only"

import {
  CURRENCY_STRENGTH_PAIRS,
  getCryptoSymbolDefs,
  getIndexSymbolDefs,
  OVERVIEW_SYMBOLS,
} from "@/config/market-symbols"
import {
  defsFromSymbols,
  extractQuoteRow,
  normalizeQuoteRow,
  normalizeTimeSeries,
  pairDef,
  stockDef,
} from "@/lib/market/normalize"
import type { MarketQuote } from "@/types/market"

import type {
  FxPairQuote,
  HeatmapQuoteRow,
  MarketDetailPayload,
  NormalizedTimeSeriesPoint,
  TwelveDataErrorBody,
  TwelveDataQuoteResponse,
  TwelveDataTimeSeriesResponse,
} from "./types"
import { TwelveDataApiError } from "./types"

export { TwelveDataApiError } from "./types"
export type { FxPairQuote, HeatmapQuoteRow, MarketDetailPayload, NormalizedTimeSeriesPoint }

const BASE_URL = "https://api.twelvedata.com"
const DEFAULT_REVALIDATE_SECONDS = 30
const MAX_RETRIES = 3
const RETRY_BASE_MS = 400

function getApiKey(): string | null {
  try {
    const key = process.env.TWELVE_DATA_API_KEY?.trim()
    return key || null
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

function parseErrorBody(body: unknown): TwelveDataErrorBody | null {
  if (!body || typeof body !== "object") return null
  return body as TwelveDataErrorBody
}

async function tdFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  options?: { revalidateSeconds?: number },
): Promise<T> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new TwelveDataApiError("TWELVE_DATA_API_KEY is not configured", 401, "error")
  }

  const search = new URLSearchParams()
  search.set("apikey", apiKey)
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") search.set(key, String(value))
  }

  const url = `${BASE_URL}${path}?${search.toString()}`
  const revalidate = options?.revalidateSeconds ?? DEFAULT_REVALIDATE_SECONDS
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate },
        cache: "force-cache",
      })

      const json = (await res.json()) as T & TwelveDataErrorBody

      const errBody = parseErrorBody(json)
      if (errBody?.status === "error" || (errBody?.code && errBody.code >= 400)) {
        const code = errBody.code ?? res.status
        const message = errBody.message ?? "Twelve Data request failed"
        if (isRetryableStatus(code) && attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_BASE_MS * 2 ** attempt)
          continue
        }
        throw new TwelveDataApiError(message, code, errBody.status ?? "error")
      }

      if (!res.ok) {
        if (isRetryableStatus(res.status) && attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_BASE_MS * 2 ** attempt)
          continue
        }
        throw new TwelveDataApiError(`HTTP ${res.status}`, res.status, "error")
      }

      return json
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (error instanceof TwelveDataApiError && !isRetryableStatus(error.code)) {
        throw error
      }
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_BASE_MS * 2 ** attempt)
        continue
      }
    }
  }

  throw lastError ?? new TwelveDataApiError("Twelve Data request failed", 0, "error")
}

/** Fetch a single quote from Twelve Data. */
export async function getQuote(symbol: string): Promise<MarketQuote | null> {
  try {
    const def =
      OVERVIEW_SYMBOLS.find((s) => s.apiSymbol === symbol || s.displaySymbol === symbol) ??
      pairDef(symbol)
    const json = await tdFetch<TwelveDataQuoteResponse>("/quote", { symbol: def.apiSymbol })
    const row = extractQuoteRow(json, def.apiSymbol)
    if (!row) return null
    return normalizeQuoteRow(row, def)
  } catch {
    return null
  }
}

/** Fetch OHLCV time series from Twelve Data. */
export async function getTimeSeries(
  symbol: string,
  interval = "1day",
  outputsize = 100,
): Promise<NormalizedTimeSeriesPoint[]> {
  try {
    const def =
      OVERVIEW_SYMBOLS.find((s) => s.apiSymbol === symbol || s.displaySymbol === symbol) ??
      pairDef(symbol)
    const json = await tdFetch<TwelveDataTimeSeriesResponse>("/time_series", {
      symbol: def.apiSymbol,
      interval,
      outputsize,
      order: "asc",
    })
    return normalizeTimeSeries(json)
  } catch {
    return []
  }
}

/** Fetch multiple quotes in one batch request. */
export async function getQuotes(symbols: string[]): Promise<MarketQuote[]> {
  try {
    if (symbols.length === 0) return []
    const defs = defsFromSymbols(symbols, OVERVIEW_SYMBOLS)
    const unknown = symbols.filter((s) => !defs.some((d) => d.apiSymbol === s))
    const extraDefs = unknown.map((symbol) =>
      symbol.includes("/") ? pairDef(symbol) : stockDef(symbol),
    )
    const allDefs = [...defs, ...extraDefs]
    if (allDefs.length === 0) return []

    const joined = allDefs.map((d) => d.apiSymbol).join(",")
    const json = await tdFetch<TwelveDataQuoteResponse>("/quote", { symbol: joined })

    const quotes: MarketQuote[] = []
    for (const def of allDefs) {
      const row = extractQuoteRow(json, def.apiSymbol)
      if (!row) continue
      const quote = normalizeQuoteRow(row, def)
      if (quote) quotes.push(quote)
    }
    return quotes
  } catch {
    return []
  }
}

/** FX pairs for currency strength calculation. */
export async function getForexPairsForCurrencyStrength(): Promise<FxPairQuote[]> {
  try {
    const quotes = await getQuotes([...CURRENCY_STRENGTH_PAIRS])
    return quotes.map((quote) => ({
      symbol: quote.symbol.replace("/", ""),
      price: quote.price,
      changePercent: quote.changePercent,
      updatedAt: quote.updatedAt,
    }))
  } catch {
    return []
  }
}

/** BTC/USD and ETH/USD quotes. */
export async function getCryptoQuotes(): Promise<MarketQuote[]> {
  try {
    return await getQuotes(getCryptoSymbolDefs().map((d) => d.apiSymbol))
  } catch {
    return []
  }
}

/** Index quotes (S&P 500, NASDAQ, VN-INDEX, VN30). */
export async function getIndexQuotes(): Promise<MarketQuote[]> {
  try {
    return await getQuotes(getIndexSymbolDefs().map((d) => d.apiSymbol))
  } catch {
    return []
  }
}

/** Quote + time series for symbol detail routes. */
export async function getMarketDetail(symbol: string): Promise<MarketDetailPayload> {
  const [quote, timeSeries] = await Promise.all([
    getQuote(symbol),
    getTimeSeries(symbol),
  ])
  return { quote, timeSeries }
}

/** Overview bundle: all configured dashboard symbols. */
export async function getOverviewQuotes(): Promise<MarketQuote[]> {
  return getQuotes(OVERVIEW_SYMBOLS.map((s) => s.apiSymbol))
}

const STOCK_QUOTE_BATCH_SIZE = 50

/** Batch equity quotes (e.g. US heatmap universe). */
export async function getStockQuotes(symbols: string[]): Promise<MarketQuote[]> {
  if (symbols.length === 0) return []

  const quotes: MarketQuote[] = []
  for (let i = 0; i < symbols.length; i += STOCK_QUOTE_BATCH_SIZE) {
    const chunk = symbols.slice(i, i + STOCK_QUOTE_BATCH_SIZE)
    const batch = await getQuotes(chunk)
    quotes.push(...batch)
  }
  return quotes
}
