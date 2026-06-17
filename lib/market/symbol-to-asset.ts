import { findMockAsset } from "@/lib/mockHeatmapData"
import { buildHeatmapSymbolRecords } from "@/lib/symbol-heatmap-registry"
import { resolveSymbolDetail, type SymbolDetailRecord } from "@/lib/symbol-detail"
import { WATCHLIST_CATALOG, isWatchlistSymbol } from "@/lib/watchlist"
import type { Bi } from "@/lib/market-utils"
import type { MarketAsset, MarketType } from "@/types/market"

export type SymbolQuoteHint = {
  price?: number
  change?: number
  changePercent?: number
  volume?: number
  volumeShares?: number
  volumeLot?: number
  tradingValue?: number
  marketType?: MarketType
  exchange?: string
  sector?: string
  name?: Bi
}

const EMPTY_FINANCIALS: MarketAsset["financials"] = {
  revenue: 0,
  netIncome: 0,
  totalAssets: 0,
  totalLiabilities: 0,
  roe: 0,
  roa: 0,
}

function bi(text: string): Bi {
  return { vi: text, en: text }
}

function inferMarketType(symbol: string, record?: SymbolDetailRecord | null): MarketType {
  if (record?.category === "crypto") return "crypto"
  if (record?.category === "equity") return "vn"
  if (record?.region?.en === "Vietnam") return "vn"
  if (buildHeatmapSymbolRecords().some((row) => row.symbol.toUpperCase() === symbol.toUpperCase())) {
    return "vn"
  }
  if (/^(BTC|ETH|XRP|SOL|BNB|DOGE)/i.test(symbol)) return "crypto"
  return "us"
}

function tradingViewFor(symbol: string, marketType: MarketType): string {
  if (marketType === "crypto") {
    const base = symbol.replace(/\/USD$/i, "").replace(/USD$/i, "")
    return `BINANCE:${base}USDT`
  }
  if (marketType === "vn") return `HOSE:${symbol}`
  return `NASDAQ:${symbol}`
}

function exchangeFor(symbol: string, marketType: MarketType, record?: SymbolDetailRecord | null): string {
  if (record?.exchange) return record.exchange
  if (marketType === "vn") return "HOSE"
  if (marketType === "crypto") return "CRYPTO"
  return "US"
}

function buildMarketAsset(
  symbol: string,
  name: Bi,
  marketType: MarketType,
  price: number,
  changePercent: number,
  hint?: SymbolQuoteHint,
  record?: SymbolDetailRecord | null,
): MarketAsset {
  const change =
    hint?.change ??
    (price > 0 ? (price * changePercent) / 100 : 0)
  const prevClose = price > 0 ? price - change : 0
  const exchange = hint?.exchange ?? exchangeFor(symbol, marketType, record)

  return {
    symbol: symbol.toUpperCase(),
    name,
    exchange,
    marketType,
    price,
    change,
    changePercent,
    marketCap: 0,
    volume: hint?.volume ?? 0,
    volumeShares: hint?.volumeShares,
    volumeLot: hint?.volumeLot,
    tradingValue: hint?.tradingValue,
    sector: hint?.sector ?? record?.sector ?? "Unknown",
    currency: marketType === "vn" ? "VND" : "USD",
    lastUpdated: new Date().toISOString(),
    tradingViewSymbol: tradingViewFor(symbol, marketType),
    open: prevClose,
    high: price,
    low: price,
    close: price,
    prevClose,
    avgVolume: hint?.volume ?? 0,
    profile: name,
    shareholders: [],
    dividends: [],
    financials: EMPTY_FINANCIALS,
    historicalPrices: [],
  }
}

function recordToMarketAsset(record: SymbolDetailRecord, hint?: SymbolQuoteHint): MarketAsset {
  const marketType = hint?.marketType ?? inferMarketType(record.symbol, record)
  const price = hint?.price ?? record.mockPrice
  const changePercent = hint?.changePercent ?? record.mockChangePercent
  return buildMarketAsset(record.symbol, hint?.name ?? record.name, marketType, price, changePercent, hint, record)
}

function watchlistToMarketAsset(symbol: string): MarketAsset | null {
  if (!isWatchlistSymbol(symbol)) return null
  const entry = WATCHLIST_CATALOG[symbol]
  const record = resolveSymbolDetail(symbol)
  const marketType =
    symbol === "BTCUSD" ? "crypto" : symbol === "VNINDEX" || symbol === "VN30" ? "vn" : "us"
  return buildMarketAsset(
    record?.symbol ?? symbol,
    entry.name,
    marketType,
    entry.mockPrice,
    entry.mockChangePercent,
    { marketType },
    record,
  )
}

/** Resolve a display symbol (+ optional live quote) into a MarketAsset for StockDetailModal. */
export function resolveSymbolToMarketAsset(
  input: string,
  hint?: SymbolQuoteHint,
): MarketAsset | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const mock = findMockAsset(trimmed)
  if (mock) {
    if (hint?.price == null && hint?.changePercent == null) return mock
    return {
      ...mock,
      price: hint.price ?? mock.price,
      changePercent: hint.changePercent ?? mock.changePercent,
      change: hint.change ?? mock.change,
      volume: hint.volume ?? mock.volume,
      volumeShares: hint.volumeShares ?? mock.volumeShares,
      volumeLot: hint.volumeLot ?? mock.volumeLot,
      tradingValue: hint.tradingValue ?? mock.tradingValue,
    }
  }

  const record = resolveSymbolDetail(trimmed)
  if (record) return recordToMarketAsset(record, hint)

  const registry = buildHeatmapSymbolRecords().find(
    (row) => row.symbol.toUpperCase() === trimmed.toUpperCase(),
  )
  if (registry) return recordToMarketAsset(registry, hint)

  const watchlist = watchlistToMarketAsset(trimmed.toUpperCase())
  if (watchlist) {
    if (hint?.price == null && hint?.changePercent == null) return watchlist
    return {
      ...watchlist,
      price: hint.price ?? watchlist.price,
      changePercent: hint.changePercent ?? watchlist.changePercent,
      change: hint.change ?? watchlist.change,
    }
  }

  if (hint?.price != null && hint.price > 0) {
    const marketType = hint.marketType ?? inferMarketType(trimmed)
    return buildMarketAsset(
      trimmed,
      hint.name ?? bi(trimmed),
      marketType,
      hint.price,
      hint.changePercent ?? 0,
      hint,
    )
  }

  return null
}
