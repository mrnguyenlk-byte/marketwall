"use client"

import { useMemo, useState } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useLang } from "@/lib/i18n"
import {
  buildDivergingRows,
  maxDisplayMagnitude,
  type ForeignFlowDisplayMode,
  type ForeignFlowSide,
} from "@/lib/vietnam/foreign-flow"
import { sectorForSymbol } from "@/lib/vietnam/symbol-sectors"
import type { VietnamDashboardRow } from "@/lib/providers/vietnam-market-provider"
import { cn } from "@/lib/utils"

import { fmt, DashboardCard, WidgetHeader, DashboardCardBody } from "./shared"

type ForeignFlowChartProps = {
  buyRows: VietnamDashboardRow[]
  sellRows: VietnamDashboardRow[]
  loading?: boolean
}

function valueToBillion(valueVnd: number): number {
  return valueVnd / 1_000_000_000
}

function formatDisplay(value: number, mode: ForeignFlowDisplayMode): string {
  if (mode === "value") {
    if (value >= 100) return `${value.toFixed(1)}B`
    if (value >= 1) return `${value.toFixed(2)}B`
    return `${(value * 1000).toFixed(0)}M`
  }
  return fmt(value, { notation: "compact", maximumFractionDigits: 1 })
}

function FlowTooltip({
  side,
  mode,
}: {
  side: ForeignFlowSide
  mode: ForeignFlowDisplayMode
}) {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <p className="font-semibold">{side.symbol}</p>
      <p>
        {t("foreignFlow.value")}: {formatDisplay(valueToBillion(side.valueVnd), "value")} VND
      </p>
      <p>
        {t("foreignFlow.volume")}: {fmt(side.shares, { notation: "compact" })}
      </p>
      <p>
        {t("label.sector")}: {side.sector}
      </p>
      {mode === "value" && (
        <p className="text-background/70">
          {fmt(side.price)} × {fmt(side.shares, { notation: "compact" })}
        </p>
      )}
    </div>
  )
}

function FlowBar({
  side,
  direction,
  widthPct,
  mode,
}: {
  side: ForeignFlowSide
  direction: "buy" | "sell"
  widthPct: number
  mode: ForeignFlowDisplayMode
}) {
  const isBuy = direction === "buy"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              "group relative flex h-7 min-w-[2rem] items-center rounded-sm px-1 transition-opacity hover:opacity-90 sm:h-8",
              isBuy ? "justify-start bg-gain/85" : "justify-end bg-loss/85",
            )}
            style={{ width: `${Math.max(widthPct, 6)}%` }}
            aria-label={`${side.symbol} ${formatDisplay(side.displayValue, mode)}`}
          />
        }
      />
      <TooltipContent side="top" className="p-2.5">
        <FlowTooltip side={side} mode={mode} />
      </TooltipContent>
    </Tooltip>
  )
}

export function ForeignFlowChart({ buyRows, sellRows, loading }: ForeignFlowChartProps) {
  const { t } = useLang()
  const [mode, setMode] = useState<ForeignFlowDisplayMode>("value")

  const rows = useMemo(
    () => buildDivergingRows(buyRows, sellRows, "1d", mode, sectorForSymbol),
    [buyRows, sellRows, mode],
  )

  const maxMag = useMemo(() => maxDisplayMagnitude(rows), [rows])

  return (
    <DashboardCard className="md:col-span-2 ring-0">
      <WidgetHeader
        title={t("foreignFlow.title")}
        badge={
          <span className="rounded border border-border/60 bg-secondary/40 px-2 py-0.5 type-secondary-label font-semibold uppercase text-foreground">
            {t("foreignFlow.today")}
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-md bg-secondary/60 p-0.5 ring-1 ring-border/50">
              <button
                type="button"
                onClick={() => setMode("value")}
                className={cn(
                  "rounded px-2 py-1 type-secondary-label font-semibold transition-colors",
                  mode === "value"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("foreignFlow.modeValue")}
              </button>
              <button
                type="button"
                onClick={() => setMode("volume")}
                className={cn(
                  "rounded px-2 py-1 type-secondary-label font-semibold transition-colors",
                  mode === "volume"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("foreignFlow.modeVolume")}
              </button>
            </div>
          </div>
        }
      />
      <DashboardCardBody className="px-3 py-3">
        {loading && !buyRows.length && !sellRows.length ? (
          <p className="text-xs text-muted-foreground">{t("heatmapDetail.chartLoading")}</p>
        ) : (
          <TooltipProvider delay={120}>
            <div className="relative">
              <div className="mb-2 flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <span>{t("foreignFlow.netSell")}</span>
                <span>{t("foreignFlow.netBuy")}</span>
              </div>

              <div
                className="pointer-events-none absolute bottom-0 left-1/2 top-6 z-10 w-px -translate-x-1/2 bg-border"
                aria-hidden
              />

              <div className="space-y-1.5">
                {rows.map((row) => (
                  <div
                    key={`foreign-flow-${row.rank}`}
                    className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
                  >
                    <div className="flex items-center justify-end gap-2">
                      {row.sell ? (
                        <>
                          <span className="hidden font-mono text-[10px] tabular-nums text-loss sm:inline">
                            {formatDisplay(row.sell.displayValue, mode)}
                          </span>
                          <FlowBar
                            side={row.sell}
                            direction="sell"
                            widthPct={(row.sell.displayValue / maxMag) * 100}
                            mode={mode}
                          />
                          <span className="w-10 shrink-0 text-right text-[10px] font-semibold text-foreground sm:w-11">
                            {row.sell.symbol}
                          </span>
                        </>
                      ) : (
                        <span className="h-7 sm:h-8" />
                      )}
                    </div>

                    <span className="w-5 text-center font-mono text-[9px] text-muted-foreground">
                      {row.rank}
                    </span>

                    <div className="flex items-center gap-2">
                      {row.buy ? (
                        <>
                          <span className="w-10 shrink-0 text-[10px] font-semibold text-foreground sm:w-11">
                            {row.buy.symbol}
                          </span>
                          <FlowBar
                            side={row.buy}
                            direction="buy"
                            widthPct={(row.buy.displayValue / maxMag) * 100}
                            mode={mode}
                          />
                          <span className="hidden font-mono text-[10px] tabular-nums text-gain sm:inline">
                            {formatDisplay(row.buy.displayValue, mode)}
                          </span>
                        </>
                      ) : (
                        <span className="h-7 sm:h-8" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                {mode === "value" ? t("foreignFlow.unitBillionVnd") : t("foreignFlow.unitShares")}
              </p>
            </div>
          </TooltipProvider>
        )}
      </DashboardCardBody>
    </DashboardCard>
  )
}
