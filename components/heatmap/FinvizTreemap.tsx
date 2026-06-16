"use client"

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react"
import { Minus, Plus, RotateCcw } from "lucide-react"

import {
  buildHeatmapTreemapLayout,
  tileSizeFromRect,
  type CryptoHeatmapSizingMode,
  type HeatmapGroupingMode,
  type UsHeatmapSizingMode,
} from "@/lib/treemap/heatmap-engine"
import type { TreemapRect } from "@/lib/treemap/squarify"
import type { VnHeatmapSizingMode } from "@/lib/vietnam/heatmap-sizing"
import type { MarketAsset, MarketType } from "@/types/market"
import { cn } from "@/lib/utils"

import { HeatmapTile } from "./HeatmapTile"

type FinvizTreemapProps = {
  assets: MarketAsset[]
  marketType: MarketType
  grouping: HeatmapGroupingMode
  sizing: VnHeatmapSizingMode | UsHeatmapSizingMode | CryptoHeatmapSizingMode
  groupLabel?: (key: string) => string
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

export function FinvizTreemap({
  assets,
  marketType,
  grouping,
  sizing,
  groupLabel,
  onTileClick,
}: FinvizTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const layout = useMemo(
    () => buildHeatmapTreemapLayout(assets, marketType, grouping, sizing),
    [assets, marketType, grouping, sizing],
  )

  const detailedTooltip = true

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)))
  }, [])

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

  const showGroups = layout.groups.length > 0

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

      <div
        ref={containerRef}
        className={cn(
          "relative h-full w-full touch-none overflow-hidden bg-heatmap-gap",
          zoom > 1 && "cursor-grab active:cursor-grabbing",
        )}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-market-type={marketType}
        data-grouping={grouping}
        data-sizing={sizing}
      >
        <div
          className="absolute inset-0 origin-top-left transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <div className="relative h-full w-full">
            {showGroups
              ? layout.groups.map((group) => (
                  <div
                    key={group.id}
                    className="pointer-events-none absolute box-border overflow-hidden border border-black/30"
                    style={rectStyle(group.rect)}
                  >
                    <div className="truncate bg-black/35 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-white/90 sm:text-[10px]">
                      {group.labelKey && groupLabel
                        ? groupLabel(group.labelKey)
                        : group.label}
                    </div>
                  </div>
                ))
              : null}
            {layout.leaves.map((leaf) => (
              <HeatmapTile
                key={leaf.data.symbol}
                asset={leaf.data}
                size={tileSizeFromRect(leaf.rect)}
                rect={leaf.rect}
                detailedTooltip={detailedTooltip}
                onClick={onTileClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
