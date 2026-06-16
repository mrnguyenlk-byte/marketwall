"use client"

import { useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useLang } from "@/lib/i18n"
import type { VietnamMarketAnalytics } from "@/lib/vietnam/market-analytics"
import {
  formatHistoryLabel,
  formatProprietaryBillions,
  maxHistoryNetMagnitude,
  maxTopNetMagnitude,
  valueToBillionVnd,
} from "@/lib/vietnam/proprietary-trading"
import { cn } from "@/lib/utils"

import { signClass } from "./shared"

type ProprietaryTradingChartProps = {
  proprietary?: VietnamMarketAnalytics["proprietary"]
  loading?: boolean
}

function SummaryCell({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="rounded-md border border-border/60 bg-secondary/20 px-2.5 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-mono text-sm font-semibold tabular-nums", className)}>{value}</p>
    </div>
  )
}

function HistoryBar({
  date,
  netValue,
  maxMag,
}: {
  date: string
  netValue: number
  maxMag: number
}) {
  const { t } = useLang()
  const netB = valueToBillionVnd(netValue)
  const heightPct = (Math.abs(netB) / maxMag) * 100
  const isBuy = netValue >= 0

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="flex h-28 flex-1 flex-col items-center justify-end gap-1">
            <div className="relative flex h-24 w-full items-center justify-center">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              {netValue !== 0 ? (
                <div
                  className={cn(
                    "absolute left-1/2 w-[72%] max-w-8 -translate-x-1/2 rounded-sm",
                    isBuy ? "bottom-1/2 bg-gain/85" : "top-1/2 bg-loss/85",
                  )}
                  style={{ height: `${Math.max(heightPct, 8)}%` }}
                />
              ) : null}
            </div>
            <span className="text-[9px] font-medium text-muted-foreground">
              {formatHistoryLabel(date)}
            </span>
          </div>
        }
      />
      <TooltipContent side="top" className="p-2.5 text-xs">
        <p className="font-semibold">{date}</p>
        <p>
          {t("proprietaryTrading.netValue")}: {formatProprietaryBillions(netValue)} VND
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

function TopNetRow({
  row,
  direction,
  maxMag,
}: {
  row: VietnamMarketAnalytics["proprietary"]["topNetBuy"][number]
  direction: "buy" | "sell"
  maxMag: number
}) {
  const netB = valueToBillionVnd(row.netValue)
  const widthPct = (Math.abs(netB) / maxMag) * 100
  const isBuy = direction === "buy"

  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-10 shrink-0 font-semibold">{row.symbol}</span>
      <div className="relative h-5 flex-1 rounded-sm bg-secondary/30">
        <div
          className={cn(
            "absolute top-0 h-full rounded-sm",
            isBuy ? "left-1/2 bg-gain/85" : "right-1/2 bg-loss/85",
          )}
          style={{ width: `${Math.max(widthPct, 6)}%` }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" />
      </div>
      <span className={cn("w-14 shrink-0 text-right font-mono tabular-nums", signClass(row.netValue))}>
        {formatProprietaryBillions(row.netValue)}
      </span>
    </div>
  )
}

export function ProprietaryTradingChart({ proprietary, loading }: ProprietaryTradingChartProps) {
  const { t } = useLang()

  const historyMax = useMemo(
    () => maxHistoryNetMagnitude(proprietary?.history ?? []),
    [proprietary?.history],
  )
  const topMax = useMemo(() => {
    const rows = [...(proprietary?.topNetBuy ?? []), ...(proprietary?.topNetSell ?? [])]
    return maxTopNetMagnitude(rows)
  }, [proprietary?.topNetBuy, proprietary?.topNetSell])

  const showHistory = (proprietary?.history.length ?? 0) > 1

  return (
    <Card className="gap-0 border-border/80 py-0 shadow-sm md:col-span-2">
      <CardHeader className="flex flex-col gap-2 border-b border-border/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold">{t("proprietaryTrading.title")}</CardTitle>
          <span className="rounded border border-border/60 bg-secondary/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-foreground">
            {showHistory ? t("proprietaryTrading.rangeSessions") : t("proprietaryTrading.rangeToday")}
          </span>
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
            {t("proprietaryTrading.eodLabel")}
          </span>
        </div>
        {proprietary?.source ? (
          <span className="text-[10px] text-muted-foreground">
            {t("proprietaryTrading.source")}: {proprietary.source}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="px-3 py-3">
        {loading && !proprietary?.available ? (
          <p className="text-xs text-muted-foreground">{t("heatmapDetail.chartLoading")}</p>
        ) : !proprietary?.available ? (
          <p className="rounded-md border border-dashed border-border/70 bg-secondary/15 px-3 py-6 text-center text-xs text-muted-foreground">
            {t("proprietaryTrading.unavailable")}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <SummaryCell
                label={t("proprietaryTrading.buyValue")}
                value={formatProprietaryBillions(proprietary.buyValue ?? 0)}
                className="text-gain"
              />
              <SummaryCell
                label={t("proprietaryTrading.sellValue")}
                value={formatProprietaryBillions(proprietary.sellValue ?? 0)}
                className="text-loss"
              />
              <SummaryCell
                label={t("proprietaryTrading.netValue")}
                value={formatProprietaryBillions(proprietary.netValue ?? 0)}
                className={signClass(proprietary.netValue ?? 0)}
              />
            </div>

            {(proprietary.history.length > 0 || proprietary.topNetBuy.length > 0) && (
              <TooltipProvider delay={120}>
                <div className="relative">
                  <div className="mb-2 flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <span>{t("proprietaryTrading.netSell")}</span>
                    <span>{t("proprietaryTrading.netBuy")}</span>
                  </div>

                  {proprietary.history.length > 0 ? (
                    <div className="flex items-end gap-1 sm:gap-1.5">
                      {proprietary.history.map((point) => (
                        <HistoryBar
                          key={point.date}
                          date={point.date}
                          netValue={point.netValue}
                          maxMag={historyMax}
                        />
                      ))}
                    </div>
                  ) : null}

                  <p className="mt-3 text-center text-[10px] text-muted-foreground">
                    {t("proprietaryTrading.unitBillionVnd")}
                  </p>
                </div>
              </TooltipProvider>
            )}

            {(proprietary.topNetBuy.length > 0 || proprietary.topNetSell.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase text-gain">
                    {t("proprietaryTrading.topNetBuy")}
                  </p>
                  <div className="space-y-1">
                    {proprietary.topNetBuy.map((row) => (
                      <TopNetRow key={`buy-${row.symbol}`} row={row} direction="buy" maxMag={topMax} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase text-loss">
                    {t("proprietaryTrading.topNetSell")}
                  </p>
                  <div className="space-y-1">
                    {proprietary.topNetSell.map((row) => (
                      <TopNetRow key={`sell-${row.symbol}`} row={row} direction="sell" maxMag={topMax} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
