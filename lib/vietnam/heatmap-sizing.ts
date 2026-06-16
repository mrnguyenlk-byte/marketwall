import type { MarketAsset } from "@/types/market"

import { vpsTradingValue } from "./volume-units"

export type VnHeatmapSizingMode = "tradingValue" | "volume" | "marketCap"

export const DEFAULT_VN_HEATMAP_SIZING: VnHeatmapSizingMode = "tradingValue"

/** Trading value in VND (price × VPS lot × 10 shares). */
export function tradingValue(price: number, volume: number): number {
  return vpsTradingValue(price, volume)
}

export function sizeMetric(asset: MarketAsset, mode: VnHeatmapSizingMode): number {
  switch (mode) {
    case "tradingValue":
      return tradingValue(asset.price, asset.volume)
    case "volume":
      return asset.volume
    case "marketCap":
      return asset.marketCap
  }
}

export function sortBySizeMetric(
  assets: MarketAsset[],
  mode: VnHeatmapSizingMode,
): MarketAsset[] {
  return [...assets].sort((a, b) => sizeMetric(b, mode) - sizeMetric(a, mode))
}
