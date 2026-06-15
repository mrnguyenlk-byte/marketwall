"use client"

import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/i18n"
import {
  heatmapMarkets,
  type HeatmapMarketId,
  type HeatmapTile,
  type VnExchangeId,
} from "@/lib/market-data"
import { SectionHeading, heatStyle } from "./shared"
import { cn } from "@/lib/utils"

const timeframes = ["1D", "7D", "1M"] as const

function tileSpan(weight: number) {
  if (weight >= 12) return "col-span-5 row-span-5"
  if (weight >= 11) return "col-span-4 row-span-4"
  if (weight >= 10) return "col-span-3 row-span-3"
  if (weight >= 9) return "col-span-3 row-span-2"
  if (weight >= 8) return "col-span-2 row-span-2"
  if (weight >= 7) return "col-span-2 row-span-1"
  if (weight >= 5) return "col-span-1 row-span-2"
  return "col-span-1 row-span-1"
}

function symbolSize(weight: number) {
  if (weight >= 12) return "text-xl sm:text-2xl lg:text-3xl"
  if (weight >= 11) return "text-lg sm:text-xl lg:text-2xl"
  if (weight >= 10) return "text-base sm:text-lg lg:text-xl"
  if (weight >= 8) return "text-sm sm:text-base lg:text-lg"
  if (weight >= 6) return "text-xs sm:text-sm"
  return "text-[10px] sm:text-xs"
}

function changeSize(weight: number) {
  if (weight >= 11) return "text-base sm:text-lg lg:text-xl"
  if (weight >= 9) return "text-sm sm:text-base lg:text-lg"
  if (weight >= 7) return "text-xs sm:text-sm lg:text-base"
  return "text-[10px] sm:text-xs"
}

function HeatGrid({ tiles }: { tiles: HeatmapTile[] }) {
  const { lang } = useLang()

  return (
    <div className="grid h-full grid-flow-dense auto-rows-[minmax(52px,1fr)] grid-cols-6 gap-px bg-[#030508] sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 lg:auto-rows-[minmax(56px,1fr)]">
      {tiles.map((tile) => {
        const up = tile.changePercent >= 0
        const showName = tile.weight >= 7
        return (
          <button
            key={tile.symbol}
            type="button"
            style={heatStyle(tile.changePercent)}
            className={cn(
              "group/tile flex flex-col items-start justify-between rounded-none border border-black/20 p-1.5 text-left transition-[filter,transform] hover:z-10 hover:brightness-110 lg:p-2.5",
              tileSpan(tile.weight),
            )}
            title={`${tile.name[lang]} ${up ? "+" : ""}${tile.changePercent.toFixed(2)}%`}
          >
            <span
              className={cn(
                "truncate font-extrabold leading-none tracking-tight text-white drop-shadow-sm",
                symbolSize(tile.weight),
              )}
            >
              {tile.symbol}
            </span>
            {showName && (
              <span className="hidden truncate text-[10px] leading-tight text-white/75 sm:block lg:text-xs">
                {tile.name[lang]}
              </span>
            )}
            <span
              className={cn(
                "mt-auto font-mono font-bold tabular-nums text-white drop-shadow-sm",
                changeSize(tile.weight),
              )}
            >
              {up ? "+" : ""}
              {tile.changePercent.toFixed(2)}%
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function HeatmapSection() {
  const { t } = useLang()
  const [activeMarket, setActiveMarket] = useState<HeatmapMarketId>("vn")
  const [activeExchange, setActiveExchange] = useState<VnExchangeId>("hose")
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("1D")

  const current = heatmapMarkets.find((m) => m.id === activeMarket)!
  const vnExchanges = current.exchanges ?? []
  const activeTiles =
    activeMarket === "vn"
      ? vnExchanges.find((e) => e.id === activeExchange)?.tiles ?? []
      : current.tiles ?? []

  return (
    <section aria-labelledby="heatmap-title" className="min-w-0">
      <SectionHeading
        title={t("sec.heatmaps")}
        badge={
          <Badge variant="secondary" className="gap-1 text-[10px]">
            {t("label.weighted")}
          </Badge>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card/40 shadow-sm ring-1 ring-border/80">
        <div className="flex flex-col gap-2 border-b border-border bg-gradient-to-r from-card/90 to-card/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Market"
            className="flex flex-wrap items-center gap-1"
          >
            {heatmapMarkets.map((market) => (
              <button
                key={market.id}
                type="button"
                role="tab"
                aria-selected={activeMarket === market.id}
                onClick={() => setActiveMarket(market.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                  activeMarket === market.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span aria-hidden>{market.flag}</span>
                {t(market.labelKey)}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 rounded-md bg-secondary/60 p-0.5 ring-1 ring-border/50">
            {timeframes.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  timeframe === tf
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {activeMarket === "vn" && vnExchanges.length > 0 && (
          <div
            role="tablist"
            aria-label="Exchange"
            className="flex flex-wrap items-center gap-1 border-b border-border bg-card/50 px-3 py-1.5"
          >
            {vnExchanges.map((ex) => (
              <button
                key={ex.id}
                type="button"
                role="tab"
                aria-selected={activeExchange === ex.id}
                onClick={() => setActiveExchange(ex.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors sm:text-xs",
                  activeExchange === ex.id
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {t(ex.labelKey)}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-[400px] bg-[#060a10] p-px sm:min-h-[520px] lg:min-h-[680px]">
          <HeatGrid tiles={activeTiles} />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-card/60 px-3 py-1.5 text-[10px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-none bg-loss" aria-hidden /> -3%
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-none bg-neutral/60" aria-hidden /> 0%
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-none bg-gain" aria-hidden /> +3%
            </span>
          </div>
          <Button
            variant="link"
            size="sm"
            className="ml-auto h-auto shrink-0 gap-0.5 p-0 text-[10px] text-primary"
          >
            {t("action.viewFullHeatmap")}
            <ArrowUpRight className="size-3" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  )
}
