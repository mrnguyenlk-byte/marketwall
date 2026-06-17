import type { MarketType } from "@/types/market"
import type { MarketAsset } from "@/types/market"

import { dollarVolume } from "@/lib/market/heatmap-limits"
import { type VnHeatmapSizingMode } from "@/lib/vietnam/heatmap-sizing"
import { vpsLotToShares } from "@/lib/vietnam/volume-units"

import { buildFlatMetricTreemap } from "./treemap-builders"
import type { TreemapLayoutNode, TreemapRect } from "./squarify"

export type HeatmapGroupingMode = "sector" | "industry" | "category" | "marketCap"

export type UsHeatmapSizingMode = "marketCap" | "dollarVolume"
export type CryptoHeatmapSizingMode = "volume" | "marketCap"

export type TreemapGroupLayout = {
  id: string
  labelKey?: string
  label: string
  rect: TreemapRect
  children: TreemapLayoutNode<MarketAsset>[]
}

export type HeatmapTreemapLayout = {
  groups: TreemapGroupLayout[]
  leaves: TreemapLayoutNode<MarketAsset>[]
}

const MIN_TILE_VALUE = 0.0001

/** Max share of unit-square area any single leaf may occupy after squarify. */
export const MAX_LEAF_AREA_FRACTION = 0.08

function applySqrtSizing(value: number): number {
  return Math.sqrt(Math.max(value, 0))
}

/** sqrt(metric) with per-leaf weight cap so max/total ≤ MAX_LEAF_AREA_FRACTION. */
export function capLeafWeights<T>(
  items: Array<{ data: T; value: number }>,
): Array<{ data: T; value: number }> {
  const sized = items.map((item) => ({
    ...item,
    value: Math.max(applySqrtSizing(item.value), MIN_TILE_VALUE),
  }))
  const total = sized.reduce((sum, item) => sum + item.value, 0)
  if (total <= 0) return sized
  const cap = total * MAX_LEAF_AREA_FRACTION
  return sized.map((item) => ({
    ...item,
    value: Math.max(Math.min(item.value, cap), MIN_TILE_VALUE),
  }))
}

export function vnTradingValueMetric(asset: MarketAsset): number {
  if (asset.tradingValue != null && asset.tradingValue > 0) return asset.tradingValue
  const shares = asset.volumeShares ?? vpsLotToShares(asset.volume)
  return Math.round(asset.price * shares)
}

export function assetSizeMetric(
  asset: MarketAsset,
  marketType: MarketType,
  sizing:
    | VnHeatmapSizingMode
    | UsHeatmapSizingMode
    | CryptoHeatmapSizingMode = "tradingValue",
): number {
  if (marketType === "vn") {
    const mode = sizing as VnHeatmapSizingMode
    switch (mode) {
      case "tradingValue":
        return vnTradingValueMetric(asset)
      case "volume":
        return asset.volumeShares ?? vpsLotToShares(asset.volume)
      case "marketCap":
        return asset.marketCap
    }
  }
  if (marketType === "us") {
    const mode = sizing as UsHeatmapSizingMode
    return mode === "dollarVolume"
      ? dollarVolume(asset.price, asset.volume)
      : asset.marketCap
  }
  const mode = sizing as CryptoHeatmapSizingMode
  return mode === "volume" ? asset.volume : asset.marketCap
}

/** Flat metric treemap for US (dollar volume) and Crypto (24h volume) — single mode each. */
export function buildFlatMarketHeatmapLayout(
  assets: MarketAsset[],
  marketType: "us" | "crypto",
  sizing: UsHeatmapSizingMode | CryptoHeatmapSizingMode,
): HeatmapTreemapLayout {
  const rect: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
  const metric = (asset: MarketAsset) => assetSizeMetric(asset, marketType, sizing)
  return {
    groups: [],
    leaves: buildFlatMetricTreemap(assets, metric, rect),
  }
}

/** @deprecated US/Crypto use flat layout only; grouping controls removed from UI. */
export function buildHeatmapTreemapLayout(
  assets: MarketAsset[],
  marketType: MarketType,
  _grouping: HeatmapGroupingMode,
  sizing:
    | VnHeatmapSizingMode
    | UsHeatmapSizingMode
    | CryptoHeatmapSizingMode,
): HeatmapTreemapLayout {
  if (marketType === "us") {
    return buildFlatMarketHeatmapLayout(
      assets,
      "us",
      sizing as UsHeatmapSizingMode,
    )
  }
  if (marketType === "crypto") {
    return buildFlatMarketHeatmapLayout(
      assets,
      "crypto",
      sizing as CryptoHeatmapSizingMode,
    )
  }

  const rect: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
  const metric = (asset: MarketAsset) =>
    assetSizeMetric(asset, marketType, sizing as VnHeatmapSizingMode)
  return {
    groups: [],
    leaves: buildFlatMetricTreemap(assets, metric, rect),
  }
}

export function tileSizeFromRect(rect: TreemapRect): "large" | "medium" | "small" | "tiny" {
  const area = rect.w * rect.h
  if (area >= 0.035) return "large"
  if (area >= 0.012) return "medium"
  if (area >= 0.0035) return "small"
  return "tiny"
}
