"use client"

import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useVietnamMarkets } from "@/lib/swr/use-market-apis"
import { useLang } from "@/lib/i18n"
import type {
  VietnamForeignNetRow,
  VietnamMarketAnalytics,
} from "@/lib/vietnam/market-analytics"
import { cn } from "@/lib/utils"

import { fmt, SectionHeading, signClass } from "./shared"

type AnalyticsTab = "breadth" | "foreign" | "proprietary" | "liquidity"

const TABS: AnalyticsTab[] = ["breadth", "foreign", "proprietary", "liquidity"]

const TAB_LABEL_KEYS: Record<AnalyticsTab, string> = {
  breadth: "vnAnalytics.tabBreadth",
  foreign: "vnAnalytics.tabForeign",
  proprietary: "vnAnalytics.tabProprietary",
  liquidity: "vnAnalytics.tabLiquidity",
}

function formatCompactVnd(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  return fmt(value, { notation: "compact", maximumFractionDigits: 1 })
}

function StatCell({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-secondary/15 px-2.5 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-mono text-sm font-semibold tabular-nums", className)}>{value}</p>
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border/70 bg-secondary/10 px-3 py-6 text-center text-xs text-muted-foreground">
      {message}
    </p>
  )
}

function BreadthPie({
  advancing,
  declining,
  unchanged,
}: {
  advancing: number
  declining: number
  unchanged: number
}) {
  const total = advancing + declining + unchanged || 1
  const segments = [
    { value: advancing, color: "var(--gain)" },
    { value: declining, color: "var(--loss)" },
    { value: unchanged, color: "var(--muted-foreground)" },
  ]
  const r = 36
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24 shrink-0" aria-hidden>
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
      {segments.map((seg, i) => {
        const len = (seg.value / total) * c
        const dash = `${len} ${c - len}`
        const el = (
          <circle
            key={i}
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform="rotate(-90 48 48)"
          />
        )
        offset += len
        return el
      })}
    </svg>
  )
}

function MoneyFlowBars({
  advancingValue,
  decliningValue,
  unchangedValue,
  labels,
}: {
  advancingValue: number
  decliningValue: number
  unchangedValue: number
  labels: { up: string; down: string; flat: string }
}) {
  const max = Math.max(advancingValue, decliningValue, unchangedValue, 1)
  const rows = [
    { label: labels.up, value: advancingValue, color: "bg-gain" },
    { label: labels.down, value: decliningValue, color: "bg-loss" },
    { label: labels.flat, value: unchangedValue, color: "bg-muted-foreground/70" },
  ]

  return (
    <div className="flex flex-1 flex-col justify-center gap-2">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[72px_1fr_64px] items-center gap-2 text-xs">
          <span className="text-muted-foreground">{row.label}</span>
          <div className="h-3 overflow-hidden rounded-sm bg-secondary/40">
            <div
              className={cn("h-full rounded-sm", row.color)}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="text-right font-mono tabular-nums">{formatCompactVnd(row.value)}</span>
        </div>
      ))}
    </div>
  )
}

function NetForeignDiverging({
  topNetBuy,
  topNetSell,
}: {
  topNetBuy: VietnamForeignNetRow[]
  topNetSell: VietnamForeignNetRow[]
}) {
  const { t } = useLang()
  const limit = 8
  const buy = topNetBuy.slice(0, limit)
  const sell = topNetSell.slice(0, limit)
  const maxMag = Math.max(
    ...buy.map((r) => Math.abs(r.netValue)),
    ...sell.map((r) => Math.abs(r.netValue)),
    1,
  )

  return (
    <div className="space-y-1.5">
      {Array.from({ length: limit }, (_, i) => {
        const buyRow = buy[i]
        const sellRow = sell[i]
        const buyPct = buyRow ? (Math.abs(buyRow.netValue) / maxMag) * 100 : 0
        const sellPct = sellRow ? (Math.abs(sellRow.netValue) / maxMag) * 100 : 0
        return (
          <div key={i} className="grid grid-cols-[1fr_28px_1fr] items-center gap-1 text-[11px]">
            <div className="flex items-center justify-end gap-1">
              {buyRow ? (
                <>
                  <span className="truncate text-gain">{buyRow.symbol}</span>
                  <div className="h-2.5 w-24 overflow-hidden rounded-sm bg-secondary/30">
                    <div className="ml-auto h-full rounded-sm bg-gain" style={{ width: `${buyPct}%` }} />
                  </div>
                </>
              ) : (
                <span className="text-muted-foreground/40">—</span>
              )}
            </div>
            <span className="text-center font-mono text-[10px] text-muted-foreground">{i + 1}</span>
            <div className="flex items-center gap-1">
              {sellRow ? (
                <>
                  <div className="h-2.5 w-24 overflow-hidden rounded-sm bg-secondary/30">
                    <div className="h-full rounded-sm bg-loss" style={{ width: `${sellPct}%` }} />
                  </div>
                  <span className="truncate text-loss">{sellRow.symbol}</span>
                </>
              ) : (
                <span className="text-muted-foreground/40">—</span>
              )}
            </div>
          </div>
        )
      })}
      <div className="flex justify-between pt-1 text-[10px] text-muted-foreground">
        <span>{t("foreignFlow.netBuy")}</span>
        <span>{t("foreignFlow.netSell")}</span>
      </div>
    </div>
  )
}

