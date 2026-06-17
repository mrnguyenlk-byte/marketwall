import { buildFlatSquarifiedTreemap } from "@/lib/treemap/treemap-builders"
import type { TreemapLayoutNode } from "@/lib/treemap/squarify"
import { vpsLotToShares } from "@/lib/vietnam/volume-units"
import type { MarketAsset } from "@/types/market"

export type VnHeatmapMode =
  | "sector-volume"
  | "market-cap"
  | "foreign-flow"
  | "proprietary-flow"

export const DEFAULT_VN_HEATMAP_MODE: VnHeatmapMode = "sector-volume"

export const VN_HEATMAP_MODES: VnHeatmapMode[] = [
  "sector-volume",
  "market-cap",
  "foreign-flow",
  "proprietary-flow",
]

export function isVnHeatmapMode(value: string): value is VnHeatmapMode {
  return (VN_HEATMAP_MODES as string[]).includes(value)
}

export function vnVolumeMetric(asset: MarketAsset): number {
  return asset.volumeShares ?? vpsLotToShares(asset.volume)
}

export function vnMarketCapMetric(asset: MarketAsset): number {
  return Math.max(asset.marketCap, 0)
}

/** Net foreign value in VND; falls back to share-volume × price when value fields are absent. */
export function vnForeignFlowMetric(asset: MarketAsset): number {
  if (asset.foreignNetValue != null && asset.foreignNetValue !== 0) {
    return Math.abs(asset.foreignNetValue)
  }
  const buyVal = asset.foreignBuyValue
  const sellVal = asset.foreignSellValue
  if (buyVal != null || sellVal != null) {
    const net = (buyVal ?? 0) - (sellVal ?? 0)
    if (net !== 0) return Math.abs(net)
    return Math.max(buyVal ?? 0, sellVal ?? 0, 0)
  }
  const buyShares = asset.foreignBuy ?? 0
  const sellShares = asset.foreignSell ?? 0
  if (buyShares > 0 || sellShares > 0) {
    const netShares = buyShares - sellShares
    if (netShares !== 0) {
      return Math.abs(netShares) * asset.price
    }
    return Math.max(buyShares, sellShares) * asset.price
  }
  if (asset.foreignNet != null && asset.foreignNet !== 0) {
    return Math.abs(asset.foreignNet) * asset.price
  }
  return 0
}

/**
 * Proprietary net value — no per-symbol fields on MarketAsset / HeatmapAsset today.
 * Returns 0 until proprietary overlay is wired into heatmap rows.
 */
export function vnProprietaryFlowMetric(_asset: MarketAsset): number {
  return 0
}

export function vnHeatmapMetric(asset: MarketAsset, mode: VnHeatmapMode): number {
  switch (mode) {
    case "sector-volume":
      return vnVolumeMetric(asset)
    case "market-cap":
      return vnMarketCapMetric(asset)
    case "foreign-flow":
      return vnForeignFlowMetric(asset)
    case "proprietary-flow":
      return vnProprietaryFlowMetric(asset)
  }
}

export function sortByVnHeatmapMode(assets: MarketAsset[], mode: VnHeatmapMode): MarketAsset[] {
  return [...assets].sort((a, b) => vnHeatmapMetric(b, mode) - vnHeatmapMetric(a, mode))
}

export type VnFlatTreemapLayout = {
  leaves: TreemapLayoutNode<MarketAsset>[]
}

export function buildFlatVnTreemapLayout(
  assets: MarketAsset[],
  metricFn: (asset: MarketAsset) => number,
): VnFlatTreemapLayout {
  const leaves = buildFlatSquarifiedTreemap(assets, metricFn)
  return { leaves }
}

export function buildFlatVnTreemapLayoutForMode(
  assets: MarketAsset[],
  mode: VnHeatmapMode,
): VnFlatTreemapLayout {
  return buildFlatVnTreemapLayout(assets, (asset) => vnHeatmapMetric(asset, mode))
}
