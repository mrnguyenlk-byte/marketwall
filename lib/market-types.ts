/** Client-safe market types (no provider imports). */

import type { Bi, Trend } from "@/lib/market-utils"

export type TickerBarItem = {
  symbol: string
  price: number
  changePercent: number
  trend: Trend
  sparkline: number[]
}

export type OverviewCategory = "indices" | "commodities" | "crypto" | "forex"

export type OverviewListItem = {
  symbol: string
  flag: string
  price: number
  changePercent: number
  trend: Trend
  sparkline: number[]
}

export type HeatmapTile = {
  symbol: string
  name: Bi
  changePercent: number
  weight: number
  price?: number
}

export type HeatmapMarketId = "vn" | "us" | "crypto"

export type VnExchangeId = "hose" | "hnx" | "upcom" | "derivatives"

export type HeatmapExchange = {
  id: VnExchangeId
  labelKey: string
  tiles: HeatmapTile[]
}

export type HeatmapMarket = {
  id: HeatmapMarketId
  labelKey: string
  flag: string
  tiles?: HeatmapTile[]
  exchanges?: HeatmapExchange[]
}

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

export type MarketNewsItem = {
  title: Bi
  categoryKey: string
  time: Bi
  url?: string
}

export type CryptoAsset = {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  marketCapRank: number
}

export type GlobalQuote = {
  symbol: string
  name: string
  category: "indices" | "commodities" | "forex"
  price: number
  change: number
  changePercent: number
  updatedAt: string
  source: "live" | "mock"
}

export type NormalizedMarketQuote = {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  updatedAt: string
}

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

export type CurrencyStrengthItem = {
  code: string
  name: Bi
  strength: number
  changePercent: number
  trend: Trend
  rankKey: string
  series: number[]
}

export type CurrencyStrengthChartMeta = {
  timezone: string
  timeLabels: string[]
}
