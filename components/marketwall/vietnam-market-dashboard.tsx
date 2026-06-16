"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useVietnamMarkets } from "@/lib/swr/use-market-apis"
import { useLang } from "@/lib/i18n"
import type { VietnamDashboardRow } from "@/lib/providers/vietnam-market-provider"
import { buildHeatmapSymbolRecords } from "@/lib/symbol-heatmap-registry"
import { cn } from "@/lib/utils"

import { fmt, SectionHeading, signClass } from "./shared"
import { ForeignFlowChart } from "./foreign-flow-chart"
import { ProprietaryTradingChart } from "./proprietary-trading-chart"

type LeaderboardProps = {
  title: string
  rows: VietnamDashboardRow[]
  metric: "volume" | "value"
  loading?: boolean
}

const TABLE_COLS = "1.25rem 2.75rem minmax(2.25rem,1fr) minmax(3.5rem,1fr)"

function formatChangeBadge(changePercent: number | undefined): string {
  if (changePercent == null) return "—"
  const sign = changePercent > 0 ? "+" : ""
  return `${sign}${changePercent.toFixed(2)}%`
}

function tradingValueForRow(row: VietnamDashboardRow): number {
  return row.value ?? 0
}

function volumeForRow(row: VietnamDashboardRow): number {
  return row.volumeShares ?? row.volume ?? 0
}

function ChangeBadge({ value }: { value: number | undefined }) {
  if (value == null) {
    return <span className="font-mono text-[11px] tabular-nums text-muted-foreground">—</span>
  }
  const up = value > 0
  const down = value < 0
  return (
    <span
      className={cn(
        "inline-flex min-w-[2.75rem] justify-end rounded px-1 py-0.5 font-mono text-[10px] font-semibold tabular-nums leading-none sm:text-[11px]",
        up && "bg-gain/15 text-gain",
        down && "bg-loss/15 text-loss",
        !up && !down && "bg-secondary/50 text-muted-foreground",
      )}
    >
      {formatChangeBadge(value)}
    </span>
  )
}

function RowTooltipContent({ row }: { row: VietnamDashboardRow }) {
  const { t } = useLang()
  const vol = volumeForRow(row)
  const tv = tradingValueForRow(row)

  return (
    <>
      <p>
        {t("label.last")}: <span className="font-mono tabular-nums">{fmt(row.price ?? 0)}</span>
      </p>
      <p>
        {t("label.change")}:{" "}
        <span className={cn("font-mono tabular-nums", signClass(row.changePercent ?? 0))}>
          {formatChangeBadge(row.changePercent)}
        </span>
      </p>
      <p>
        {t("vnDashboard.volumeShares")}:{" "}
        <span className="font-mono tabular-nums">{fmt(vol, { notation: "compact" })}</span>
        {row.volumeLot != null ? (
          <span className="text-background/70">
            {" "}
            ({fmt(row.volumeLot, { notation: "compact" })} lot)
          </span>
        ) : null}
      </p>
      <p>
        {t("heatmap.tradingValue")}:{" "}
        <span className="font-mono tabular-nums">{fmt(tv, { notation: "compact" })}</span>
      </p>
    </>
  )
}

function LeaderboardCard({ title, rows, metric, loading }: LeaderboardProps) {
  const { t, lang } = useLang()
  const nameBySymbol = useMemo(() => {
    const map = new Map<string, string>()
    for (const record of buildHeatmapSymbolRecords()) {
      map.set(record.symbol.toUpperCase(), record.name[lang])
    }
    return map
  }, [lang])

  const metricHeader = metric === "volume" ? "KL" : t("vnDashboard.tradingValue")

  return (
    <Card className="gap-0 border-border/80 py-0 shadow-sm">
      <CardHeader className="border-b border-border/60 px-2.5 py-1.5">
        <CardTitle className="text-xs font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {loading && !rows.length ? (
          <p className="px-2.5 py-3 text-[10px] text-muted-foreground">{t("heatmapDetail.chartLoading")}</p>
        ) : (
          <TooltipProvider delay={120}>
            <div className="overflow-x-auto">
              <div
                className="grid min-w-[240px] text-[11px] leading-none sm:text-xs"
                style={{ gridTemplateColumns: TABLE_COLS }}
              >
                <span className="border-b border-border/50 bg-secondary/20 px-1.5 py-1.5 text-center font-medium text-muted-foreground">
                  #
                </span>
                <span className="border-b border-border/50 bg-secondary/20 px-1.5 py-1.5 font-medium text-muted-foreground">
                  {t("label.symbol")}
                </span>
                <span className="border-b border-border/50 bg-secondary/20 px-1.5 py-1.5 text-right font-medium text-muted-foreground">
                  %
                </span>
                <span className="border-b border-border/50 bg-secondary/20 px-1.5 py-1.5 text-right font-medium text-muted-foreground">
                  {metricHeader}
                </span>

                {rows.map((row) => {
                  const companyName = nameBySymbol.get(row.symbol.toUpperCase())
                  return (
                    <Tooltip key={`${title}-${row.rank}-${row.symbol}`}>
                      <TooltipTrigger
                        render={
                          <div
                            role="row"
                            className="contents cursor-default [&>*]:flex [&>*]:h-[28px] [&>*]:items-center [&>*]:border-b [&>*]:border-border/30 [&>*]:transition-colors hover:[&>*]:bg-secondary/25 sm:[&>*]:h-[30px]"
                          >
                            <span className="justify-center px-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                              {row.rank}
                            </span>
                            <span className="whitespace-nowrap px-1.5 font-bold tracking-tight text-foreground">
                              {row.symbol}
                            </span>
                            <span className="justify-end px-1">
                              <ChangeBadge value={row.changePercent} />
                            </span>
                            <span className="justify-end px-1.5 font-mono font-semibold tabular-nums text-foreground">
                              {metric === "volume"
                                ? fmt(volumeForRow(row), { notation: "compact" })
                                : fmt(tradingValueForRow(row), { notation: "compact" })}
                            </span>
                          </div>
                        }
                      />
                      <TooltipContent
                        side="left"
                        className="max-w-[220px] flex-col items-start gap-0.5 p-2 text-xs"
                      >
                        <p className="font-semibold">{row.symbol}</p>
                        {companyName ? (
                          <p className="text-background/80">{companyName}</p>
                        ) : null}
                        <RowTooltipContent row={row} />
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}

export function VietnamMarketDashboard() {
  const { t } = useLang()
  const { data, isLoading } = useVietnamMarkets()
  const dashboard = data?.dashboard
  const isLive = dashboard?.source === "live" || data?.source === "live"

  return (
    <section aria-labelledby="vn-dashboard-title">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <SectionHeading id="vn-dashboard-title" title={t("sec.vnDashboard")} />
        <span className="text-[10px] text-muted-foreground">
          {isLive ? t("vnDashboard.sourceVps") : t("vnDashboard.sourceMock")}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LeaderboardCard
          title={t("vnDashboard.topVolume")}
          rows={dashboard?.topVolume ?? []}
          metric="volume"
          loading={isLoading}
        />
        <LeaderboardCard
          title={t("vnDashboard.topValue")}
          rows={dashboard?.topValue ?? []}
          metric="value"
          loading={isLoading}
        />
        <div className="md:col-span-2">
          <ForeignFlowChart
            buyRows={dashboard?.topForeignBuy ?? []}
            sellRows={dashboard?.topForeignSell ?? []}
            loading={isLoading}
          />
        </div>
        <div className="md:col-span-2">
          <ProprietaryTradingChart proprietary={data?.analytics?.proprietary} loading={isLoading} />
        </div>
      </div>
    </section>
  )
}
