"use client"

import { useMemo, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MarketHeatmap } from "@/components/heatmap/MarketHeatmap"
import { clientDebug, features } from "@/lib/config/features"
import { useHeatmapDetail } from "@/lib/heatmap-detail-context"
import { useLang } from "@/lib/i18n"
import { getMockHeatmapAssets } from "@/lib/mockHeatmapData"
import { useSymbolDetail } from "@/lib/symbol-detail-context"
import { useMarketsLoading, useVietnamMarkets } from "@/lib/swr/use-market-apis"
import type { HeatmapMarket, HeatmapTile, VnExchangeId } from "@/lib/market-types"
import type { MarketType } from "@/types/market"
import { SectionHeading, heatStyle } from "./shared"
import { HeatmapGridSkeleton } from "./data-skeletons"
import { cn } from "@/lib/utils"

const timeframes = ["1D", "7D", "1M"] as const
const VN_EXCHANGE_IDS: VnExchangeId[] = ["hose", "hnx", "upcom"]

const DETAIL_MARKET_TABS: { id: MarketType; labelKey: string; flag: string }[] = [
  { id: "vn", labelKey: "tab.vnMarket", flag: "🇻🇳" },
  { id: "us", labelKey: "tab.usMarket", flag: "🇺🇸" },
  { id: "crypto", labelKey: "tab.cryptoMarket", flag: "₿" },
]

function tileSpan(weight: number) {
  if (weight >= 12) return "col-span-4 row-span-4"
  if (weight >= 11) return "col-span-3 row-span-3"
  if (weight >= 10) return "col-span-3 row-span-3"
  if (weight >= 9) return "col-span-2 row-span-2"
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
  const { openDetail } = useSymbolDetail()
  const symbolClickEnabled = features.symbolModal

  return (
    <div className="grid h-full grid-flow-dense auto-rows-[minmax(48px,1fr)] grid-cols-6 gap-px bg-heatmap-gap sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
      {tiles.map((tile) => {
        const up = tile.changePercent >= 0
        const showName = tile.weight >= 7
        const className = cn(
          "group/tile flex flex-col items-start justify-between rounded-none border border-black/20 p-1.5 text-left transition-[filter,transform] lg:p-2.5",
          symbolClickEnabled && "hover:z-10 hover:brightness-110",
          tileSpan(tile.weight),
        )
        const content = (
          <>
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
          </>
        )

        if (!symbolClickEnabled) {
          return (
            <div
              key={tile.symbol}
              style={heatStyle(tile.changePercent)}
              className={className}
              title={`${tile.name[lang]} ${up ? "+" : ""}${tile.changePercent.toFixed(2)}%`}
            >
              {content}
            </div>
          )
        }

        return (
          <button
            key={tile.symbol}
            type="button"
            onClick={() => openDetail(tile.symbol)}
            style={heatStyle(tile.changePercent)}
            className={className}
            title={`${tile.name[lang]} ${up ? "+" : ""}${tile.changePercent.toFixed(2)}%`}
          >
            {content}
          </button>
        )
      })}
    </div>
  )
}

function filterVnExchanges(market: HeatmapMarket): HeatmapMarket {
  return {
    ...market,
    exchanges: market.exchanges?.filter((ex) => VN_EXCHANGE_IDS.includes(ex.id)) ?? [],
  }
}

