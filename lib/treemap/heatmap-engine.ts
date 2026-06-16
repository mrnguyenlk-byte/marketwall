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

import { squarify, squarifyGroups, type TreemapLayoutNode, type TreemapRect } from "./squarify"

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
export const MAX_LEAF_AREA_FRACTION = 0.1

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

function layoutItemsFromAssets(
  assets: MarketAsset[],
  marketType: MarketType,
  sizing:
    | VnHeatmapSizingMode
    | UsHeatmapSizingMode
    | CryptoHeatmapSizingMode,
): Array<{ data: MarketAsset; value: number }> {
  return capLeafWeights(
    assets.map((asset) => ({
      data: asset,
      value: assetSizeMetric(asset, marketType, sizing),
    })),
  )
}

function groupWeight(items: Array<{ value: number }>): number {
  return Math.max(items.reduce((sum, item) => sum + item.value, 0), MIN_TILE_VALUE)
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

function leafNodes(items: Array<{ data: MarketAsset; value: number }>, rect: TreemapRect) {
  return squarify(items, rect)
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
  const items = layoutItemsFromAssets(assets, marketType, sizing)

  if (grouping === "marketCap" || !assets.length) {
    const leaves = leafNodes(items, rect)
    return {
      groups: [],
      leaves,
    }
  }

  if (marketType === "us" && grouping === "sector") {
    return buildSectorIndustryLayout(assets, marketType, sizing, rect)
  }

  if (
    marketType === "vn" &&
    grouping === "sector" &&
    assets.some((a) => a.industry?.trim())
  ) {
    return buildSectorIndustryLayout(assets, marketType, sizing, rect)
  }

  const buckets = new Map<string, MarketAsset[]>()
  for (const asset of assets) {
    const key = groupKey(asset, grouping, marketType)
    const list = buckets.get(key) ?? []
    list.push(asset)
    buckets.set(key, list)
  }

  const groups = [...buckets.entries()].map(([id, list]) => {
    const items = layoutItemsFromAssets(list, marketType, sizing)
    return {
      id,
      ...groupLabel(id, marketType),
      items,
      value: groupWeight(items),
    }
  })

  groups.sort((a, b) => b.value - a.value)

  const packed = squarifyGroups(
    groups.map((g) => ({ data: g, value: g.value, items: g.items })),
    rect,
  )

  return {
    groups: packed.map((node) => ({
      id: node.data.id,
      label: node.data.label,
      labelKey: node.data.labelKey,
      rect: node.rect,
      children: node.children,
    })),
    leaves: packed.flatMap((g) => g.children),
  }
}

function buildSectorIndustryLayout(
  assets: MarketAsset[],
  marketType: MarketType,
  sizing: UsHeatmapSizingMode | VnHeatmapSizingMode | CryptoHeatmapSizingMode,
  rect: TreemapRect,
): HeatmapTreemapLayout {
  const sectors = new Map<string, MarketAsset[]>()
  for (const asset of assets) {
    const sector = asset.sector?.trim() || "Other"
    const list = sectors.get(sector) ?? []
    list.push(asset)
    sectors.set(sector, list)
  }

  const sectorGroups = [...sectors.entries()].map(([sectorId, list]) => {
    const industries = new Map<string, MarketAsset[]>()
    for (const asset of list) {
      const ind =
        marketType === "vn"
          ? asset.industry?.trim() || sectorId
          : asset.industry?.trim() || asset.sector?.trim() || "Other"
      const bucket = industries.get(ind) ?? []
      bucket.push(asset)
      industries.set(ind, bucket)
    }

    const industryNodes = [...industries.entries()].map(([industryId, stocks]) => {
      const items = layoutItemsFromAssets(stocks, marketType, sizing)
      return {
        id: `${sectorId}::${industryId}`,
        label: industryId,
        value: groupWeight(items),
        items,
      }
    })

    const sectorWeight = industryNodes.reduce((s, n) => s + n.value, 0)
    const sectorMeta = groupLabel(sectorId, marketType)

    return {
      id: sectorId,
      label: sectorMeta.label,
      labelKey: sectorMeta.labelKey,
      value: Math.max(sectorWeight, MIN_TILE_VALUE),
      industries: industryNodes,
    }
  })

  sectorGroups.sort((a, b) => b.value - a.value)

  const topPacked = squarify(
    sectorGroups.map((s) => ({ data: s, value: s.value })),
    rect,
  )

  const groups: TreemapGroupLayout[] = []
  const leaves: TreemapLayoutNode<MarketAsset>[] = []

  for (const sectorNode of topPacked) {
    const sector = sectorNode.data
    const headerH = Math.min(sectorNode.rect.h * 0.06, 0.028)
    const inner: TreemapRect = {
      x: sectorNode.rect.x,
      y: sectorNode.rect.y + headerH,
      w: sectorNode.rect.w,
      h: Math.max(sectorNode.rect.h - headerH, 0),
    }

    const collapseIndustry =
      sector.industries.length === 1 &&
      sector.industries[0].label === sector.label

    if (collapseIndustry) {
      const children = squarify(sector.industries[0].items, inner)
      const sectorMeta = groupLabel(sector.id, marketType)
      groups.push({
        id: sector.id,
        label: sectorMeta.label,
        labelKey: sectorMeta.labelKey,
        rect: sectorNode.rect,
        children,
      })
      leaves.push(...children)
      continue
    }

    const industryPacked = squarifyGroups(
      sector.industries.map((ind) => ({
        data: { id: ind.id, label: ind.label, labelKey: undefined },
        value: ind.value,
        items: ind.items,
      })),
      inner,
      0.06,
    )

    for (const ind of industryPacked) {
      groups.push({
        id: ind.data.id,
        label: ind.data.label,
        rect: ind.rect,
        children: ind.children,
      })
      leaves.push(...ind.children)
    }
  }

  return { groups, leaves }
}

export function tileSizeFromRect(rect: TreemapRect): "large" | "medium" | "small" | "tiny" {
  const area = rect.w * rect.h
  if (area >= 0.035) return "large"
  if (area >= 0.012) return "medium"
  if (area >= 0.0035) return "small"
  return "tiny"
}
