"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketHeatmap } from "@/components/heatmap/MarketHeatmap"
import {
  DEFAULT_VN_HEATMAP_MODE,
  type VnHeatmapMode,
} from "@/lib/vietnam/vn-heatmap-modes"
import type {
  CryptoHeatmapSizingMode,
  HeatmapGroupingMode,
  UsHeatmapSizingMode,
} from "@/lib/treemap/heatmap-engine"
import { clientDebug, features } from "@/lib/config/features"
import { useHeatmapDetail } from "@/lib/heatmap-detail-context"
import { useLang } from "@/lib/i18n"
import { heatmapRowsToMarketAssets } from "@/lib/market/heatmap-assets"
import { mergeHeatmapPriceWithRealtime } from "@/lib/realtime/merge-quotes"
import { useRealtime } from "@/lib/realtime/realtime-context"
import { useSymbolDetail } from "@/lib/symbol-detail-context"
import { useHeatmapMarket, useMarketsLoading, useVietnamMarkets } from "@/lib/swr/use-market-apis"
import type { HeatmapMarket, HeatmapTile, VnExchangeId } from "@/lib/market-types"
import type { MarketType } from "@/types/market"
import {
  DashboardCard,
  DashboardCardFooter,
  SectionHeading,
  WidgetHeader,
  heatStyle,
} from "./shared"
import { HeatmapGridSkeleton } from "./data-skeletons"
import { cn } from "@/lib/utils"

const timeframes = ["1D", "7D", "1M"] as const
const VN_EXCHANGE_IDS: VnExchangeId[] = ["hose", "hnx", "upcom"]

const DETAIL_MARKET_TABS: { id: MarketType; labelKey: string; flag: string }[] = [
  { id: "vn", labelKey: "tab.vnMarket", flag: "🇻🇳" },
  { id: "us", labelKey: "tab.usMarket", flag: "🇺🇸" },
  { id: "crypto", labelKey: "tab.cryptoMarket", flag: "₿" },
]

function ControlPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2.5 py-1 text-[11px] font-semibold transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function ControlGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 rounded-md bg-secondary/60 p-0.5 ring-1 ring-border/50">
      {children}
    </div>
  )
}

const HEATMAP_VIEWPORT_CLASS =
  "h-[clamp(480px,50vh,560px)] max-h-[560px] min-h-[480px] min-w-0"

function HeatmapViewport({ children }: { children: ReactNode }) {
  return (
    <div className={cn("min-w-0 overflow-hidden bg-chart-bg p-px", HEATMAP_VIEWPORT_CLASS)}>
      <div className="h-full min-w-0 w-full">{children}</div>
    </div>
  )
}