function HeatmapDetailSection() {
  const { t, lang } = useLang()
  const { openAsset } = useHeatmapDetail()
  const [activeMarket, setActiveMarket] = useState<MarketType>("vn")
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("1D")

  const assets = useMemo(
    () => getMockHeatmapAssets(activeMarket),
    [activeMarket],
  )

  const activeTab = DETAIL_MARKET_TABS.find((tab) => tab.id === activeMarket) ?? DETAIL_MARKET_TABS[0]

  return (
    <section aria-labelledby="heatmap-title" className="min-w-0">
      <SectionHeading
        id="heatmap-title"
        title={t("sec.heatmaps")}
        badge={
          <Badge variant="secondary" className="gap-1 text-[10px]">
            {t("label.weighted")}
          </Badge>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card/40 shadow-sm ring-1 ring-border/80">
        <div className="flex flex-col gap-2 border-b border-border bg-gradient-to-r from-card/90 to-card/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span aria-hidden>{activeTab.flag}</span>
            {t(activeTab.labelKey)}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-md bg-secondary/60 p-0.5 ring-1 ring-border/50">
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
            <div className="hidden items-center gap-1 sm:flex">
              {["-3%", "0%", "+3%"].map((label) => (
                <span
                  key={label}
                  className="rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/50"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Market"
          className="flex flex-wrap items-center gap-1 border-b border-border bg-card/50 px-3 py-1.5"
        >
          {DETAIL_MARKET_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeMarket === tab.id}
              onClick={() => setActiveMarket(tab.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors sm:text-xs",
                activeMarket === tab.id
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className="h-[520px] bg-chart-bg p-px">
          <MarketHeatmap
            assets={assets}
            locale={lang}
            marketType={activeMarket}
            onTileClick={(asset) => openAsset(asset.symbol)}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-card/60 px-3 py-2 text-[10px] text-muted-foreground">
          <span>{t("misc.delayed")}</span>
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

export function HeatmapSection({ markets }: { markets: HeatmapMarket[] }) {
  if (features.heatmapDetailModal) {
    return <HeatmapDetailSection />
  }

  return <LegacyHeatmapSection markets={markets} />
}

function LegacyHeatmapSection({ markets }: { markets: HeatmapMarket[] }) {
  const { t } = useLang()
  const [activeExchange, setActiveExchange] = useState<VnExchangeId>("hose")
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("1D")

  const vietnam = useVietnamMarkets()
  const loading = useMarketsLoading(vietnam)

  const vnMarket = useMemo(() => {
    const staticVn = markets.find((m) => m.id === "vn")

    if (!features.liveClientFetch) {
      clientDebug("HeatmapSection", "using static fallback")
      return staticVn ? filterVnExchanges(staticVn) : null
    }

    if (vietnam.data?.heatmapMarket?.exchanges?.length) {
      return filterVnExchanges(vietnam.data.heatmapMarket)
    }

    return staticVn ? filterVnExchanges(staticVn) : null
  }, [markets, vietnam.data])

  if (!vnMarket) {
    return (
      <section aria-labelledby="heatmap-title" className="min-w-0">
        <SectionHeading id="heatmap-title" title={t("sec.vnHeatmap")} />
        <div className="h-[520px] rounded-lg border border-border bg-card/40 p-px">
          <HeatmapGridSkeleton />
        </div>
      </section>
    )
  }

  const vnExchanges = vnMarket.exchanges ?? []
  const activeTiles = vnExchanges.find((e) => e.id === activeExchange)?.tiles ?? []

  return (
    <section aria-labelledby="heatmap-title" className="min-w-0">
      <SectionHeading
        id="heatmap-title"
        title={t("sec.vnHeatmap")}
        badge={
          <Badge variant="secondary" className="gap-1 text-[10px]">
            {t("label.weighted")}
          </Badge>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card/40 shadow-sm ring-1 ring-border/80">
        <div className="flex flex-col gap-2 border-b border-border bg-gradient-to-r from-card/90 to-card/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span aria-hidden>{vnMarket.flag}</span>
            {t(vnMarket.labelKey)}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-md bg-secondary/60 p-0.5 ring-1 ring-border/50">
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
            <div className="hidden items-center gap-1 sm:flex">
              {["-3%", "0%", "+3%"].map((label) => (
                <span
                  key={label}
                  className="rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/50"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {vnExchanges.length > 0 && (
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

        <div className="h-[520px] bg-chart-bg p-px">
          {loading ? <HeatmapGridSkeleton /> : <HeatGrid tiles={activeTiles} />}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-card/60 px-3 py-2 text-[10px] text-muted-foreground">
          <span>{t("misc.delayed")}</span>
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
