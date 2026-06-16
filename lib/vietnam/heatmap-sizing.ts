import type { MarketAsset } from "@/types/market"

export type VnHeatmapSizingMode = "tradingValue" | "volume" | "marketCap"

export const DEFAULT_VN_HEATMAP_SIZING: VnHeatmapSizingMode = "tradingValue"

/** Trading value in VND (price × volume). */
export function tradingValue(price: number, volume: number): number {
  return price * volume
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
