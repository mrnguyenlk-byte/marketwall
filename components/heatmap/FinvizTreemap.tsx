"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Minus, Plus, RotateCcw } from "lucide-react"

import {
  buildFlatMarketHeatmapLayout,
  tileSizeFromRect,
  type CryptoHeatmapSizingMode,
  type UsHeatmapSizingMode,
} from "@/lib/treemap/heatmap-engine"
import type { MarketAsset } from "@/types/market"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { HeatmapTile } from "./HeatmapTile"

type FinvizTreemapProps = {
  assets: MarketAsset[]
  marketType: "us" | "crypto"
  sizing: UsHeatmapSizingMode | CryptoHeatmapSizingMode
  onTileClick: (asset: MarketAsset) => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 2.5

export function FinvizTreemap({
  assets,
  marketType,
  sizing,
  onTileClick,
}: FinvizTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const layout = useMemo(
    () => buildFlatMarketHeatmapLayout(assets, marketType, sizing),
    [assets, marketType, sizing],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoom <= 1) return
      dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    [pan.x, pan.y, zoom],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    setPan({
      x: drag.panX + (e.clientX - drag.x),
      y: drag.panY + (e.clientY - drag.y),
    })
  }, [])

  const onPointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="absolute right-1 top-1 z-20 flex items-center gap-0.5 rounded-md bg-card/90 p-0.5 shadow-sm ring-1 ring-border/60">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.15))}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="min-w-[2.5rem] text-center text-[10px] font-mono tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.15))}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Reset view"
          onClick={resetView}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>

      <TooltipProvider delay={175}>
        <div
          ref={containerRef}
          className={cn(
            "relative h-full w-full touch-none overflow-hidden bg-heatmap-gap",
            zoom > 1 && "cursor-grab active:cursor-grabbing",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          data-market-type={marketType}
          data-grouping="flat-treemap"
          data-sizing={sizing}
        >
          <div
            className="absolute inset-0 origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <div className="relative h-full w-full">
              {layout.leaves.map((leaf) => (
                <HeatmapTile
                  key={leaf.data.symbol}
                  asset={leaf.data}
                  size={tileSizeFromRect(leaf.rect)}
                  rect={leaf.rect}
                  onClick={onTileClick}
                />
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
