"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { heatStyle, fmt } from "@/components/marketwall/shared"
import { useLang } from "@/lib/i18n"
import { vnTradingValueMetric } from "@/lib/treemap/heatmap-engine"
import type { TreemapRect } from "@/lib/treemap/squarify"
import type { MarketAsset } from "@/types/market"
import { cn } from "@/lib/utils"

export type TileSize = "large" | "medium" | "small" | "tiny"

const sizeClasses: Record<
  TileSize,
  { grid: string; symbol: string; change: string; price: string }
> = {
  large: {
    grid: "col-span-2 row-span-2",
    symbol: "text-base sm:text-lg lg:text-xl",
    change: "text-xs sm:text-sm lg:text-base",
    price: "text-[10px] sm:text-xs",
  },
  medium: {
    grid: "col-span-2 row-span-1",
    symbol: "text-sm sm:text-base",
    change: "text-[10px] sm:text-xs",
    price: "text-[10px] sm:text-xs",
  },
  small: {
    grid: "col-span-1 row-span-1",
    symbol: "text-[10px] sm:text-xs",
    change: "text-[10px] sm:text-xs",
    price: "text-[9px] sm:text-[10px]",
  },
  tiny: {
    grid: "col-span-1 row-span-1",
    symbol: "text-[9px]",
    change: "text-[9px]",
    price: "text-[9px]",
  },
}

type HeatmapTileProps = {
  asset: MarketAsset
  size: TileSize
  rect?: TreemapRect
  detailedTooltip?: boolean
  onClick: (asset: MarketAsset) => void
}

function TileTooltipContent({
  asset,
  up,
  detailed,
}: {
  asset: MarketAsset
  up: boolean
  detailed: boolean
}) {
  const { lang, t } = useLang()
  const tv = asset.tradingValue ?? vnTradingValueMetric(asset)

  return (
    <>
      <p className="font-semibold">{asset.symbol}</p>
      <p className="text-background/80">{asset.name[lang]}</p>
      <p className="font-mono tabular-nums">
        {fmt(asset.price)} {asset.currency}
      </p>
      <p className={cn("font-mono tabular-nums", up ? "text-emerald-300" : "text-red-300")}>
        {up ? "+" : ""}
        {asset.changePercent.toFixed(2)}%
      </p>
      {detailed ? (
        <>
          <p>
            {t("heatmap.tradingValue")}: {fmt(tv, { notation: "compact" })}
          </p>
          <p>
            {t("label.volume")} (lot): {fmt(asset.volume, { notation: "compact" })}
          </p>
          {"volumeShares" in asset && asset.volumeShares != null ? (
            <p>
              {t("label.volume")} (shares): {fmt(asset.volumeShares, { notation: "compact" })}
            </p>
          ) : null}
          <p>
            {t("heatmap.marketCap")}: {fmt(asset.marketCap, { notation: "compact" })}
          </p>
          {asset.industry ? (
            <p>
              {t("heatmap.industry")}: {asset.industry}
            </p>
          ) : null}
          <p>
            {t("heatmap.sector")}: {asset.sector}
          </p>
        </>
      ) : (
        <>
          <p>
            {t("label.volume")}: {fmt(asset.volume, { notation: "compact" })}
          </p>
          <p>
            {t("heatmap.sector")}: {asset.sector}
          </p>
        </>
      )}
    </>
  )
}

export function HeatmapTile({ asset, size, rect, detailedTooltip = false, onClick }: HeatmapTileProps) {
  const up = asset.changePercent >= 0
  const classes = sizeClasses[size]
  const showChange = size === "large" || size === "medium"
  const showPrice = size === "large"
  const showSymbol = size !== "tiny"

  const tileBody = (
    <>
      {showSymbol && (
        <span
          className={cn(
            "truncate font-extrabold leading-none tracking-tight text-white drop-shadow-sm",
            classes.symbol,
          )}
        >
          {asset.symbol}
        </span>
      )}
      {showChange && (
        <span
          className={cn(
            "mt-auto font-mono font-bold tabular-nums text-white drop-shadow-sm",
            classes.change,
          )}
        >
          {up ? "+" : ""}
          {asset.changePercent.toFixed(2)}%
        </span>
      )}
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
        "group/tile flex flex-col items-start justify-between rounded-none border border-black/20 text-left transition-[filter,transform] hover:z-10 hover:brightness-110",
        size === "tiny" ? "min-h-0 p-0" : "p-0.5 sm:p-1",
        !rect && classes.grid,
      )}
    >
      {tileBody}
    </button>
  )

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger render={tileButton} />
        <TooltipContent side="top" className="max-w-[220px] flex-col items-start gap-0.5 p-2.5">
          <TileTooltipContent asset={asset} up={up} detailed={detailedTooltip} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
