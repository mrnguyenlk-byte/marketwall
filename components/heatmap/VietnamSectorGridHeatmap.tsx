"use client"

import { useMemo } from "react"

import { HeatmapTile } from "@/components/heatmap/HeatmapTile"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  buildSectorGroupedTreemap,
  tierToTileSize,
} from "@/lib/vietnam/vietnam-sector-grid-layout"
import type { MarketAsset } from "@/types/market"

type VietnamSectorGridHeatmapProps = {
  assets: MarketAsset[]
  groupLabel?: (key: string) => string
  onTileClick: (asset: MarketAsset) => void
}

function pct(n: number) {
  return `${n * 100}%`
}

function rectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: pct(rect.x),
    top: pct(rect.y),
    width: pct(rect.w),
    height: pct(rect.h),
  }
}

export function VietnamSectorGridHeatmap({
  assets,
  groupLabel,
  onTileClick,
}: VietnamSectorGridHeatmapProps) {
  const layout = useMemo(() => buildSectorGroupedTreemap(assets), [assets])

  return (
    <TooltipProvider delay={175}>
      <div
        className="relative h-full w-full overflow-hidden bg-heatmap-gap"
        data-market-type="vn"
        data-grouping="sector-treemap"
        data-sizing="volume"
      >
        {layout.sectors.map((sector) => (
          <div
            key={`bg-${sector.id}`}
            className="pointer-events-none absolute z-10 box-border overflow-hidden border border-black/25 bg-chart-bg"
            style={rectStyle(sector.rect)}
          >
            {!sector.hideLabel && (
              <header className="relative z-20 flex h-[22px] min-h-[22px] shrink-0 items-center truncate border-b border-black/30 bg-black/75 px-1.5 text-[10px] font-bold tracking-wide text-white sm:text-[11px]">
                {groupLabel ? groupLabel(sector.labelKey) : sector.labelKey}
              </header>
            )}
          </div>
        ))}

        {layout.sectors.flatMap((sector) =>
          sector.tiles.map((tile) => (
            <HeatmapTile
              key={tile.asset.symbol}
              asset={tile.asset}
              size={tierToTileSize(tile.textTier)}
              rect={tile.rect}
              onClick={onTileClick}
            />
          )),
        )}
      </div>
    </TooltipProvider>
  )
}
