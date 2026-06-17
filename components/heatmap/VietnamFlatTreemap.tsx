"use client"

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react"
import { Minus, Plus, RotateCcw } from "lucide-react"

import { HeatmapTile } from "@/components/heatmap/HeatmapTile"
import { TooltipProvider } from "@/components/ui/tooltip"
import { tileSizeFromRect } from "@/lib/treemap/heatmap-engine"
import type { TreemapRect } from "@/lib/treemap/squarify"
import {
  buildFlatVnTreemapLayoutForMode,
  type VnHeatmapMode,
} from "@/lib/vietnam/vn-heatmap-modes"
import type { MarketAsset } from "@/types/market"
import { cn } from "@/lib/utils"

type VietnamFlatTreemapProps = {
  assets: MarketAsset[]
  mode: VnHeatmapMode
  isProprietaryFallback?: boolean
  onTileClick: (asset: MarketAsset) => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 2.5

function pct(n: number) {
  return `${n * 100}%`
}

function rectStyle(rect: TreemapRect): CSSProperties {
  return {
    left: pct(rect.x),
    top: pct(rect.y),
    width: pct(rect.w),
    height: pct(rect.h),
  }
}

export function VietnamFlatTreemap({
  assets,
  mode,
  isProprietaryFallback = false,
  onTileClick,
}: VietnamFlatTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const layout = useMemo(() => buildFlatVnTreemapLayoutForMode(assets, mode), [assets, mode])

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
      {isProprietaryFallback && (
        <div
          className="absolute left-1 top-1 z-20 max-w-[min(100%,20rem)] rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-medium leading-snug text-amber-800 ring-1 ring-amber-500/30 dark:text-amber-200"
          role="status"
        >
          Chưa có dữ liệu tự doanh trực tiếp — đang hiển thị theo GTGD
        </div>
      )}
      {isProprietaryFallback && (
        <div className="absolute bottom-1 left-1 z-20 rounded bg-card/90 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-border/60">
          Tự doanh (proxy GTGD)
        </div>
      )}
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
          data-market-type="vn"
          data-grouping="flat-treemap"
          data-vn-mode={mode}
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
                  proprietaryFallback={isProprietaryFallback}
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