function tileSpan(weight: number) {
  if (weight >= 12) return "col-span-3 row-span-3"
  if (weight >= 11) return "col-span-2 row-span-2"
  if (weight >= 10) return "col-span-2 row-span-2"
  if (weight >= 9) return "col-span-2 row-span-2"
  if (weight >= 8) return "col-span-2 row-span-1"
  if (weight >= 7) return "col-span-1 row-span-2"
  if (weight >= 5) return "col-span-1 row-span-1"
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

function legacyTileTier(weight: number): "large" | "medium" | "small" | "tiny" {
  if (weight >= 11) return "large"
  if (weight >= 8) return "medium"
  if (weight >= 5) return "small"
  return "tiny"
}

function HeatGrid({ tiles }: { tiles: HeatmapTile[] }) {
  const { lang } = useLang()
  const { openDetail } = useSymbolDetail()
  const symbolClickEnabled = features.symbolModal

  return (
    <div className="grid h-full grid-flow-dense auto-rows-[minmax(36px,1fr)] grid-cols-8 gap-px bg-heatmap-gap sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-[repeat(14,minmax(0,1fr))] xl:grid-cols-[repeat(16,minmax(0,1fr))]">
      {tiles.map((tile) => {
        const up = tile.changePercent >= 0
        const tier = legacyTileTier(tile.weight)
        const showSymbol = tier !== "tiny"
        const showChange = tier === "large" || tier === "medium"
        const showPrice = tier === "large" && tile.price != null && tile.price > 0
        const className = cn(
          "group/tile flex flex-col items-start justify-between rounded-none border border-black/20 text-left transition-[filter,transform]",
          tier === "tiny" ? "min-h-[28px] p-0" : "p-1 sm:p-1.5 lg:p-2",
          symbolClickEnabled && "cursor-pointer",
          tileSpan(tile.weight),
        )
        const content = (
          <>
            {showSymbol && (
              <span
                className={cn(
                  "truncate font-extrabold leading-none tracking-tight text-white drop-shadow-sm",
                  symbolSize(tile.weight),
                )}
              >
                {tile.symbol}
              </span>
            )}
            {showChange && (
              <span
                className={cn(
                  "mt-auto font-mono font-bold tabular-nums text-white drop-shadow-sm",
                  changeSize(tile.weight),
                )}
              >
                {up ? "+" : ""}
                {tile.changePercent.toFixed(2)}%
              </span>
            )}
            {showPrice && (
              <span className="font-mono text-[10px] tabular-nums text-white/85 sm:text-xs">
                {tile.price!.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            )}
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
  const { quoteBySymbol } = useRealtime()
  const [activeMarket, setActiveMarket] = useState<MarketType>("vn")
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("1D")
  const [vnMode, setVnMode] = useState<VnHeatmapMode>(DEFAULT_VN_HEATMAP_MODE)
  const [usGrouping, setUsGrouping] = useState<HeatmapGroupingMode>("sector")
  const [usSizing, setUsSizing] = useState<UsHeatmapSizingMode>("marketCap")
  const [cryptoGrouping, setCryptoGrouping] = useState<HeatmapGroupingMode>("category")
  const [cryptoSizing, setCryptoSizing] = useState<CryptoHeatmapSizingMode>("volume")

  const vnHeatmap = useHeatmapMarket("vn")
  const usHeatmap = useHeatmapMarket("us")
  const cryptoHeatmap = useHeatmapMarket("crypto")

  const activeApi =
    activeMarket === "vn" ? vnHeatmap : activeMarket === "us" ? usHeatmap : cryptoHeatmap

  const loading = features.liveClientFetch && activeApi.isLoading && !activeApi.data

  const assets = useMemo(() => {
    const rows = activeApi.data?.items ?? []
    if (!rows.length) return []

    const base = heatmapRowsToMarketAssets(rows, activeMarket)
    if (activeMarket === "vn") return base

    clientDebug(
      "HeatmapDetailSection",
      activeApi.data?.source === "live" ? "live REST heatmap" : "fallback heatmap",
    )
    return mergeHeatmapPriceWithRealtime(base, quoteBySymbol)
  }, [activeApi.data, activeMarket, quoteBySymbol])

  const activeTab = DETAIL_MARKET_TABS.find((tab) => tab.id === activeMarket) ?? DETAIL_MARKET_TABS[0]

  const activeGrouping =
    activeMarket === "us" ? usGrouping : activeMarket === "crypto" ? cryptoGrouping : "sector"
  const activeSizing = activeMarket === "us" ? usSizing : activeMarket === "crypto" ? cryptoSizing : "volume"

  return (
    <section aria-labelledby="heatmap-title" className="min-w-0">
      <SectionHeading id="heatmap-title" title={t("sec.heatmaps")} />

      <DashboardCard>
        <WidgetHeader
          className="sm:flex-nowrap"
          leading={
            <span className="flex min-w-0 items-center gap-1.5 type-widget-title text-foreground">
              <span aria-hidden>{activeTab.flag}</span>
              {t(activeTab.labelKey)}
            </span>
          }
          action={
            <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            {activeMarket === "vn" && (
              <ControlGroup>
                {(
                  [
                    ["sector-volume", "heatmap.modeSectorVolume"],
                    ["market-cap", "heatmap.modeMarketCap"],
                    ["foreign-flow", "heatmap.modeForeignFlow"],
                    ["proprietary-flow", "heatmap.modeProprietaryFlow"],
                  ] as const
                ).map(([mode, labelKey]) => (
                  <ControlPill
                    key={mode}
                    active={vnMode === mode}
                    onClick={() => setVnMode(mode)}
                  >
                    {t(labelKey)}
                  </ControlPill>
                ))}
              </ControlGroup>
            )}
            {activeMarket === "us" && (
              <>
                <ControlGroup>
                  <ControlPill active={usGrouping === "sector"} onClick={() => setUsGrouping("sector")}>
                    {t("heatmap.groupBySector")}
                  </ControlPill>
                  <ControlPill
                    active={usGrouping === "industry"}
                    onClick={() => setUsGrouping("industry")}
                  >
                    {t("heatmap.groupByIndustry")}
                  </ControlPill>
                  <ControlPill
                    active={usGrouping === "marketCap"}
                    onClick={() => setUsGrouping("marketCap")}
                  >
                    {t("heatmap.groupByMarketCap")}
                  </ControlPill>
                </ControlGroup>
                <ControlGroup>
                  <ControlPill
                    active={usSizing === "marketCap"}
                    onClick={() => setUsSizing("marketCap")}
                  >
                    {t("heatmap.sizeMarketCap")}
                  </ControlPill>
                  <ControlPill
                    active={usSizing === "dollarVolume"}
                    onClick={() => setUsSizing("dollarVolume")}
                  >
                    {t("heatmap.sizeDollarVolume")}
                  </ControlPill>
                </ControlGroup>
              </>
            )}
            {activeMarket === "crypto" && (
              <>
                <ControlGroup>
                  <ControlPill
                    active={cryptoGrouping === "category"}
                    onClick={() => setCryptoGrouping("category")}
                  >
                    {t("heatmap.groupByCategory")}
                  </ControlPill>
                  <ControlPill
                    active={cryptoGrouping === "marketCap"}
                    onClick={() => setCryptoGrouping("marketCap")}
                  >
                    {t("heatmap.groupByMarketCap")}
                  </ControlPill>
                </ControlGroup>
                <ControlGroup>
                  <ControlPill active={cryptoSizing === "volume"} onClick={() => setCryptoSizing("volume")}>
                    {t("heatmap.sizeVolume")}
                  </ControlPill>
                  <ControlPill
                    active={cryptoSizing === "marketCap"}
                    onClick={() => setCryptoSizing("marketCap")}
                  >
                    {t("heatmap.sizeMarketCap")}
                  </ControlPill>
                </ControlGroup>
              </>
            )}
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
          }
        />

        <div
          role="tablist"
          aria-label="Market"
          className="flex min-w-0 flex-wrap items-center gap-1 border-b border-border bg-card/50 px-3 py-1.5"
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

        <HeatmapViewport>
          {loading ? (
            <HeatmapGridSkeleton />
          ) : assets.length > 0 ? (
            <MarketHeatmap
              assets={assets}
              locale={lang}
              marketType={activeMarket}
              groupingMode={activeGrouping}
              sizingMode={activeMarket !== "vn" ? activeSizing : undefined}
              vnMode={activeMarket === "vn" ? vnMode : undefined}
              groupLabel={(key) => t(key)}
              onTileClick={(asset) => openAsset(asset)}
            />
          ) : (
            <HeatmapGridSkeleton />
          )}
        </HeatmapViewport>

        <DashboardCardFooter>
          <span>{t("misc.delayed")}</span>
          <Button
            variant="link"
            size="sm"
            className="ml-auto h-auto shrink-0 gap-0.5 p-0 type-secondary-label text-primary"
          >
            {t("action.viewFullHeatmap")}
            <ArrowUpRight className="size-3" aria-hidden />
          </Button>
        </DashboardCardFooter>
      </DashboardCard>
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
        <div className={cn("min-w-0 overflow-hidden rounded-lg border border-border bg-card/40 p-px", HEATMAP_VIEWPORT_CLASS)}>
          <HeatmapGridSkeleton />
        </div>
      </section>
    )
  }

  const vnExchanges = vnMarket.exchanges ?? []
  const activeTiles = vnExchanges.find((e) => e.id === activeExchange)?.tiles ?? []

  return (
    <section aria-labelledby="heatmap-title" className="min-w-0">
      <SectionHeading id="heatmap-title" title={t("sec.vnHeatmap")} />

      <DashboardCard>
        <WidgetHeader
          leading={
            <span className="flex min-w-0 items-center gap-1.5 type-widget-title text-foreground">
              <span aria-hidden>{vnMarket.flag}</span>
              {t(vnMarket.labelKey)}
            </span>
          }
          action={
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
                    className="rounded px-2 py-0.5 type-secondary-label font-medium text-muted-foreground ring-1 ring-border/50"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          }
        />

        {vnExchanges.length > 0 && (
          <div
            role="tablist"
            aria-label="Exchange"
            className="flex min-w-0 flex-wrap items-center gap-1 border-b border-border bg-card/50 px-3 py-1.5"
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

        <HeatmapViewport>
          {loading ? <HeatmapGridSkeleton /> : <HeatGrid tiles={activeTiles} />}
        </HeatmapViewport>

        <DashboardCardFooter>
          <span>{t("misc.delayed")}</span>
          <Button
            variant="link"
            size="sm"
            className="ml-auto h-auto shrink-0 gap-0.5 p-0 type-secondary-label text-primary"
          >
            {t("action.viewFullHeatmap")}
            <ArrowUpRight className="size-3" aria-hidden />
          </Button>
        </DashboardCardFooter>
      </DashboardCard>
    </section>
  )
}
