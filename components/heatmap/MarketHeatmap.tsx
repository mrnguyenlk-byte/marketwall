"use client"

import { useMemo } from "react"

import type { Lang } from "@/lib/i18n"
import { limitHeatmapAssets } from "@/lib/market/heatmap-limits"
import {
  DEFAULT_VN_HEATMAP_SIZING,
  type VnHeatmapSizingMode,
} from "@/lib/vietnam/heatmap-sizing"
import type { MarketAsset, MarketType } from "@/types/market"
import { cn } from "@/lib/utils"

import { SectorTreemap } from "./SectorTreemap"
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

  const limitedAssets = useMemo(
    () => limitHeatmapAssets(assets, marketType, vnSizing),
    [assets, marketType, vnSizing],
  )

  if (marketType === "vn" && groupingMode === "sector") {
    return (
      <SectorTreemap
        assets={limitedAssets}
        sizingMode={vnSizing}
        groupLabel={groupLabel}
        onTileClick={onTileClick}
      />
    )
  }

  return (
    <div
      className={cn(GRID_CLASS, "h-full")}
      data-market-type={marketType}
      data-grouping="marketCap"
      data-sizing={marketType === "vn" ? vnSizing : "marketCap"}
    >
      {renderTiles(limitedAssets, onTileClick, detailedTooltip)}
    </div>
  )
}
