"use client"

import {
  buildSectorTreemapBlocks,
  treemapBlockGridCols,
} from "@/lib/vietnam/sector-treemap-layout"
import type { VnHeatmapSizingMode } from "@/lib/vietnam/heatmap-sizing"
import type { MarketAsset } from "@/types/market"
import { cn } from "@/lib/utils"

import { HeatmapTile, type TileSize } from "./HeatmapTile"

type SectorTreemapProps = {
  assets: MarketAsset[]
  sizingMode: VnHeatmapSizingMode
  groupLabel?: (key: string) => string
  onTileClick: (asset: MarketAsset) => void
}

function tileSizeForRank(rank: number, total: number): TileSize {
  const largeCutoff = Math.max(1, Math.ceil(total * 0.08))
  const mediumCutoff = Math.max(largeCutoff + 1, Math.ceil(total * 0.22))
  const smallCutoff = Math.max(mediumCutoff + 1, Math.ceil(total * 0.45))
  if (rank < largeCutoff) return "large"
  if (rank < mediumCutoff) return "medium"
  if (rank < smallCutoff) return "small"
  return "tiny"
}

export function SectorTreemap({
  assets,
  sizingMode,
  groupLabel,
  onTileClick,
}: SectorTreemapProps) {
  const blocks = buildSectorTreemapBlocks(assets, sizingMode)

  return (
    <div
      className="flex h-full min-h-0 w-full gap-px bg-heatmap-gap"
      data-grouping="sector-treemap"
      data-sizing={sizingMode}
    >
      {blocks.map((block) => {
        const cols = treemapBlockGridCols(block.assets.length)
        return (
          <section
            key={block.id}
            aria-label={groupLabel?.(block.labelKey) ?? block.id}
            className="flex min-w-0 min-h-0 flex-col bg-chart-bg"
            style={{ flex: `${block.flexGrow} 1 0%` }}
          >
            <header className="shrink-0 border-b border-black/30 bg-card/80 px-1.5 py-0.5">
              <h3 className="truncate text-[9px] font-bold uppercase tracking-wide text-foreground/90 sm:text-[10px]">
                {groupLabel?.(block.labelKey) ?? block.labelKey}
              </h3>
            </header>
            <div
              className={cn(
                "grid min-h-0 flex-1 grid-flow-dense gap-px bg-heatmap-gap p-px",
                "auto-rows-[minmax(26px,1fr)]",
              )}
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {block.assets.map((asset, index) => (
                <HeatmapTile
                  key={asset.symbol}
                  asset={asset}
                  size={tileSizeForRank(index, block.assets.length)}
                  detailedTooltip
                  onClick={onTileClick}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
