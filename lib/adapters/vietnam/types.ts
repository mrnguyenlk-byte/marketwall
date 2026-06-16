import "server-only"

import type { Bi } from "@/lib/market-utils"
import type { VnExchangeId } from "@/lib/providers/heatmap-provider"

/** Adapter identifiers for Vietnam market data sources. */
export type VietnamAdapterId = "vps" | "kbs" | "fireant" | "vietstock" | "tcbs"

export type VietnamAdapterCapability =
  | "indices"
  | "stocks"
  | "heatmap"
  | "intraday"
  | "eod"
  | "derivatives"
  | "foreign_flow"

export type VietnamAdapterMeta = {
  id: VietnamAdapterId
  name: string
  capabilities: VietnamAdapterCapability[]
  /** Documented base URL — not called until integration phase. */
  baseUrl: string
  requiresAuth: boolean
  notes?: string
}

/** Uppercase exchange labels from upstream APIs. */
export type VietnamExchangeLabel = "HOSE" | "HNX" | "UPCOM"

/** Canonical lowercase exchange id used by heatmap UI. */
export type VietnamExchangeId = VnExchangeId

export type NormalizedVietnamIndex = {
  symbol: string
  name: Bi
  exchange: VietnamExchangeLabel
  price: number
  change: number
  changePercent: number
  volume: number
  value: number
  updatedAt: string
}

/** Provider-agnostic stock quote before heatmap weighting. */
export type NormalizedVietnamStock = {
  symbol: string
  name: Bi
  exchange: VietnamExchangeId
  sector: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  volume: number
  value: number
  updatedAt: string
  foreignBuyVolume?: number
  foreignSellVolume?: number
}

/**
 * Canonical snapshot produced by any Vietnam adapter after normalization.
 * Maps 1:1 into vietnam-market-provider build pipeline (future phase).
 */
export type NormalizedVietnamMarket = {
  provider: VietnamAdapterId
  indices: NormalizedVietnamIndex[]
  stocks: {
    hose: NormalizedVietnamStock[]
    hnx: NormalizedVietnamStock[]
    upcom: NormalizedVietnamStock[]
  }
  fetchedAt: string
}

export type AdapterFetchStatus = "not_connected" | "not_configured" | "ok" | "error"

export type AdapterFetchResult<T> =
  | { status: "not_connected"; provider: VietnamAdapterId }
  | { status: "not_configured"; provider: VietnamAdapterId; reason: string }
  | { status: "ok"; provider: VietnamAdapterId; data: T; fetchedAt: string }
  | { status: "error"; provider: VietnamAdapterId; message: string }

/** Contract each Vietnam adapter must implement. */
export interface VietnamMarketAdapter {
  meta: VietnamAdapterMeta
  isConfigured(): boolean
  fetchMarketSnapshot(): Promise<AdapterFetchResult<NormalizedVietnamMarket>>
}

/** Raw shapes — documented for integration; not validated at runtime yet. */

export type FireantRawIndex = {
  symbol?: string
  name?: string
  price?: number
  change?: number
  changePercent?: number
  volume?: number
  value?: number
  exchange?: string
  updatedAt?: string
}

export type FireantRawStock = {
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
}

export type VietstockRawIndex = {
  IndexCode?: string
  IndexName?: string
  IndexNameEn?: string
  CurrentIndex?: number
  Change?: number
  ChangePercent?: number
  TotalVolume?: number
  TotalValue?: number
  TradingDate?: string
}

export type VietstockRawStock = {
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
}

export type TcbsRawIndex = {
  indexId?: string
  indexName?: string
  indexValue?: number
  change?: number
  changePercent?: number
  volume?: number
  value?: number
  tradingDate?: string
}

export type TcbsRawStock = {
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
}
