"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { heatStyle, fmt } from "@/components/marketwall/shared"
import { useLang } from "@/lib/i18n"
import type { TreemapRect } from "@/lib/treemap/squarify"
import type { MarketAsset } from "@/types/market"
import { cn } from "@/lib/utils"

export type TileSize = "large" | "medium" | "small" | "tiny"

const sizeClasses: Record<
  TileSize,
  { grid: string; symbol: string; change: string }
> = {
  large: {
    grid: "col-span-2 row-span-2",
    symbol: "text-[13px] font-bold",
    change: "text-[12px] font-bold",
  },
  medium: {
    grid: "col-span-2 row-span-1",
    symbol: "text-[11px] font-bold",
    change: "text-[10px]",
  },
  small: {
    grid: "col-span-1 row-span-1",
    symbol: "text-[10px]",
    change: "",
  },
  tiny: {
    grid: "col-span-1 row-span-1",
    symbol: "",
    change: "",
  },
}

type HeatmapTileProps = {
  asset: MarketAsset
  size: TileSize
  rect?: TreemapRect
  proprietaryFallback?: boolean
  onClick: (asset: MarketAsset) => void
}

function CompactTooltip({
  asset,
  up,
  proprietaryFallback = false,
}: {
  asset: MarketAsset
  up: boolean
  proprietaryFallback?: boolean
}) {
  const { lang } = useLang()

  return (
    <div className="flex flex-col gap-0.5 leading-tight">
      <p className="font-semibold">{asset.symbol}</p>
      <p className="max-w-[140px] truncate text-[10px] text-background/75">{asset.name[lang]}</p>
      <p className="font-mono text-[11px] tabular-nums">
        {fmt(asset.price)} ·{" "}
        <span className={up ? "text-emerald-300" : "text-red-300"}>
          {up ? "+" : ""}
          {asset.changePercent.toFixed(2)}%
        </span>
      </p>
      {proprietaryFallback && (
        <p className="text-[10px] text-amber-200/90">Nguồn: proxy GTGD</p>
      )}
    </div>
  )
}

export function HeatmapTile({
  asset,
  size,
  rect,
  proprietaryFallback = false,
  onClick,
}: HeatmapTileProps) {
  const up = asset.changePercent >= 0
  const classes = sizeClasses[size]
  const showChange = size === "large" || size === "medium"
  const showSymbol = size !== "tiny"

  const tileBody = (
    <>
      {showSymbol && (
        <span
          className={cn(
            "truncate leading-none tracking-tight text-white drop-shadow-sm",
            classes.symbol,
          )}
        >
          {asset.symbol}
        </span>
      )}
      {showChange && (
        <span
          className={cn(
            "mt-auto font-mono tabular-nums text-white drop-shadow-sm",
            classes.change,
          )}
        >
          {up ? "+" : ""}
          {asset.changePercent.toFixed(2)}%
        </span>
      )}
    </>
  )

  const tileButton = (
    <button
      type="button"
      onClick={() => onClick(asset)}
      style={{
        ...heatStyle(asset.changePercent),
        ...(rect
          ? {
              position: "absolute",
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            }
          : {}),
      }}
      aria-label={`${asset.symbol} ${up ? "+" : ""}${asset.changePercent.toFixed(2)}%`}
      className={cn(
        "group/tile flex w-full min-w-0 flex-col items-start justify-between overflow-hidden rounded-none border border-black/20 text-left",
        size === "tiny" ? "min-h-0 p-0" : "p-0.5 sm:p-1",
        !rect && classes.grid,
      )}
    >
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-start justify-between overflow-hidden">
        {tileBody}
      </div>
    </button>
  )

  return (
    <Tooltip>
      <TooltipTrigger render={tileButton} />
      <TooltipContent
        side="top"
        align="center"
        sideOffset={6}
        className="pointer-events-none max-w-[180px] flex-col items-start p-2"
      >
        <CompactTooltip asset={asset} up={up} proprietaryFallback={proprietaryFallback} />
      </TooltipContent>
    </Tooltip>
  )
}
