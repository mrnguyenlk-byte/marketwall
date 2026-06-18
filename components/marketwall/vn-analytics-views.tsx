"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useLang } from "@/lib/i18n"
import type {
  VietnamForeignNetRow,
  VietnamMarketAnalytics,
  VietnamProprietaryNetRow,
} from "@/lib/vietnam/market-analytics"
import { cn } from "@/lib/utils"

import {
  DivergingFlowChart,
  type DivergingFlowRow,
  type DivergingFlowSide,
} from "./diverging-flow-chart"
import { fmt, signClass } from "./shared"
import {
  formatProprietaryBillions,
  valueToBillionVnd,
} from "@/lib/vietnam/proprietary-trading"

export function formatTyVnd(value: number): string {
  const ty = value / 1_000_000_000
  if (Math.abs(ty) >= 1_000) return `${(ty / 1_000).toFixed(2)}T`
  if (Math.abs(ty) >= 1) return `${ty.toFixed(2)} tỷ`
  return `${(ty * 1_000).toFixed(0)} triệu`
}

export function StatCell({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="rounded-md border border-border/60 bg-secondary/15 px-2.5 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-mono text-sm font-semibold tabular-nums", className)}>{value}</p>
    </div>
  )
}

export function EmptyPanel({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border/70 bg-secondary/10 px-3 py-6 text-center text-xs text-muted-foreground">
      {message}
    </p>
  )
}

