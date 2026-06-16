import "server-only"

import { type Bi, toTrend, spark } from "@/lib/market-utils"
import {
  HOSE_SEEDS,
  HNX_SEEDS,
  UPCOM_SEEDS,
  type VietnamHeatmapStockSeed,
} from "@/lib/vietnam-heatmap-seeds"
import {
  fetchVietnamMarketFromAdapters,
  normalizedStocksToHeatmapBuckets,
  normalizedToProviderIndices,
} from "@/lib/adapters/vietnam"
import { CACHE_KEYS, CACHE_TTL } from "@/lib/providers/cache"
import { withFallback } from "@/lib/providers/fallback"
import type {
  HeatmapExchange,
  HeatmapMarket,
  HeatmapTile,
  VnExchangeId,
} from "@/lib/providers/heatmap-provider"
import { getMockData as getHeatmapMock } from "@/lib/providers/heatmap-provider"

export type VietnamMarketIndex = {
  symbol: string
  name: Bi
  exchange: string
  price: number
  change: number
  changePercent: number
  volume: number
  value: number
  updatedAt: string
  source: "mock" | "live"
}

export type VietnamHeatmapStock = {
  symbol: string
  name: Bi
  exchange: VnExchangeId
  sector: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  volume: number
  value: number
  weight: number
}

export type VietnamMarketData = {
  indices: VietnamMarketIndex[]
  heatmapStocks: {
    hose: VietnamHeatmapStock[]
    hnx: VietnamHeatmapStock[]
    upcom: VietnamHeatmapStock[]
  }
  heatmapMarket: HeatmapMarket
  source: "mock" | "live"
}

/** @deprecated Use VietnamMarketIndex */
export type VietnamIndex = {
  symbol: string
  price: number
  changePercent: number
  trend: ReturnType<typeof toTrend>
}

type StockSeed = VietnamHeatmapStockSeed

const MOCK_UPDATED_AT = "2026-06-15T09:00:00+07:00"

function pctChange(price: number, changePercent: number): number {
  return Number((price * (changePercent / 100)).toFixed(2))
}

