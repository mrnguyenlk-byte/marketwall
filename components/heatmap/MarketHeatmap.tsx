"use client"

import { useMemo } from "react"

import type { Lang } from "@/lib/i18n"
import type { MarketAsset, MarketType } from "@/types/market"

import { HeatmapTile, type TileSize } from "./HeatmapTile"

type MarketHeatmapProps = {
  assets: MarketAsset[]
  locale: Lang
  marketType: MarketType
  onTileClick: (asset: MarketAsset) => void
}

function tileSizeForRank(rank: number, total: number): TileSize {
  const largeCutoff = Math.max(1, Math.ceil(total * 0.1))
  const mediumCutoff = Math.max(largeCutoff + 1, Math.ceil(total * 0.3))
  if (rank < largeCutoff) return "large"
  if (rank < mediumCutoff) return "medium"
  return "small"
}

export function MarketHeatmap({
  assets,
  locale: _locale,
  marketType,
  onTileClick,
}: MarketHeatmapProps) {
  const sorted = useMemo(
    () => [...assets].sort((a, b) => b.marketCap - a.marketCap),
    [assets],
  )

  return (
    <div
      className="grid h-full grid-flow-dense auto-rows-[minmax(36px,1fr)] grid-cols-8 gap-px bg-heatmap-gap sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-[repeat(14,minmax(0,1fr))] xl:grid-cols-[repeat(16,minmax(0,1fr))]"
      data-market-type={marketType}
    >
      {sorted.map((asset, index) => (
        <HeatmapTile
          key={asset.symbol}
          asset={asset}
          size={tileSizeForRank(index, sorted.length)}
          onClick={onTileClick}
        />
      ))}
    </div>
  )
}