function BreadthTab({ analytics, loading }: { analytics?: VietnamMarketAnalytics; loading: boolean }) {
  const { t } = useLang()
  const b = analytics?.breadth

  if (loading && !b?.available) {
    return <EmptyPanel message={t("heatmapDetail.chartLoading")} />
  }
  if (!b?.available) {
    return <EmptyPanel message={t("vnAnalytics.breadthUnavailable")} />
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCell label={t("vnAnalytics.advancing")} value={String(b.advancingCount)} className="text-gain" />
        <StatCell label={t("vnAnalytics.declining")} value={String(b.decliningCount)} className="text-loss" />
        <StatCell label={t("vnAnalytics.unchanged")} value={String(b.unchangedCount)} />
        <StatCell label={t("vnAnalytics.advancingValue")} value={formatCompactVnd(b.advancingValue)} className="text-gain" />
        <StatCell label={t("vnAnalytics.decliningValue")} value={formatCompactVnd(b.decliningValue)} className="text-loss" />
        <StatCell label={t("vnAnalytics.unchangedValue")} value={formatCompactVnd(b.unchangedValue)} />
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-border/60 bg-card/40 px-3 py-3">
        <BreadthPie
          advancing={b.advancingCount}
          declining={b.decliningCount}
          unchanged={b.unchangedCount}
        />
        <MoneyFlowBars
          advancingValue={b.advancingValue}
          decliningValue={b.decliningValue}
          unchangedValue={b.unchangedValue}
          labels={{
            up: t("vnAnalytics.advancing"),
            down: t("vnAnalytics.declining"),
            flat: t("vnAnalytics.unchanged"),
          }}
        />
      </div>
    </div>
  )
}

