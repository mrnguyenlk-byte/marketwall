import type { MarketType } from "@/types/market"
import type { MarketAsset } from "@/types/market"

import { dollarVolume } from "@/lib/market/heatmap-limits"
import {
  normalizeVnSectorGroup,
  VN_SECTOR_GROUP_LABEL_KEYS,
  type VnSectorGroupId,
} from "@/lib/vietnam/sector-groups"
import { tradingValue, type VnHeatmapSizingMode } from "@/lib/vietnam/heatmap-sizing"
import { vpsLotToShares } from "@/lib/vietnam/volume-units"

import {
  buildFlatSquarifiedTreemap,
  buildGroupedSquarifiedTreemap,
} from "./treemap-builders"
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

function groupKey(asset: MarketAsset, mode: HeatmapGroupingMode, marketType: MarketType): string {
  if (mode === "marketCap") return "all"
  if (marketType === "crypto" && mode === "category") {
    return asset.sector?.trim() || "Crypto"
  }
  if (mode === "industry") {
    return asset.industry?.trim() || asset.sector?.trim() || "Other"
  }
  if (marketType === "vn") {
    return normalizeVnSectorGroup(asset.sector)
  }
  return asset.sector?.trim() || "Other"
}

function groupLabel(id: string, marketType: MarketType): { label: string; labelKey?: string } {
  if (marketType === "vn" && id in VN_SECTOR_GROUP_LABEL_KEYS) {
    return { label: id, labelKey: VN_SECTOR_GROUP_LABEL_KEYS[id as VnSectorGroupId] }
  }
  return { label: id }
}

export function buildHeatmapTreemapLayout(
  assets: MarketAsset[],
  marketType: MarketType,
  grouping: HeatmapGroupingMode,
  sizing:
    | VnHeatmapSizingMode
    | UsHeatmapSizingMode
    | CryptoHeatmapSizingMode,
): HeatmapTreemapLayout {
  const rect: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
  const metric = (asset: MarketAsset) => assetSizeMetric(asset, marketType, sizing)

  if (grouping === "marketCap" || !assets.length) {
    return {
      groups: [],
      leaves: buildFlatSquarifiedTreemap(assets, metric, rect),
    }
  }

  const buckets = new Map<string, MarketAsset[]>()
  for (const asset of assets) {
    const key = groupKey(asset, grouping, marketType)
    const list = buckets.get(key) ?? []
    list.push(asset)
    buckets.set(key, list)
  }

  const grouped = buildGroupedSquarifiedTreemap(
    [...buckets.entries()].map(([id, items]) => ({
      data: { id, ...groupLabel(id, marketType), items },
      items,
    })),
    (group) => group.items.reduce((sum, asset) => sum + metric(asset), 0),
    metric,
    { rect, headerRatio: 0.04 },
  )

  grouped.groups.sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h)

  return {
    groups: grouped.groups.map((node) => ({
      id: node.data.id,
      label: node.data.label,
      labelKey: node.data.labelKey,
      rect: node.rect,
      children: node.children,
    })),
    leaves: grouped.leaves,
  }
}

export function tileSizeFromRect(rect: TreemapRect): "large" | "medium" | "small" | "tiny" {
  const area = rect.w * rect.h
  if (area >= 0.035) return "large"
  if (area >= 0.012) return "medium"
  if (area >= 0.0035) return "small"
  return "tiny"
}
