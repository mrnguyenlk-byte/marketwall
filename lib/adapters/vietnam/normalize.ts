import "server-only"

import type { Bi } from "@/lib/market-utils"
import type {
  VietnamHeatmapStock,
  VietnamMarketData,
  VietnamMarketIndex,
} from "@/lib/providers/vietnam-market-provider"

import type {
  NormalizedVietnamIndex,
  NormalizedVietnamMarket,
  NormalizedVietnamStock,
  VietnamExchangeId,
  VietnamExchangeLabel,
} from "./types"

/** Dashboard index symbols used in ticker / overview mock data. */
export const DASHBOARD_INDEX_ALIASES: Record<string, string> = {
  VNINDEX: "VN-INDEX",
  HNX: "HNX-INDEX",
  UPCOM: "UPCOM-INDEX",
}

/** Reverse map for incoming provider symbols. */
export const PROVIDER_INDEX_ALIASES: Record<string, string> = {
  "VN-INDEX": "VNINDEX",
  "VN-Index": "VNINDEX",
  "HNX-INDEX": "HNX",
  "HNX-Index": "HNX",
  "UPCOM-INDEX": "UPCOM",
  "UPCoM-Index": "UPCOM",
}

const EXCHANGE_TO_ID: Record<VietnamExchangeLabel, VietnamExchangeId> = {
  HOSE: "hose",
  HNX: "hnx",
  UPCOM: "upcom",
}

const EXCHANGE_LABELS = new Set<string>(["HOSE", "HNX", "UPCOM"])

export function normalizeIndexSymbol(raw: string): string {
  const trimmed = raw.trim()
  return PROVIDER_INDEX_ALIASES[trimmed] ?? trimmed.toUpperCase()
}

export function toDashboardIndexSymbol(providerSymbol: string): string {
  const canonical = normalizeIndexSymbol(providerSymbol)
  return DASHBOARD_INDEX_ALIASES[canonical] ?? canonical
}

export function normalizeExchangeLabel(raw: string | undefined): VietnamExchangeLabel | null {
  if (!raw) return null
  const upper = raw.trim().toUpperCase()
  if (upper === "HSX") return "HOSE"
  if (!EXCHANGE_LABELS.has(upper)) return null
  return upper as VietnamExchangeLabel
}

export function exchangeLabelToId(label: VietnamExchangeLabel): VietnamExchangeId {
  return EXCHANGE_TO_ID[label]
}

export function normalizeStockSymbol(raw: string): string {
  return raw.trim().toUpperCase().replace(/\.(HO|HN|UP)$/i, "")
}

function biLabel(vi: string, en?: string): Bi {
  return { vi, en: en ?? vi }
}

function pctChange(price: number, changePercent: number): number {
  return Number((price * (changePercent / 100)).toFixed(2))
}

function stockValue(price: number, volume: number): number {
  return Math.round(price * volume)
}