function ForeignTab({ analytics, loading }: { analytics?: VietnamMarketAnalytics; loading: boolean }) {
  const { t } = useLang()
  const f = analytics?.foreignFlow

  if (loading && !f?.available) {
    return <EmptyPanel message={t("heatmapDetail.chartLoading")} />
  }
  if (!f?.available) {
    return <EmptyPanel message={t("vnAnalytics.foreignUnavailable")} />
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-primary/60 bg-primary/15 px-2 py-0.5 text-[11px] font-medium">
          {t("foreignFlow.today")}
        </span>
        {!f.historicalAvailable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="cursor-help text-[10px] text-muted-foreground underline decoration-dotted underline-offset-2">
                    {t("foreignFlow.historicalUnavailable")}
                  </span>
                }
              />
              <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                {t("foreignFlow.historicalUnavailable")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCell label={t("vnAnalytics.foreignBuyVol")} value={fmt(f.buyVolume, { notation: "compact" })} className="text-gain" />
        <StatCell label={t("vnAnalytics.foreignSellVol")} value={fmt(f.sellVolume, { notation: "compact" })} className="text-loss" />
        <StatCell
          label={t("vnAnalytics.foreignNetVol")}
          value={fmt(f.netVolume, { notation: "compact" })}
          className={signClass(f.netVolume)}
        />
        <StatCell label={t("vnAnalytics.foreignBuyVal")} value={formatCompactVnd(f.buyValue)} className="text-gain" />
        <StatCell label={t("vnAnalytics.foreignSellVal")} value={formatCompactVnd(f.sellValue)} className="text-loss" />
        <StatCell
          label={t("vnAnalytics.foreignNetVal")}
          value={formatCompactVnd(f.netValue)}
          className={signClass(f.netValue)}
        />
      </div>
      <Card className="gap-0 border-border/80 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 px-3 py-2">
          <CardTitle className="text-xs font-semibold">{t("vnAnalytics.topNetForeign")}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2.5">
          <NetForeignDiverging topNetBuy={f.topNetBuy} topNetSell={f.topNetSell} />
        </CardContent>
      </Card>
    </div>
  )
}

function ProprietaryTab({ analytics }: { analytics?: VietnamMarketAnalytics }) {
  const { t } = useLang()
  const p = analytics?.proprietary

  if (!p?.available) {
    return <EmptyPanel message={t("vnAnalytics.proprietaryUnavailable")} />
  }

  return null
}

function LiquidityTab({ analytics, loading }: { analytics?: VietnamMarketAnalytics; loading: boolean }) {
  const { t } = useLang()
  const l = analytics?.liquidity

  if (loading && !l?.available) {
    return <EmptyPanel message={t("heatmapDetail.chartLoading")} />
  }
  if (!l?.available) {
    return <EmptyPanel message={t("vnAnalytics.liquidityUnavailable")} />
  }

  const volDelta =
    l.previousSessionVolume != null && l.previousSessionVolume > 0
      ? ((l.totalVolume - l.previousSessionVolume) / l.previousSessionVolume) * 100
      : null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCell label={t("vnAnalytics.totalValue")} value={formatCompactVnd(l.totalValue)} />
        <StatCell label={t("vnAnalytics.totalVolume")} value={fmt(l.totalVolume, { notation: "compact" })} />
        {l.previousSessionVolume != null ? (
          <StatCell
            label={t("vnAnalytics.prevSessionVol")}
            value={fmt(l.previousSessionVolume, { notation: "compact" })}
            className={volDelta != null ? signClass(volDelta) : undefined}
          />
        ) : (
          <StatCell label={t("vnAnalytics.prevSessionVol")} value="—" />
        )}
      </div>
      {!l.intradayAvailable && (
        <p className="text-[10px] text-muted-foreground">{t("vnAnalytics.intradayUnavailable")}</p>
      )}
      <Card className="gap-0 border-border/80 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 px-3 py-2">
          <CardTitle className="text-xs font-semibold">{t("vnAnalytics.topLiquidity")}</CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-xs">
              <thead className="border-b border-border/50 bg-secondary/20 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">{t("label.symbol")}</th>
                  <th className="px-3 py-2 font-medium">{t("label.sector")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("vnAnalytics.totalValue")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("vnAnalytics.totalVolume")}</th>
                </tr>
              </thead>
              <tbody>
                {l.topLiquidity.map((row, i) => (
                  <tr key={row.symbol} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-1.5 font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-1.5 font-semibold">{row.symbol}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{row.sector}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">{formatCompactVnd(row.value)}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                      {fmt(row.volume, { notation: "compact" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function VietnamMarketAnalyticsPanel() {
  const { t } = useLang()
  const { data, isLoading } = useVietnamMarkets()
  const [tab, setTab] = useState<AnalyticsTab>("breadth")
  const analytics = data?.analytics
  const isLive = data?.source === "live"

  const tabContent = useMemo(() => {
    switch (tab) {
      case "breadth":
        return <BreadthTab analytics={analytics} loading={isLoading} />
      case "foreign":
        return <ForeignTab analytics={analytics} loading={isLoading} />
      case "proprietary":
        return <ProprietaryTab analytics={analytics} />
      case "liquidity":
        return <LiquidityTab analytics={analytics} loading={isLoading} />
    }
  }, [tab, analytics, isLoading])

  return (
    <section aria-labelledby="vn-analytics-title">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionHeading id="vn-analytics-title" title={t("sec.vnAnalytics")} />
        <span className="text-[10px] text-muted-foreground">
          {isLive ? t("vnAnalytics.sourceLive") : t("vnAnalytics.sourceMock")}
        </span>
      </div>
      <Card className="gap-0 border-border/80 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  tab === key
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                )}
              >
                {t(TAB_LABEL_KEYS[key])}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-3 py-3">{tabContent}</CardContent>
      </Card>
    </section>
  )
}
