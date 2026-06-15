"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/i18n"
import type { HeatmapMarket, HeatmapMarketId, HeatmapTile, VnExchangeId } from "@/lib/market-data"
import { SectionHeading, fmt, heatStyle } from "./shared"
import { HeatmapGridSkeleton } from "./data-skeletons"
import { cn } from "@/lib/utils"

const timeframes = ["1D", "7D", "1M"] as const
const VN_EXCHANGE_IDS: VnExchangeId[] = ["hose", "hnx", "upcom"]

type CryptoApiResponse = {
  source?: "live" | "mock"
  heatmapTiles?: HeatmapTile[]
}

type VietnamMarketsApiResponse = {
  source?: "live" | "mock"
  heatmapMarket?: HeatmapMarket
}

function cryptoPrice(n: number) {
  if (n >= 1000) return fmt(n)
  if (n >= 1) return fmt(n, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
  if (n >= 0.01) return fmt(n, { maximumFractionDigits: 4, minimumFractionDigits: 2 })
  return fmt(n, { maximumFractionDigits: 6, minimumFractionDigits: 2 })
}

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

function priceSize(weight: number) {
  if (weight >= 12) return "text-sm sm:text-base lg:text-lg"
  if (weight >= 10) return "text-xs sm:text-sm lg:text-base"
  if (weight >= 7) return "text-[10px] sm:text-xs lg:text-sm"
  return "text-[9px] sm:text-[10px]"
}

function HeatGrid({ tiles }: { tiles: HeatmapTile[] }) {
  const { lang } = useLang()

  return (
    <div className="grid h-full grid-flow-dense auto-rows-[minmax(48px,1fr)] grid-cols-6 gap-px bg-heatmap-gap sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
      {tiles.map((tile) => {
        const up = tile.changePercent >= 0
        const isCryptoTile = tile.price != null
        const showName = !isCryptoTile && tile.weight >= 7
        return (
          <button
            key={tile.symbol}
            type="button"
            style={heatStyle(tile.changePercent)}
            className={cn(
              "group/tile flex flex-col items-start justify-between rounded-none border border-black/20 p-1.5 text-left transition-[filter,transform] hover:z-10 hover:brightness-110 lg:p-2.5",
              tileSpan(tile.weight),
            )}
            title={
              isCryptoTile
                ? `${tile.symbol} $${cryptoPrice(tile.price!)} ${up ? "+" : ""}${tile.changePercent.toFixed(2)}%`
                : `${tile.name[lang]} ${up ? "+" : ""}${tile.changePercent.toFixed(2)}%`
            }
          >
            <span
              className={cn(
                "truncate font-extrabold leading-none tracking-tight text-white drop-shadow-sm",
                symbolSize(tile.weight),
              )}
            >
              {tile.symbol}
            </span>
            {isCryptoTile && (
              <span
                className={cn(
                  "truncate font-mono font-semibold tabular-nums text-white/90 drop-shadow-sm",
                  priceSize(tile.weight),
                )}
              >
                ${cryptoPrice(tile.price!)}
              </span>
            )}
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

function filterVnExchanges(market: HeatmapMarket): HeatmapMarket {
  return {
    ...market,
    exchanges: market.exchanges?.filter((ex) => VN_EXCHANGE_IDS.includes(ex.id)) ?? [],
  }
}

export function HeatmapSection({ markets }: { markets: HeatmapMarket[] }) {
  const { t } = useLang()
  const [activeMarket, setActiveMarket] = useState<HeatmapMarketId>("vn")
  const [activeExchange, setActiveExchange] = useState<VnExchangeId>("hose")
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("1D")
  const [cryptoTiles, setCryptoTiles] = useState<HeatmapTile[] | null>(null)
  const [vnMarket, setVnMarket] = useState<HeatmapMarket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadHeatmapData() {
      setLoading(true)
      try {
        const [cryptoRes, vietnamRes] = await Promise.all([
          fetch("/api/crypto", { cache: "no-store" }),
          fetch("/api/vietnam-markets", { cache: "no-store" }),
        ])

        if (!cancelled && cryptoRes.ok) {
          const cryptoData = (await cryptoRes.json()) as CryptoApiResponse
          if (cryptoData.heatmapTiles?.length) {
            setCryptoTiles(cryptoData.heatmapTiles)
          }
        }

        if (!cancelled && vietnamRes.ok) {
          const vietnamData = (await vietnamRes.json()) as VietnamMarketsApiResponse
          if (vietnamData.heatmapMarket?.exchanges?.length) {
            setVnMarket(filterVnExchanges(vietnamData.heatmapMarket))
          }
        }
      } catch {
        // keep SSR fallback tiles
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadHeatmapData()
    return () => {
      cancelled = true
    }
  }, [])

  const resolvedMarkets = markets.map((market) => {
    if (market.id === "vn") {
      return vnMarket ?? filterVnExchanges(market)
    }
    if (market.id === "crypto" && cryptoTiles) {
      return { ...market, tiles: cryptoTiles }
    }
    return market
  })

  const current = resolvedMarkets.find((m) => m.id === activeMarket)!
  const vnExchanges = current.exchanges ?? []
  const activeTiles =
    activeMarket === "vn"
      ? vnExchanges.find((e) => e.id === activeExchange)?.tiles ?? []
      : activeMarket === "crypto" && cryptoTiles
        ? cryptoTiles
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
            {resolvedMarkets.map((market) => (
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
