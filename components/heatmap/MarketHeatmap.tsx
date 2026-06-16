"use client"

import { useMemo } from "react"

import type { Lang } from "@/lib/i18n"
import {
  DEFAULT_VN_HEATMAP_SIZING,
  sortBySizeMetric,
  type VnHeatmapSizingMode,
} from "@/lib/vietnam/heatmap-sizing"
import {
  VN_SECTOR_GROUP_LABEL_KEYS,
  VN_SECTOR_GROUP_ORDER,
  normalizeVnSectorGroup,
  type VnSectorGroupId,
} from "@/lib/vietnam/sector-groups"
import type { MarketAsset, MarketType } from "@/types/market"

import { HeatmapTile, type TileSize } from "./HeatmapTile"

export type HeatmapGroupingMode = "sector" | "marketCap"

type MarketHeatmapProps = {
  assets: MarketAsset[]
  locale: Lang
  marketType: MarketType
  groupingMode?: HeatmapGroupingMode
  sizingMode?: VnHeatmapSizingMode
  groupLabel?: (key: string) => string
  onTileClick: (asset: MarketAsset) => void
}

const GRID_CLASS =
  "grid grid-flow-dense auto-rows-[minmax(32px,1fr)] grid-cols-8 gap-px bg-heatmap-gap sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-[repeat(14,minmax(0,1fr))] xl:grid-cols-[repeat(16,minmax(0,1fr))]"

function tileSizeForRank(rank: number, total: number): TileSize {
  const largeCutoff = Math.max(1, Math.ceil(total * 0.08))
  const mediumCutoff = Math.max(largeCutoff + 1, Math.ceil(total * 0.22))
  const smallCutoff = Math.max(mediumCutoff + 1, Math.ceil(total * 0.45))
  if (rank < largeCutoff) return "large"
  if (rank < mediumCutoff) return "medium"
  if (rank < smallCutoff) return "small"
  return "tiny"
}

function sortByMarketCap(assets: MarketAsset[]): MarketAsset[] {
  return [...assets].sort((a, b) => b.marketCap - a.marketCap)
}

function sortForMarket(
  assets: MarketAsset[],
  marketType: MarketType,
  sizingMode: VnHeatmapSizingMode,
): MarketAsset[] {
  if (marketType === "vn") return sortBySizeMetric(assets, sizingMode)
  return sortByMarketCap(assets)
}

function groupBySector(
  assets: MarketAsset[],
  sizingMode: VnHeatmapSizingMode,
): Array<{ id: VnSectorGroupId; labelKey: string; assets: MarketAsset[] }> {
  const buckets = new Map<VnSectorGroupId, MarketAsset[]>()

  for (const id of VN_SECTOR_GROUP_ORDER) {
    buckets.set(id, [])
  }

  for (const asset of assets) {
    const group = normalizeVnSectorGroup(asset.sector)
    buckets.get(group)?.push(asset)
  }

  return VN_SECTOR_GROUP_ORDER.map((id) => ({
    id,
    labelKey: VN_SECTOR_GROUP_LABEL_KEYS[id],
    assets: sortBySizeMetric(buckets.get(id) ?? [], sizingMode),
  })).filter((group) => group.assets.length > 0)
}

function renderTiles(
  items: MarketAsset[],
  onTileClick: (asset: MarketAsset) => void,
  detailedTooltip: boolean,
) {
  return items.map((asset, index) => (
    <HeatmapTile
      key={asset.symbol}
      asset={asset}
      size={tileSizeForRank(index, items.length)}
      detailedTooltip={detailedTooltip}
      onClick={onTileClick}
    />
  ))
}

export function MarketHeatmap({
  assets,
  locale: _locale,
  marketType,
  groupingMode = "sector",
  sizingMode = DEFAULT_VN_HEATMAP_SIZING,
  groupLabel,
  onTileClick,
}: MarketHeatmapProps) {
  const vnSizing = marketType === "vn" ? sizingMode : DEFAULT_VN_HEATMAP_SIZING
  const detailedTooltip = marketType === "vn"

  const sorted = useMemo(
    () => sortForMarket(assets, marketType, vnSizing),
    [assets, marketType, vnSizing],
  )

  const sectorGroups = useMemo(() => {
    if (marketType !== "vn" || groupingMode !== "sector") return null
    return groupBySector(assets, vnSizing)
  }, [assets, marketType, groupingMode, vnSizing])

  if (sectorGroups) {
    return (
      <div
        className="flex h-full flex-col gap-3 overflow-y-auto p-1"
        data-market-type={marketType}
        data-grouping="sector"
        data-sizing={vnSizing}
      >
        {sectorGroups.map((group) => (
          <section key={group.id} aria-label={groupLabel?.(group.labelKey) ?? group.id}>
            <h3 className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
              {groupLabel?.(group.labelKey) ?? group.labelKey}
            </h3>
            <div className={GRID_CLASS}>
              {renderTiles(group.assets, onTileClick, detailedTooltip)}
            </div>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div
      className={GRID_CLASS}
      data-market-type={marketType}
      data-grouping="marketCap"
      data-sizing={marketType === "vn" ? vnSizing : "marketCap"}
    >
      {renderTiles(sorted, onTileClick, detailedTooltip)}
    </div>
  )
}
