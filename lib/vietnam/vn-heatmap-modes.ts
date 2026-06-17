import { vnTradingValueMetric } from "@/lib/treemap/heatmap-engine"
import {
  buildFlatMetricTreemap,
  TREEMAP_COMPRESSION_POWER,
  VN_MAX_ITEM_AREA_SHARE,
} from "@/lib/treemap/treemap-builders"
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

type ExtendedMarketAsset = MarketAsset & {
  proprietaryNetValue?: number
  proprietaryTradingValue?: number
  proprietaryBuyValue?: number
  proprietarySellValue?: number
  foreignTradingValue?: number
}

export function vnTradingValueModeMetric(asset: MarketAsset): number {
  return Math.max(vnTradingValueMetric(asset), 0)
}

export function vnVolumeMetric(asset: MarketAsset): number {
  return asset.volumeShares ?? vpsLotToShares(asset.volume)
}

export function vnMarketCapMetric(asset: MarketAsset): number {
  return Math.max(asset.marketCap, 0)
}

/** Net foreign value in VND; falls back to gross foreign trading value or shares × price. */
export function vnForeignFlowMetric(asset: MarketAsset): number {
  const ext = asset as ExtendedMarketAsset
  if (ext.foreignNetValue != null && ext.foreignNetValue !== 0) {
    return Math.abs(ext.foreignNetValue)
  }
  if (ext.foreignTradingValue != null && ext.foreignTradingValue > 0) {
    return ext.foreignTradingValue
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

export function vnProprietaryFlowMetric(asset: MarketAsset): number {
  const ext = asset as ExtendedMarketAsset
  if (ext.proprietaryNetValue != null && ext.proprietaryNetValue !== 0) {
    return Math.abs(ext.proprietaryNetValue)
  }
  if (ext.proprietaryTradingValue != null && ext.proprietaryTradingValue > 0) {
    return ext.proprietaryTradingValue
  }
  const buyVal = ext.proprietaryBuyValue
  const sellVal = ext.proprietarySellValue
  if (buyVal != null || sellVal != null) {
    const net = (buyVal ?? 0) - (sellVal ?? 0)
    if (net !== 0) return Math.abs(net)
    return Math.max(buyVal ?? 0, sellVal ?? 0, 0)
  }
  return 0
}

/** True when at least one asset has direct proprietary flow metrics. */
export function hasVnProprietaryMetrics(assets: MarketAsset[]): boolean {
  return assets.some((asset) => vnProprietaryFlowMetric(asset) > 0)
}

export type VnProprietaryModeContext = {
  proprietaryDataAvailable: boolean
  useTradingValueFallback: boolean
}

/** Resolve proprietary mode once per layout — not per tile. */
export function resolveVnProprietaryModeContext(
  assets: MarketAsset[],
): VnProprietaryModeContext {
  const proprietaryDataAvailable = hasVnProprietaryMetrics(assets)
  return {
    proprietaryDataAvailable,
    useTradingValueFallback: !proprietaryDataAvailable,
  }
}

export function vnProprietaryDisplayMetric(
  asset: MarketAsset,
  context: VnProprietaryModeContext,
): number {
  if (context.useTradingValueFallback) {
    return vnTradingValueModeMetric(asset)
  }
  return vnProprietaryFlowMetric(asset)
}

export function vnHeatmapMetric(asset: MarketAsset, mode: VnHeatmapMode): number {
  switch (mode) {
    case "sector-volume":
      return vnTradingValueModeMetric(asset)
    case "market-cap":
      return vnMarketCapMetric(asset)
    case "foreign-flow":
      return vnForeignFlowMetric(asset)
    case "proprietary-flow":
      return vnProprietaryFlowMetric(asset)
  }
}

export function vnModeHasValidMetrics(assets: MarketAsset[], mode: VnHeatmapMode): boolean {
  if (mode === "proprietary-flow") {
    const context = resolveVnProprietaryModeContext(assets)
    return assets.some((asset) => vnProprietaryDisplayMetric(asset, context) > 0)
  }
  return assets.some((asset) => vnHeatmapMetric(asset, mode) > 0)
}

export function sortByVnHeatmapMode(assets: MarketAsset[], mode: VnHeatmapMode): MarketAsset[] {
  return [...assets].sort((a, b) => vnHeatmapMetric(b, mode) - vnHeatmapMetric(a, mode))
}

export type VnFlatTreemapLayout = {
  leaves: TreemapLayoutNode<MarketAsset>[]
  /** Set when proprietary-flow renders with GTGD proxy sizing. */
  isProprietaryFallback?: boolean
}

function vnFlatCompressionPower(mode: VnHeatmapMode): number {
  return mode === "market-cap"
    ? TREEMAP_COMPRESSION_POWER.VN_MARKET_CAP_FLAT
    : TREEMAP_COMPRESSION_POWER.VN_FLOW_FLAT
}

export function buildFlatVnTreemapLayout(
  assets: MarketAsset[],
  metricFn: (asset: MarketAsset) => number,
  options?: { power?: number },
): VnFlatTreemapLayout {
  const leaves = buildFlatMetricTreemap(
    [...assets].sort((a, b) => metricFn(b) - metricFn(a)),
    metricFn,
    undefined,
    {
    allowEqualGridFallback: false,
    maxShare: VN_MAX_ITEM_AREA_SHARE,
    power: options?.power,
  })
  return { leaves }
}

export function buildFlatVnTreemapLayoutForMode(
  assets: MarketAsset[],
  mode: VnHeatmapMode,
): VnFlatTreemapLayout {
  if (mode === "proprietary-flow") {
    const context = resolveVnProprietaryModeContext(assets)
    return {
      ...buildFlatVnTreemapLayout(
        assets,
        (asset) => vnProprietaryDisplayMetric(asset, context),
        { power: vnFlatCompressionPower(mode) },
      ),
      isProprietaryFallback: context.useTradingValueFallback,
    }
  }

  return buildFlatVnTreemapLayout(
    assets,
    (asset) => vnHeatmapMetric(asset, mode),
    { power: vnFlatCompressionPower(mode) },
  )
}
