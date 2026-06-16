"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { heatStyle, fmt } from "@/components/marketwall/shared"
import { useLang } from "@/lib/i18n"
import type { MarketAsset } from "@/types/market"
import { cn } from "@/lib/utils"

export type TileSize = "large" | "medium" | "small"

const sizeClasses: Record<TileSize, { grid: string; symbol: string; change: string; price: string }> = {
  large: {
    grid: "col-span-2 row-span-2",
    symbol: "text-lg sm:text-xl lg:text-2xl",
    change: "text-sm sm:text-base lg:text-lg",
    price: "text-[10px] sm:text-xs",
  },
  medium: {
    grid: "col-span-2 row-span-1",
    symbol: "text-sm sm:text-base lg:text-lg",
    change: "text-xs sm:text-sm",
    price: "text-[10px] sm:text-xs",
  },
  small: {
    grid: "col-span-1 row-span-1",
    symbol: "text-[10px] sm:text-xs",
    change: "text-[10px] sm:text-xs",
    price: "text-[9px] sm:text-[10px]",
  },
}

type HeatmapTileProps = {
  asset: MarketAsset
  size: TileSize
  onClick: (asset: MarketAsset) => void
}

export function HeatmapTile({ asset, size, onClick }: HeatmapTileProps) {
  const { lang, t } = useLang()
  const up = asset.changePercent >= 0
  const classes = sizeClasses[size]
  const showPrice = size !== "small"

  const tileButton = (
    <button
      type="button"
      onClick={() => onClick(asset)}
      style={heatStyle(asset.changePercent)}
      className={cn(
        "group/tile flex flex-col items-start justify-between rounded-none border border-black/20 p-1 text-left transition-[filter,transform] hover:z-10 hover:brightness-110 sm:p-1.5 lg:p-2",
        classes.grid,
      )}
    >
      <span
        className={cn(
          "truncate font-extrabold leading-none tracking-tight text-white drop-shadow-sm",
          classes.symbol,
        )}
      >
        {asset.symbol}
      </span>
      <span
        className={cn(
          "mt-auto font-mono font-bold tabular-nums text-white drop-shadow-sm",
          classes.change,
        )}
      >
        {up ? "+" : ""}
        {asset.changePercent.toFixed(2)}%
      </span>
      {showPrice && (
        <span
          className={cn(
            "font-mono tabular-nums text-white/85 drop-shadow-sm",
            classes.price,
          )}
        >
          {fmt(asset.price)}
        </span>
      )}
    </button>
  )

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger render={tileButton} />
        <TooltipContent side="top" className="max-w-[220px] flex-col items-start gap-0.5 p-2.5">
          <p className="font-semibold">{asset.symbol}</p>
          <p className="text-background/80">{asset.name[lang]}</p>
          <p className="font-mono tabular-nums">
            {fmt(asset.price)} {asset.currency}
          </p>
          <p className={cn("font-mono tabular-nums", up ? "text-emerald-300" : "text-red-300")}>
            {up ? "+" : ""}
            {asset.changePercent.toFixed(2)}%
          </p>
          <p>
            {t("label.volume")}: {fmt(asset.volume, { notation: "compact" })}
          </p>
          <p>{asset.sector}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