function stockValue(price: number, volume: number): number {
  return Math.round(price * volume)
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

function buildStock(seed: StockSeed, exchange: VnExchangeId): VietnamHeatmapStock {
  const change = pctChange(seed.price, seed.changePercent)
  return {
    symbol: seed.symbol,
    name: seed.name,
    exchange,
    sector: seed.sector,
    price: seed.price,
    change,
    changePercent: seed.changePercent,
    marketCap: seed.marketCap,
    volume: seed.volume,
    value: stockValue(seed.price, seed.volume),
    weight: 0,
  }
}

function assignWeights(stocks: VietnamHeatmapStock[]): VietnamHeatmapStock[] {
  const maxCap = Math.max(...stocks.map((s) => s.marketCap), 1)
  return stocks.map((stock) => ({
    ...stock,
    weight: weightFromMarketCap(stock.marketCap, maxCap),
  }))
}

function stockToTile(stock: VietnamHeatmapStock): HeatmapTile {
  return {
    symbol: stock.symbol,
    name: stock.name,
    changePercent: stock.changePercent,
    weight: stock.weight,
    price: stock.price,
  }
}

function buildExchange(
  id: VnExchangeId,
  labelKey: string,
  stocks: VietnamHeatmapStock[],
): HeatmapExchange {
  return {
    id,
    labelKey,
    tiles: stocks.map(stockToTile),
  }
}

function buildIndices(source: "mock" | "live"): VietnamMarketIndex[] {
  const defs: Omit<VietnamMarketIndex, "updatedAt" | "source">[] = [
    {
      symbol: "VNINDEX",
      name: { vi: "VN-Index", en: "VN-Index" },
      exchange: "HOSE",
      price: 1281.4,
      change: 6.8,
      changePercent: 0.53,
      volume: 485000000,
      value: 18240000,
    },
    {
      symbol: "VN30",
      name: { vi: "VN30", en: "VN30" },
      exchange: "HOSE",
      price: 1302.7,
      change: 7.2,
      changePercent: 0.56,
      volume: 312000000,
      value: 14280000,
    },
    {
      symbol: "VN10",
      name: { vi: "VN10", en: "VN10" },
      exchange: "HOSE",
      price: 1184.2,
      change: 2.4,
      changePercent: 0.2,
      volume: 98000000,
      value: 4680000,
    },
    {
      symbol: "HNX",
      name: { vi: "HNX-Index", en: "HNX-Index" },
      exchange: "HNX",
      price: 248.6,
      change: -1.2,
      changePercent: -0.48,
      volume: 42000000,
      value: 1240000,
    },
    {
      symbol: "UPCOM",
      name: { vi: "UPCoM-Index", en: "UPCoM-Index" },
      exchange: "UPCOM",
      price: 92.8,
      change: 0.6,
      changePercent: 0.65,
      volume: 18000000,
      value: 520000,
    },
  ]

  return defs.map((def) => ({
    ...def,
    updatedAt: MOCK_UPDATED_AT,
    source,
  }))
}

function mergeHeatmapStockBucket(
  seeds: VietnamHeatmapStock[],
  live: VietnamHeatmapStock[],
): VietnamHeatmapStock[] {
  const liveBySymbol = new Map(live.map((stock) => [stock.symbol.toUpperCase(), stock]))
  const merged = seeds.map((seed) => {
    const liveStock = liveBySymbol.get(seed.symbol.toUpperCase())
    if (!liveStock) return seed
    return {
      ...seed,
      price: liveStock.price,
      change: liveStock.change,
      changePercent: liveStock.changePercent,
      volume: liveStock.volume,
      value: liveStock.value,
    }
  })
  return assignWeights(merged)
}

function mergeHeatmapStocks(
  seeds: VietnamMarketData["heatmapStocks"],
  live: VietnamMarketData["heatmapStocks"],
): VietnamMarketData["heatmapStocks"] {
  return {
    hose: mergeHeatmapStockBucket(seeds.hose, live.hose),
    hnx: mergeHeatmapStockBucket(seeds.hnx, live.hnx),
    upcom: mergeHeatmapStockBucket(seeds.upcom, live.upcom),
  }
}

function buildHeatmapStocks(): VietnamMarketData["heatmapStocks"] {
  const hose = assignWeights(HOSE_SEEDS.map((seed) => buildStock(seed, "hose")))
  const hnx = assignWeights(HNX_SEEDS.map((seed) => buildStock(seed, "hnx")))
  const upcom = assignWeights(UPCOM_SEEDS.map((seed) => buildStock(seed, "upcom")))
  return { hose, hnx, upcom }
}

function getDerivativesExchange(): HeatmapExchange {
  const vnHeatmap = getHeatmapMock().markets.find((m) => m.id === "vn")
  const derivatives = vnHeatmap?.exchanges?.find((e) => e.id === "derivatives")
  return derivatives ?? {
    id: "derivatives",
    labelKey: "tab.derivatives",
    tiles: [],
  }
}

function buildHeatmapMarket(stocks: VietnamMarketData["heatmapStocks"]): HeatmapMarket {
  return {
    id: "vn",
    labelKey: "tab.vnMarket",
    flag: "🇻🇳",
    exchanges: [
      buildExchange("hose", "tab.hose", stocks.hose),
      buildExchange("hnx", "tab.hnx", stocks.hnx),
      buildExchange("upcom", "tab.upcom", stocks.upcom),
      getDerivativesExchange(),
    ],
  }
}

export function getMockData(): VietnamMarketData {
  const heatmapStocks = buildHeatmapStocks()
  return {
    indices: buildIndices("mock"),
    heatmapStocks,
    heatmapMarket: buildHeatmapMarket(heatmapStocks),
    source: "mock",
  }
}

/** Try Vietnam adapters (TCBS public API) then fall back to enriched mock data. */
async function fetchLiveVietnamMarketData(): Promise<VietnamMarketData | null> {
  if (process.env.VIETNAM_MARKET_ENABLED === "false") return null

  const result = await fetchVietnamMarketFromAdapters()
  if (result.status !== "ok") return null

  const mock = getMockData()
  const { data } = result

  const indices = normalizedToProviderIndices(
    data.indices.length ? data.indices : mock.indices.map((i) => ({
      symbol: i.symbol,
      name: i.name,
      exchange: i.exchange as "HOSE" | "HNX" | "UPCOM",
      price: i.price,
      change: i.change,
      changePercent: i.changePercent,
      volume: i.volume,
      value: i.value,
      updatedAt: i.updatedAt,
    })),
    "live",
  )

  const hasLiveStocks =
    data.stocks.hose.length + data.stocks.hnx.length + data.stocks.upcom.length > 0

  const heatmapStocks = hasLiveStocks
    ? mergeHeatmapStocks(mock.heatmapStocks, normalizedStocksToHeatmapBuckets(data.stocks))
    : mock.heatmapStocks

  return {
    indices,
    heatmapStocks,
    heatmapMarket: buildHeatmapMarket(heatmapStocks),
    source: "live",
  }
}

export async function getData(): Promise<VietnamMarketData> {
  const resolved = await withFallback(
    fetchLiveVietnamMarketData,
    getMockData,
    {
      provider: "vietnam-markets",
      cacheKey: CACHE_KEYS.vietnamMarkets,
      cacheTtlMs: CACHE_TTL.heatmap,
    },
  )

  return resolved.data
}

export function vietnamSparkline(symbol: string, trend: ReturnType<typeof toTrend>): number[] {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return spark(seed, 14, trend === "up" ? 1 : -1)
}

/** Legacy adapter for build-dashboard-data quote overlays. */
export function toLegacyVietnamIndices(indices: VietnamMarketIndex[]): VietnamIndex[] {
  return indices.map((index) => ({
    symbol: index.symbol,
    price: index.price,
    changePercent: index.changePercent,
    trend: toTrend(index.changePercent),
  }))
}