export function BreadthDonut({
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

export function GtgdStackedBar({
  advancingValue,
  decliningValue,
  unchangedValue,
}: {
  advancingValue: number
  decliningValue: number
  unchangedValue: number
}) {
  const total = advancingValue + decliningValue + unchangedValue || 1
  const segments = [
    { value: advancingValue, color: "bg-gain" },
    { value: decliningValue, color: "bg-loss" },
    { value: unchangedValue, color: "bg-muted-foreground/70" },
  ]

  return (
    <div className="flex h-4 w-full overflow-hidden rounded-sm bg-secondary/40">
      {segments.map((seg, i) =>
        seg.value > 0 ? (
          <div
            key={i}
            className={cn("h-full", seg.color)}
            style={{ width: `${(seg.value / total) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  )
}

export function MoneyFlowBars({
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
        <div key={row.label} className="grid grid-cols-[72px_1fr_72px] items-center gap-2 text-xs">
          <span className="text-muted-foreground">{row.label}</span>
          <div className="h-3 overflow-hidden rounded-sm bg-secondary/40">
            <div
              className={cn("h-full rounded-sm", row.color)}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="text-right font-mono tabular-nums">{formatTyVnd(row.value)}</span>
        </div>
      ))}
    </div>
  )
}

const DIVERGING_FLOW_LIMIT = 10

function foreignRowToSide(row: VietnamForeignNetRow): DivergingFlowSide {
  return {
    symbol: row.symbol,
    sector: row.sector,
    rawValue: Math.abs(row.netValue),
    displayValue: valueToBillionVnd(Math.abs(row.netValue)),
  }
}

function proprietaryNetRowToSide(row: VietnamProprietaryNetRow): DivergingFlowSide {
  return {
    symbol: row.symbol,
    sector: row.sector,
    rawValue: Math.abs(row.netValue),
    displayValue: valueToBillionVnd(Math.abs(row.netValue)),
  }
}

function buildNetDivergingRows<T extends { symbol: string; sector: string; netValue: number }>(
  topNetBuy: T[],
  topNetSell: T[],
  toSide: (row: T) => DivergingFlowSide,
): DivergingFlowRow[] {
  const buy = topNetBuy.slice(0, DIVERGING_FLOW_LIMIT)
  const sell = topNetSell.slice(0, DIVERGING_FLOW_LIMIT)
  const rows: DivergingFlowRow[] = []

  for (let i = 0; i < DIVERGING_FLOW_LIMIT; i++) {
    const buyRow = buy[i]
    const sellRow = sell[i]
    rows.push({
      rank: i + 1,
      buy: buyRow ? toSide(buyRow) : undefined,
      sell: sellRow ? toSide(sellRow) : undefined,
    })
  }

  return rows
}

export type ProprietaryViewMode = "cafef" | "proxy" | "empty"

export type ProprietaryView = {
  mode: ProprietaryViewMode
  buyValue: number
  sellValue: number
  netValue: number
  topNetBuy: VietnamProprietaryNetRow[]
  topNetSell: VietnamProprietaryNetRow[]
  history: VietnamMarketAnalytics["proprietary"]["history"]
}

export function resolveProprietaryView(analytics?: VietnamMarketAnalytics): ProprietaryView {
  const p = analytics?.proprietary
  if (p?.available && (p.buyValue != null || p.sellValue != null)) {
    return {
      mode: "cafef",
      buyValue: p.buyValue ?? 0,
      sellValue: p.sellValue ?? 0,
      netValue: p.netValue ?? 0,
      topNetBuy: p.topNetBuy,
      topNetSell: p.topNetSell,
      history: p.history,
    }
  }

  const b = analytics?.breadth
  if (b?.available) {
    return {
      mode: "proxy",
      buyValue: b.advancingValue,
      sellValue: b.decliningValue,
      netValue: b.advancingValue - b.decliningValue,
      topNetBuy: [],
      topNetSell: [],
      history: [],
    }
  }

  return {
    mode: "empty",
    buyValue: 0,
    sellValue: 0,
    netValue: 0,
    topNetBuy: [],
    topNetSell: [],
    history: [],
  }
}

function ProprietaryNetBars({
  topNetBuy,
  topNetSell,
}: {
  topNetBuy: VietnamProprietaryNetRow[]
  topNetSell: VietnamProprietaryNetRow[]
}) {
  const { t } = useLang()

  if (!topNetBuy.length && !topNetSell.length) return null

  const rows = buildNetDivergingRows(topNetBuy, topNetSell, proprietaryNetRowToSide)
  const formatSide = (side: DivergingFlowSide) => formatProprietaryBillions(side.rawValue)

  return (
    <Card className="gap-0 border-border/80 py-0 shadow-sm">
      <CardHeader className="border-b border-border/60 px-3 py-2">
        <CardTitle className="text-xs font-semibold">
          {t("proprietaryTrading.topNetBuy")} / {t("proprietaryTrading.topNetSell")}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-3">
        <DivergingFlowChart
          rows={rows}
          formatValue={formatSide}
          unitLabel={t("foreignFlow.unitBillionVnd")}
        />
      </CardContent>
    </Card>
  )
}

export function ProprietaryFlowContent({
  analytics,
  loading,
  compact = false,
}: {
  analytics?: VietnamMarketAnalytics
  loading?: boolean
  compact?: boolean
}) {
  const { t } = useLang()
  const view = resolveProprietaryView(analytics)

  if (loading && view.mode === "empty") {
    return <EmptyPanel message={t("heatmapDetail.chartLoading")} />
  }

  if (view.mode === "empty") {
    return <EmptyPanel message={t("vnAnalytics.proprietaryUnavailable")} />
  }

  const badge =
    view.mode === "cafef"
      ? t("proprietaryTrading.cafefSourceBadge")
      : t("proprietaryTrading.gtgdProxyBadge")

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded border px-2 py-0.5 text-[11px] font-medium",
            view.mode === "cafef"
              ? "border-primary/60 bg-primary/15"
              : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          )}
        >
          {badge}
        </span>
        {view.mode === "proxy" && (
          <span className="text-[10px] text-muted-foreground">{t("proprietaryTrading.gtgdProxyNote")}</span>
        )}
      </div>
      <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
        <StatCell
          label={t("proprietaryTrading.buyValue")}
          value={formatTyVnd(view.buyValue)}
          className="text-gain"
        />
        <StatCell
          label={t("proprietaryTrading.sellValue")}
          value={formatTyVnd(view.sellValue)}
          className="text-loss"
        />
        <StatCell
          label={t("proprietaryTrading.netValue")}
          value={formatTyVnd(view.netValue)}
          className={signClass(view.netValue)}
        />
      </div>
      {view.mode === "cafef" && (
        <ProprietaryNetBars topNetBuy={view.topNetBuy} topNetSell={view.topNetSell} />
      )}
      {view.mode === "proxy" && analytics?.liquidity?.topLiquidity?.length ? (
        <p className="text-[10px] text-muted-foreground">{t("domesticFlow.proxyLiquidityHint")}</p>
      ) : null}
    </div>
  )
}

export function BreadthTabContent({
  analytics,
  loading,
}: {
  analytics?: VietnamMarketAnalytics
  loading: boolean
}) {
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
        <StatCell
          label={t("vnAnalytics.advancingValue")}
          value={formatTyVnd(b.advancingValue)}
          className="text-gain"
        />
        <StatCell
          label={t("vnAnalytics.decliningValue")}
          value={formatTyVnd(b.decliningValue)}
          className="text-loss"
        />
        <StatCell label={t("vnAnalytics.unchangedValue")} value={formatTyVnd(b.unchangedValue)} />
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-border/60 bg-card/40 px-3 py-3">
        <BreadthDonut
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

export function ForeignTabContent({
  analytics,
  loading,
}: {
  analytics?: VietnamMarketAnalytics
  loading: boolean
}) {
  const { t } = useLang()
  const f = analytics?.foreignFlow

  if (loading && !f) {
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
        <StatCell
          label={t("vnAnalytics.foreignBuyVal")}
          value={formatTyVnd(f.buyValue)}
          className="text-gain"
        />
        <StatCell
          label={t("vnAnalytics.foreignSellVal")}
          value={formatTyVnd(f.sellValue)}
          className="text-loss"
        />
        <StatCell
          label={t("vnAnalytics.foreignNetVal")}
          value={formatTyVnd(f.netValue)}
          className={signClass(f.netValue)}
        />
        <StatCell
          label={t("vnAnalytics.foreignBuyVol")}
          value={fmt(f.buyVolume, { notation: "compact" })}
          className="text-gain"
        />
        <StatCell
          label={t("vnAnalytics.foreignSellVol")}
          value={fmt(f.sellVolume, { notation: "compact" })}
          className="text-loss"
        />
        <StatCell
          label={t("vnAnalytics.foreignNetVol")}
          value={fmt(f.netVolume, { notation: "compact" })}
          className={signClass(f.netVolume)}
        />
      </div>
      <Card className="gap-0 border-border/80 py-0 shadow-sm">
        <CardHeader className="border-b border-border/60 px-3 py-2">
          <CardTitle className="text-xs font-semibold">{t("vnAnalytics.topNetForeign")}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-3">
          {f.topNetBuy.length || f.topNetSell.length ? (
            <DivergingFlowChart
              rows={buildNetDivergingRows(f.topNetBuy, f.topNetSell, foreignRowToSide)}
              formatValue={(side) => formatProprietaryBillions(side.rawValue)}
              unitLabel={t("foreignFlow.unitBillionVnd")}
            />
          ) : (
            <p className="text-center text-xs text-muted-foreground">{t("vnAnalytics.foreignUnavailable")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function LiquidityTabContent({
  analytics,
  loading,
}: {
  analytics?: VietnamMarketAnalytics
  loading: boolean
}) {
  const { t } = useLang()
  const l = analytics?.liquidity
  const b = analytics?.breadth

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
        <StatCell label={t("vnAnalytics.totalValue")} value={formatTyVnd(l.totalValue)} />
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

      {b?.available ? (
        <div className="space-y-2 rounded-md border border-border/60 bg-card/40 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("vnAnalytics.gtgdBreakdown")}
          </p>
          <GtgdStackedBar
            advancingValue={b.advancingValue}
            decliningValue={b.decliningValue}
            unchangedValue={b.unchangedValue}
          />
          <div className="flex flex-wrap items-center gap-4">
            <BreadthDonut
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
      ) : null}

      {!l.intradayAvailable && (
        <p className="text-[10px] text-muted-foreground">{t("vnAnalytics.intradayUnavailable")}</p>
      )}
    </div>
  )
}
