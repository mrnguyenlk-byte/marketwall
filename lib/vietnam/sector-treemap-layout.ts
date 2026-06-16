import type { MarketAsset } from "@/types/market"

import { sizeMetric, sortBySizeMetric, type VnHeatmapSizingMode } from "./heatmap-sizing"
import {
  VN_SECTOR_GROUP_LABEL_KEYS,
  VN_SECTOR_GROUP_ORDER,
  normalizeVnSectorGroup,
  type VnSectorGroupId,
} from "./sector-groups"

export type SectorTreemapBlock = {
  id: VnSectorGroupId
  labelKey: string
  assets: MarketAsset[]
  /** Total trading value / volume / cap for block width allocation. */
  weight: number
  flexGrow: number
}

export function buildSectorTreemapBlocks(
  assets: MarketAsset[],
  sizingMode: VnHeatmapSizingMode,
): SectorTreemapBlock[] {
  const buckets = new Map<VnSectorGroupId, MarketAsset[]>()

  for (const id of VN_SECTOR_GROUP_ORDER) {
    buckets.set(id, [])
  }

  for (const asset of assets) {
    const group = normalizeVnSectorGroup(asset.sector)
    buckets.get(group)?.push(asset)
  }

  const blocks = VN_SECTOR_GROUP_ORDER.map((id) => {
    const sorted = sortBySizeMetric(buckets.get(id) ?? [], sizingMode)
    const weight = sorted.reduce((sum, asset) => sum + sizeMetric(asset, sizingMode), 0)
    return {
      id,
      labelKey: VN_SECTOR_GROUP_LABEL_KEYS[id],
      assets: sorted,
      weight,
      flexGrow: 0,
    }
  }).filter((block) => block.assets.length > 0)

  const totalWeight = blocks.reduce((sum, block) => sum + block.weight, 0) || 1

  return blocks.map((block) => ({
    ...block,
    flexGrow: Math.max(block.weight / totalWeight, 0.03),
  }))
}

/** Grid columns scale with symbol count to maximize tile density inside a block. */
export function treemapBlockGridCols(symbolCount: number): number {
  if (symbolCount <= 3) return 2
  if (symbolCount <= 8) return 3
  if (symbolCount <= 15) return 4
  if (symbolCount <= 24) return 5
  if (symbolCount <= 35) return 6
  return 7
}