export function normalizeFireantIndex(raw: {
  symbol?: string
  name?: string
  price?: number
  change?: number
  changePercent?: number
  volume?: number
  value?: number
  exchange?: string
  updatedAt?: string
}): NormalizedVietnamIndex | null {
  if (!raw.symbol || raw.price == null) return null

  const exchange = normalizeExchangeLabel(raw.exchange) ?? "HOSE"
  const changePercent = Number((raw.changePercent ?? 0).toFixed(2))
  const price = raw.price
  const change = raw.change ?? pctChange(price, changePercent)

  return {
    symbol: normalizeIndexSymbol(raw.symbol),
    name: biLabel(raw.name ?? raw.symbol),
    exchange,
    price,
    change,
    changePercent,
    volume: raw.volume ?? 0,
    value: raw.value ?? stockValue(price, raw.volume ?? 0),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function normalizeFireantStock(raw: {
  symbol?: string
  name?: string
  companyName?: string
  companyNameEn?: string
  price?: number
  change?: number
  changePercent?: number
  marketCap?: number
  volume?: number
  value?: number
  exchange?: string
  sector?: string
  updatedAt?: string
}): NormalizedVietnamStock | null {
  if (!raw.symbol || raw.price == null) return null

  const label = normalizeExchangeLabel(raw.exchange)
  if (!label) return null

  const exchange = exchangeLabelToId(label)
  const changePercent = Number((raw.changePercent ?? 0).toFixed(2))
  const price = raw.price
  const volume = raw.volume ?? 0

  return {
    symbol: normalizeStockSymbol(raw.symbol),
    name: biLabel(raw.companyName ?? raw.name ?? raw.symbol, raw.companyNameEn),
    exchange,
    sector: raw.sector ?? "—",
    price,
    change: raw.change ?? pctChange(price, changePercent),
    changePercent,
    marketCap: raw.marketCap ?? 0,
    volume,
    value: raw.value ?? stockValue(price, volume),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function normalizeVietstockIndex(raw: {
  IndexCode?: string
  IndexName?: string
  IndexNameEn?: string
  CurrentIndex?: number
  Change?: number
  ChangePercent?: number
  TotalVolume?: number
  TotalValue?: number
  TradingDate?: string
}): NormalizedVietnamIndex | null {
  if (!raw.IndexCode || raw.CurrentIndex == null) return null

  const symbol = normalizeIndexSymbol(raw.IndexCode)
  const exchange: VietnamExchangeLabel =
    symbol === "HNX" ? "HNX" : symbol === "UPCOM" ? "UPCOM" : "HOSE"

  const changePercent = Number((raw.ChangePercent ?? 0).toFixed(2))
  const price = raw.CurrentIndex

  return {
    symbol,
    name: biLabel(raw.IndexName ?? symbol, raw.IndexNameEn),
    exchange,
    price,
    change: raw.Change ?? pctChange(price, changePercent),
    changePercent,
    volume: raw.TotalVolume ?? 0,
    value: raw.TotalValue ?? 0,
    updatedAt: raw.TradingDate ?? new Date().toISOString(),
  }
}

export function normalizeVietstockStock(raw: {
  StockCode?: string
  StockName?: string
  StockNameEn?: string
  Exchange?: string
  Sector?: string
  Price?: number
  Change?: number
  ChangePercent?: number
  MarketCap?: number
  TotalVol?: number
  TotalVal?: number
  TradingDate?: string
}): NormalizedVietnamStock | null {
  if (!raw.StockCode || raw.Price == null) return null

  const label = normalizeExchangeLabel(raw.Exchange)
  if (!label) return null

  const exchange = exchangeLabelToId(label)
  const changePercent = Number((raw.ChangePercent ?? 0).toFixed(2))
  const price = raw.Price
  const volume = raw.TotalVol ?? 0

  return {
    symbol: normalizeStockSymbol(raw.StockCode),
    name: biLabel(raw.StockName ?? raw.StockCode, raw.StockNameEn),
    exchange,
    sector: raw.Sector ?? "—",
    price,
    change: raw.Change ?? pctChange(price, changePercent),
    changePercent,
    marketCap: raw.MarketCap ?? 0,
    volume,
    value: raw.TotalVal ?? stockValue(price, volume),
    updatedAt: raw.TradingDate ?? new Date().toISOString(),
  }
}

export function normalizeKbsIndex(
  symbol: string,
  snap: { price: number; change: number; changePercent: number; volume: number },
): NormalizedVietnamIndex {
  const canonical = normalizeIndexSymbol(symbol)
  const exchange: VietnamExchangeLabel =
    canonical === "HNX" ? "HNX" : canonical === "UPCOM" ? "UPCOM" : "HOSE"

  const indexNames: Record<string, Bi> = {
    VNINDEX: { vi: "VN-Index", en: "VN-Index" },
    VN30: { vi: "VN30", en: "VN30" },
    HNX: { vi: "HNX-Index", en: "HNX-Index" },
    UPCOM: { vi: "UPCoM-Index", en: "UPCoM-Index" },
  }

  return {
    symbol: canonical,
    name: indexNames[canonical] ?? biLabel(canonical),
    exchange,
    price: snap.price,
    change: snap.change,
    changePercent: snap.changePercent,
    volume: snap.volume,
    value: 0,
    updatedAt: new Date().toISOString(),
  }
}

export function normalizeTcbsIndex(raw: {
  indexId?: string
  indexName?: string
  indexValue?: number
  change?: number
  changePercent?: number
  volume?: number
  value?: number
  tradingDate?: string
}): NormalizedVietnamIndex | null {
  if (!raw.indexId || raw.indexValue == null) return null

  const symbol = normalizeIndexSymbol(raw.indexId)
  const exchange: VietnamExchangeLabel =
    symbol === "HNX" ? "HNX" : symbol === "UPCOM" ? "UPCOM" : "HOSE"

  const changePercent = Number((raw.changePercent ?? 0).toFixed(2))
  const price = raw.indexValue

  return {
    symbol,
    name: biLabel(raw.indexName ?? symbol),
    exchange,
    price,
    change: raw.change ?? pctChange(price, changePercent),
    changePercent,
    volume: raw.volume ?? 0,
    value: raw.value ?? 0,
    updatedAt: raw.tradingDate ?? new Date().toISOString(),
  }
}

export function normalizeTcbsStock(raw: {
  ticker?: string
  symbol?: string
  name?: string
  exchange?: string
  industry?: string
  matchPrice?: number
  priceChange?: number
  priceChangePercent?: number
  marketCap?: number
  totalVolume?: number
  grossTradeAmount?: number
  tradingDate?: string
}): NormalizedVietnamStock | null {
  const symbolRaw = raw.ticker ?? raw.symbol
  if (!symbolRaw || raw.matchPrice == null) return null

  const label = normalizeExchangeLabel(raw.exchange)
  if (!label) return null

  const exchange = exchangeLabelToId(label)
  const changePercent = Number((raw.priceChangePercent ?? 0).toFixed(2))
  const price = raw.matchPrice
  const volume = raw.totalVolume ?? 0

  return {
    symbol: normalizeStockSymbol(symbolRaw),
    name: biLabel(raw.name ?? symbolRaw),
    exchange,
    sector: raw.industry ?? "—",
    price,
    change: raw.priceChange ?? pctChange(price, changePercent),
    changePercent,
    marketCap: raw.marketCap ?? 0,
    volume,
    value: raw.grossTradeAmount ?? stockValue(price, volume),
    updatedAt: raw.tradingDate ?? new Date().toISOString(),
  }
}

function weightFromMarketCap(marketCap: number, maxCap: number): number {
  const ratio = marketCap / maxCap
  if (ratio >= 0.92) return 12
  if (ratio >= 0.82) return 11
  if (ratio >= 0.72) return 10
  if (ratio >= 0.62) return 9
  if (ratio >= 0.52) return 8
  if (ratio >= 0.42) return 7
  if (ratio >= 0.32) return 6
  if (ratio >= 0.22) return 5
  if (ratio >= 0.14) return 4
  return 3
}

function assignWeights(stocks: VietnamHeatmapStock[]): VietnamHeatmapStock[] {
  const maxCap = Math.max(...stocks.map((s) => s.marketCap), 1)
  return stocks.map((stock) => ({
    ...stock,
    weight: weightFromMarketCap(stock.marketCap, maxCap),
  }))
}

function stockToHeatmapStock(stock: NormalizedVietnamStock): VietnamHeatmapStock {
  return {
    symbol: stock.symbol,
    name: stock.name,
    exchange: stock.exchange,
    sector: stock.sector,
    price: stock.price,
    change: stock.change,
    changePercent: stock.changePercent,
    marketCap: stock.marketCap,
    volume: stock.volume,
    value: stock.value,
    weight: 0,
    foreignBuy: stock.foreignBuyVolume,
    foreignSell: stock.foreignSellVolume,
  }
}

function indexToProviderIndex(
  index: NormalizedVietnamIndex,
  source: "live" | "mock",
): VietnamMarketIndex {
  return {
    symbol: index.symbol,
    name: index.name,
    exchange: index.exchange,
    price: index.price,
    change: index.change,
    changePercent: index.changePercent,
    volume: index.volume,
    value: index.value,
    updatedAt: index.updatedAt,
    source,
  }
}

/**
 * Convert normalized adapter output into VietnamMarketData-compatible stocks.
 * Heatmap market assembly remains in vietnam-market-provider (future wiring).
 */
export function normalizedStocksToHeatmapBuckets(
  stocks: NormalizedVietnamMarket["stocks"],
): VietnamMarketData["heatmapStocks"] {
  const withWeights = {
    hose: assignWeights(stocks.hose.map(stockToHeatmapStock)),
    hnx: assignWeights(stocks.hnx.map(stockToHeatmapStock)),
    upcom: assignWeights(stocks.upcom.map(stockToHeatmapStock)),
  }
  return withWeights
}

export function normalizedToProviderIndices(
  indices: NormalizedVietnamIndex[],
  source: "live" | "mock" = "live",
): VietnamMarketIndex[] {
  return indices.map((index) => indexToProviderIndex(index, source))
}

export function groupStocksByExchange(
  stocks: NormalizedVietnamStock[],
): NormalizedVietnamMarket["stocks"] {
  return {
    hose: stocks.filter((s) => s.exchange === "hose"),
    hnx: stocks.filter((s) => s.exchange === "hnx"),
    upcom: stocks.filter((s) => s.exchange === "upcom"),
  }
}
