"use client"

import { useMemo } from "react"

import { HeatmapTile } from "@/components/heatmap/HeatmapTile"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  buildVietnamSectorTreemapLayout,
  tierToTileSize,
} from "@/lib/vietnam/vietnam-sector-grid-layout"
import type { VnHeatmapSizingMode } from "@/lib/vietnam/heatmap-sizing"
import type { MarketAsset } from "@/types/market"
import { cn } from "@/lib/utils"

type VietnamSectorGridHeatmapProps = {
  assets: MarketAsset[]
  sizing: VnHeatmapSizingMode
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
  sizing,
  groupLabel,
  onTileClick,
}: VietnamSectorGridHeatmapProps) {
  const layout = useMemo(
    () => buildVietnamSectorTreemapLayout(assets, sizing),
    [assets, sizing],
  )

  return (
    <TooltipProvider delay={175}>
      <div
        className="relative h-full w-full overflow-hidden bg-heatmap-gap"
        data-market-type="vn"
        data-grouping="sector-treemap"
        data-sizing={sizing}
      >
        {layout.sectors.map((sector) => (
          <div
            key={`bg-${sector.id}`}
            className="pointer-events-none absolute box-border overflow-hidden border border-black/25 bg-chart-bg"
            style={rectStyle(sector.rect)}
          >
            <header className="flex h-[min(7%,22px)] min-h-[18px] shrink-0 items-center truncate border-b border-black/30 bg-black/65 px-1.5 text-[10px] font-bold uppercase tracking-wide text-white sm:text-[11px]">
              {groupLabel ? groupLabel(sector.labelKey) : sector.labelKey}
            </header>
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

        {layout.sectors.map(
          (sector) =>
            sector.other && (
              <div
                key={`other-${sector.id}`}
                className={cn(
                  "absolute flex items-center justify-center border border-black/20 bg-secondary/80 p-0.5",
                )}
                style={rectStyle(sector.other.rect)}
                title={sector.other.symbols.join(", ")}
              >
                <span className="text-[9px] font-bold uppercase tracking-wide text-foreground/90">
                  Khác
                </span>
              </div>
            ),
        )}
      </div>
    </TooltipProvider>
  )
}
