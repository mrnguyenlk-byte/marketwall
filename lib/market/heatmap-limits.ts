import {
  CRYPTO_HEATMAP_LIMIT,
  US_HEATMAP_LIMIT,
  VN_HEATMAP_LIMIT,
} from "@/config/heatmap-symbols"
import {
  sortBySizeMetric,
  tradingValue,
  type VnHeatmapSizingMode,
} from "@/lib/vietnam/heatmap-sizing"
import type { HeatmapAsset, MarketAsset, MarketType } from "@/types/market"

export const HEATMAP_DISPLAY_LIMIT: Record<MarketType, number> = {
  vn: VN_HEATMAP_LIMIT,
  us: US_HEATMAP_LIMIT,
  crypto: CRYPTO_HEATMAP_LIMIT,
}

export function dollarVolume(price: number, volume: number): number {
  return price * volume
}

export function sortHeatmapRows(
  items: HeatmapAsset[],
  market: MarketType,
): HeatmapAsset[] {
  if (market === "vn") {
    return [...items].sort(
      (a, b) => tradingValue(b.price, b.volume) - tradingValue(a.price, a.volume),
    )
  }
  if (market === "us") {
    return [...items].sort((a, b) => {
      const byDollar = dollarVolume(b.price, b.volume) - dollarVolume(a.price, a.volume)
      if (byDollar !== 0) return byDollar
      return b.marketCap - a.marketCap
    })
  }
  return [...items].sort((a, b) => b.volume - a.volume)
}

export function limitHeatmapRows(
  items: HeatmapAsset[],
  market: MarketType,
): HeatmapAsset[] {
  return sortHeatmapRows(items, market).slice(0, HEATMAP_DISPLAY_LIMIT[market])
}

export function sortHeatmapAssets(
  assets: MarketAsset[],
  marketType: MarketType,
  vnSizing: VnHeatmapSizingMode = "tradingValue",
): MarketAsset[] {
  if (marketType === "vn") return sortBySizeMetric(assets, vnSizing)
  if (marketType === "us") {
    return [...assets].sort((a, b) => {
      const byDollar = dollarVolume(b.price, b.volume) - dollarVolume(a.price, a.volume)
      if (byDollar !== 0) return byDollar
      return b.marketCap - a.marketCap
    })
  }
  return [...assets].sort((a, b) => b.volume - a.volume)
}

export function limitHeatmapAssets(
  assets: MarketAsset[],
  marketType: MarketType,
  vnSizing: VnHeatmapSizingMode = "tradingValue",
): MarketAsset[] {
  return sortHeatmapAssets(assets, marketType, vnSizing).slice(
    0,
    HEATMAP_DISPLAY_LIMIT[marketType],
  )
}
