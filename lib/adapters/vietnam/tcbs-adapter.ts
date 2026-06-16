import "server-only"

import type {
  AdapterFetchResult,
  NormalizedVietnamMarket,
  TcbsRawIndex,
  TcbsRawStock,
  VietnamMarketAdapter,
} from "./types"
import {
  groupStocksByExchange,
  normalizeTcbsIndex,
  normalizeTcbsStock,
} from "./normalize"

const TCBS_BASE = "https://apipubaws.tcbs.com.vn"

const INDEX_TICKERS = ["VNINDEX", "VN30", "HNX", "UPCOM"] as const

const STOCK_TICKERS = [
  "VCB", "VIC", "VHM", "BID", "CTG", "HPG", "GAS", "FPT", "MWG", "ACB",
  "TCB", "MBB", "VNM", "SSI", "HDB", "VPB", "SHB", "PVS", "VGT",
] as const

type TcbsOverviewResponse = {
  ticker?: string
  indexId?: string
  indexName?: string
  indexValue?: number
  matchPrice?: number
  priceChange?: number
  priceChangePercent?: number
  change?: number
  changePercent?: number
  volume?: number
  totalVolume?: number
  value?: number
  grossTradeAmount?: number
  marketCap?: number
  exchange?: string
  industry?: string
  companyName?: string
  tradingDate?: string
}

/**
 * TCBS adapter — public apipubaws endpoints (no API key).
 * Falls back gracefully when upstream returns 404 or empty payloads.
 */
export const TCBS_ADAPTER_META = {
  id: "tcbs" as const,
  name: "TCBS",
  capabilities: ["indices", "stocks", "eod"] as const,
  baseUrl: TCBS_BASE,
  requiresAuth: false,
  notes: "Public quote endpoints — safe fallback when unavailable.",
}

export function isTcbsConfigured(): boolean {
  return process.env.TCBS_ADAPTER_ENABLED !== "false"
}

export function mapTcbsSnapshot(
  rawIndices: TcbsRawIndex[],
  rawStocks: TcbsRawStock[],
): NormalizedVietnamMarket {
  const indices = rawIndices
    .map(normalizeTcbsIndex)
    .filter((row): row is NonNullable<typeof row> => row != null)

  const stocks = rawStocks
    .map(normalizeTcbsStock)
    .filter((row): row is NonNullable<typeof row> => row != null)

  return {
    provider: "tcbs",
    indices,
    stocks: groupStocksByExchange(stocks),
    fetchedAt: new Date().toISOString(),
  }
}

async function fetchTcbsOverview(ticker: string): Promise<TcbsOverviewResponse | null> {
  const url = `${TCBS_BASE}/quote/v1/ticker/${encodeURIComponent(ticker)}/overview`
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" })
    if (!res.ok) {
      const body = await res.text()
      console.warn(
        `[provider:vietnam:tcbs] ticker=${ticker} http=${res.status} body=${body.slice(0, 120)}`,
      )
      return null
    }
    return (await res.json()) as TcbsOverviewResponse
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed"
    console.warn(`[provider:vietnam:tcbs] ticker=${ticker} error=${message}`)
    return null
  }
}

function overviewToIndex(ticker: string, row: TcbsOverviewResponse): TcbsRawIndex | null {
  const price = row.indexValue ?? row.matchPrice
  if (price == null) return null

  return {
    indexId: row.indexId ?? row.ticker ?? ticker,
    indexName: row.indexName ?? row.companyName ?? ticker,
    indexValue: price,
    change: row.priceChange ?? row.change,
    changePercent: row.priceChangePercent ?? row.changePercent,
    volume: row.totalVolume ?? row.volume,
    value: row.grossTradeAmount ?? row.value,
    tradingDate: row.tradingDate,
  }
}

function overviewToStock(ticker: string, row: TcbsOverviewResponse): TcbsRawStock | null {
  if (row.matchPrice == null) return null

  return {
    ticker: row.ticker ?? ticker,
    name: row.companyName ?? ticker,
    exchange: row.exchange,
    industry: row.industry,
    matchPrice: row.matchPrice,
    priceChange: row.priceChange,
    priceChangePercent: row.priceChangePercent,
    marketCap: row.marketCap,
    totalVolume: row.totalVolume ?? row.volume,
    grossTradeAmount: row.grossTradeAmount ?? row.value,
    tradingDate: row.tradingDate,
  }
}

async function fetchTcbsIndices(): Promise<TcbsRawIndex[]> {
  const results = await Promise.all(
    INDEX_TICKERS.map(async (ticker) => {
      const row = await fetchTcbsOverview(ticker)
      if (!row) return null
      return overviewToIndex(ticker, row)
    }),
  )
  return results.filter((row): row is TcbsRawIndex => row != null)
}

async function fetchTcbsStocks(): Promise<TcbsRawStock[]> {
  const results = await Promise.all(
    STOCK_TICKERS.map(async (ticker) => {
      const row = await fetchTcbsOverview(ticker)
      if (!row) return null
      return overviewToStock(ticker, row)
    }),
  )
  return results.filter((row): row is TcbsRawStock => row != null)
}

export const tcbsAdapter: VietnamMarketAdapter = {
  meta: {
    ...TCBS_ADAPTER_META,
    capabilities: [...TCBS_ADAPTER_META.capabilities],
  },

  isConfigured() {
    return isTcbsConfigured()
  },

  async fetchMarketSnapshot(): Promise<AdapterFetchResult<NormalizedVietnamMarket>> {
    if (!isTcbsConfigured()) {
      return {
        status: "not_configured",
        provider: "tcbs",
        reason: "TCBS_ADAPTER_ENABLED is false",
      }
    }

    try {
      const [rawIndices, rawStocks] = await Promise.all([
        fetchTcbsIndices(),
        fetchTcbsStocks(),
      ])

      if (!rawIndices.length && !rawStocks.length) {
        return { status: "error", provider: "tcbs", message: "TCBS returned no market data" }
      }

      const data = mapTcbsSnapshot(rawIndices, rawStocks)
      return {
        status: "ok",
        provider: "tcbs",
        data,
        fetchedAt: data.fetchedAt,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "TCBS fetch failed"
      return { status: "error", provider: "tcbs", message }
    }
  },
}
