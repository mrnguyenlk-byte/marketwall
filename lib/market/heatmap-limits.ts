import {
  CRYPTO_HEATMAP_LIMIT,
  US_HEATMAP_LIMIT,
  VN_HEATMAP_LIMIT,
} from "@/config/heatmap-symbols"
import { compareHeatmapMetricDesc } from "@/lib/market/heatmap-sort"
import {
  sortBySizeMetric,
  tradingValue,
  type VnHeatmapSizingMode,
} from "@/lib/vietnam/heatmap-sizing"
import {
  isVnHeatmapMode,
  sortByVnHeatmapMode,
  type VnHeatmapMode,
} from "@/lib/vietnam/vn-heatmap-modes"
import type { HeatmapAsset, MarketAsset, MarketType } from "@/types/market"

export type VnHeatmapLimitKey = VnHeatmapMode | VnHeatmapSizingMode

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
    return [...items].sort((a, b) =>
      compareHeatmapMetricDesc(
        tradingValue(a.price, a.volume),
        tradingValue(b.price, b.volume),
        a,
        b,
      ),
    )
  }
  if (market === "us") {
    return [...items].sort((a, b) =>
      compareHeatmapMetricDesc(a.marketCap, b.marketCap, a, b),
    )
  }
  return [...items].sort((a, b) =>
    compareHeatmapMetricDesc(a.volume, b.volume, a, b),
  )
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
  sizing: VnHeatmapLimitKey | "marketCap" | "dollarVolume" | "volume" = "tradingValue",
): MarketAsset[] {
  if (marketType === "vn") {
    if (isVnHeatmapMode(sizing)) return sortByVnHeatmapMode(assets, sizing)
    return sortBySizeMetric(assets, sizing as VnHeatmapSizingMode)
  }
  if (marketType === "us") {
    if (sizing === "dollarVolume") {
      return [...assets].sort((a, b) =>
        compareHeatmapMetricDesc(
          dollarVolume(a.price, a.volume),
          dollarVolume(b.price, b.volume),
          a,
          b,
        ),
      )
    }
    return [...assets].sort((a, b) =>
      compareHeatmapMetricDesc(a.marketCap, b.marketCap, a, b),
    )
  }
  if (sizing === "marketCap") {
    return [...assets].sort((a, b) =>
      compareHeatmapMetricDesc(a.marketCap, b.marketCap, a, b),
    )
  }
  return [...assets].sort((a, b) =>
    compareHeatmapMetricDesc(a.volume, b.volume, a, b),
  )
}

export function limitHeatmapAssets(
  assets: MarketAsset[],
  marketType: MarketType,
  sizing: VnHeatmapLimitKey | "marketCap" | "dollarVolume" | "volume" = "tradingValue",
): MarketAsset[] {
  return sortHeatmapAssets(assets, marketType, sizing).slice(
    0,
    HEATMAP_DISPLAY_LIMIT[marketType],
  )
}
