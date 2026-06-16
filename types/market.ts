import type { Bi } from "@/lib/market-utils"

export type MarketType = "vn" | "us" | "crypto"

export type ShareholderRow = {
  name: string
  percent: number
}

export type DividendRow = {
  date: string
  amount: number
}

export type HistoricalPriceRow = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** Normalized quote from GET /api/market/quotes. */
export type MarketQuote = {
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

/** Currency strength row from GET /api/currency-strength. */
export type CurrencyStrengthQuote = {
  currency: string
  strength: number
  change: number
  label: string
}

/** Alias for currency strength API rows. */
export type CurrencyStrength = CurrencyStrengthQuote

/** Heatmap tile quote from GET /api/heatmaps/[market]. */
export type HeatmapAsset = {
  symbol: string
  name: string
  price: number
  changePercent: number
  volume: number
  sector: string
  /** Finer grouping when available (US industry; VN optional). */
  industry?: string
  marketCap: number
  /** VN: VPS lot count (same as volume). */
  volumeLot?: number
  /** VN: shares = lot × 10. */
  volumeShares?: number
  /** VN: GTGD in VND. */
  tradingValue?: number
  volumeUnit?: "lot10"
  /** Foreign buy volume in shares (VPS fBVol × 10). */
  foreignBuy?: number
  /** Foreign sell volume in shares (VPS fSVolume × 10). */
  foreignSell?: number
  foreignNet?: number
  foreignBuyValue?: number
  foreignSellValue?: number
  foreignNetValue?: number
}

export type FinancialSnapshot = {
  revenue: number
  netIncome: number
  totalAssets: number
  totalLiabilities: number
  roe: number
  roa: number
}

/** Unified asset record for heatmap tiles and stock detail modal. */
export type MarketAsset = {
  symbol: string
  name: Bi
  exchange: string
  marketType: MarketType
  price: number
  change: number
  changePercent: number
  marketCap: number
  volume: number
  sector: string
  /** Finer grouping (US industry; VN when available). */
  industry?: string
  currency: string
  /** VN heatmap: GTGD in VND when provided by API overlay. */
  tradingValue?: number
  volumeShares?: number
  volumeLot?: number
  foreignBuy?: number
  foreignSell?: number
  foreignNet?: number
  foreignBuyValue?: number
  foreignSellValue?: number
  foreignNetValue?: number
  lastUpdated: string
  tradingViewSymbol: string
  open: number
  high: number
  low: number
  close: number
  prevClose: number
  avgVolume: number
  sharesOutstanding?: number
  pe?: number
  eps?: number
  dividendYield?: number
  week52High?: number
  week52Low?: number
  profile: Bi
  shareholders: ShareholderRow[]
  dividends: DividendRow[]
  financials: FinancialSnapshot
  historicalPrices: HistoricalPriceRow[]
}
