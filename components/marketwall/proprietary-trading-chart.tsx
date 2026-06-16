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
import type { VietnamMarketAnalytics, VietnamProprietaryNetRow } from "@/lib/vietnam/market-analytics"
import {
  formatHistoryLabel,
  formatProprietaryBillions,
  maxHistoryNetMagnitude,
  valueToBillionVnd,
} from "@/lib/vietnam/proprietary-trading"
import { cn } from "@/lib/utils"

type ProprietaryTradingChartProps = {
  proprietary?: VietnamMarketAnalytics["proprietary"]
  loading?: boolean
}

type ProprietaryFlowSide = {
  symbol: string
  sector: string
  displayValue: number
  rawValue: number
}

type ProprietaryFlowRow = {
  rank: number
  buy?: ProprietaryFlowSide
  sell?: ProprietaryFlowSide
}

function rowToSide(
  row: VietnamProprietaryNetRow,
  field: "buyValue" | "sellValue",
): ProprietaryFlowSide | undefined {
  const rawValue = row[field]
  if (rawValue <= 0) return undefined
  return {
    symbol: row.symbol,
    sector: row.sector,
    rawValue,
    displayValue: valueToBillionVnd(rawValue),
  }
}

function buildProprietaryDivergingRows(
  topBuy: VietnamProprietaryNetRow[],
  topSell: VietnamProprietaryNetRow[],
  limit = 10,
): ProprietaryFlowRow[] {
  const rows: ProprietaryFlowRow[] = []
  for (let i = 0; i < limit; i++) {
    const buyRow = topBuy[i]
    const sellRow = topSell[i]
    if (!buyRow && !sellRow) continue
    rows.push({
      rank: i + 1,
      buy: buyRow ? rowToSide(buyRow, "buyValue") : undefined,
      sell: sellRow ? rowToSide(sellRow, "sellValue") : undefined,
    })
  }
  return rows
}

function maxDisplayMagnitude(rows: ProprietaryFlowRow[]): number {
  let max = 0.01
  for (const row of rows) {
    if (row.buy) max = Math.max(max, row.buy.displayValue)
    if (row.sell) max = Math.max(max, row.sell.displayValue)
  }
  return max
}

function FlowBar({
  side,
  direction,
  widthPct,
}: {
  side: ProprietaryFlowSide
  direction: "buy" | "sell"
  widthPct: number
}) {
  const isBuy = direction === "buy"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              "group relative flex h-7 min-w-[2rem] items-center rounded-sm px-1 transition-opacity sm:h-8",
              isBuy ? "justify-start bg-gain/85" : "justify-end bg-loss/85",
            )}
            style={{ width: `${Math.max(widthPct, 6)}%` }}
            aria-label={`${side.symbol} ${formatProprietaryBillions(side.rawValue)}`}
          />
        }
      />
      <TooltipContent side="top" className="p-2.5 text-xs">
        <p className="font-semibold">{side.symbol}</p>
        <p>{formatProprietaryBillions(side.rawValue)} VND</p>
        <p className="text-background/70">{side.sector}</p>
      </TooltipContent>
    </Tooltip>
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
  const widthPct = (Math.abs(netB) / maxMag) * 100
  const isBuy = netValue >= 0

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex h-7 w-full items-center justify-center sm:h-8">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              {netValue !== 0 ? (
                <div
                  className={cn(
                    "absolute h-full max-w-full rounded-sm",
                    isBuy ? "left-1/2 bg-gain/85" : "right-1/2 bg-loss/85",
                  )}
                  style={{ width: `${Math.max(widthPct / 2, 4)}%` }}
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

export function ProprietaryTradingChart({ proprietary, loading }: ProprietaryTradingChartProps) {
  const { t } = useLang()

  const rows = useMemo(
    () => buildProprietaryDivergingRows(proprietary?.topBuy ?? [], proprietary?.topSell ?? []),
    [proprietary?.topBuy, proprietary?.topSell],
  )
  const maxMag = useMemo(() => maxDisplayMagnitude(rows), [rows])
  const historyMax = useMemo(
    () => maxHistoryNetMagnitude(proprietary?.history ?? []),
    [proprietary?.history],
  )

  return (
    <Card className="gap-0 border-border/80 py-0 shadow-sm md:col-span-2">
      <CardHeader className="flex flex-col gap-2 border-b border-border/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-sm font-semibold">{t("proprietaryTrading.title")}</CardTitle>
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
          <TooltipProvider delay={175}>
            <div className="space-y-4">
              {rows.length > 0 ? (
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
                        key={`prop-flow-${row.rank}`}
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
                      >
                        <div className="flex items-center justify-end gap-2">
                          {row.sell ? (
                            <>
                              <span className="hidden font-mono text-[10px] tabular-nums text-loss sm:inline">
                                {formatProprietaryBillions(row.sell.rawValue)}
                              </span>
                              <FlowBar
                                side={row.sell}
                                direction="sell"
                                widthPct={(row.sell.displayValue / maxMag) * 100}
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
                              />
                              <span className="hidden font-mono text-[10px] tabular-nums text-gain sm:inline">
                                {formatProprietaryBillions(row.buy.rawValue)}
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
                    {t("foreignFlow.unitBillionVnd")}
                  </p>
                </div>
              ) : null}

              {proprietary.history.length > 0 ? (
                <div className="relative border-t border-border/50 pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("proprietaryTrading.netBuyChart")}
                  </p>
                  <div className="mb-2 flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    <span>{t("proprietaryTrading.netSell")}</span>
                    <span>{t("proprietaryTrading.netBuy")}</span>
                  </div>
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
                  <p className="mt-3 text-center text-[10px] text-muted-foreground">
                    {t("proprietaryTrading.unitBillionVnd")}
                  </p>
                </div>
              ) : null}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
