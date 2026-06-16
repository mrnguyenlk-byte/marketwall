"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useVietnamMarkets } from "@/lib/swr/use-market-apis"
import { useLang } from "@/lib/i18n"
import type { VietnamDashboardRow } from "@/lib/providers/vietnam-market-provider"

import { ChangePill, fmt, SectionHeading, signClass } from "./shared"

type LeaderboardProps = {
  title: string
  rows: VietnamDashboardRow[]
  metric: "volume" | "value" | "foreignBuy" | "foreignSell"
  loading?: boolean
}

function formatMetric(row: VietnamDashboardRow, metric: LeaderboardProps["metric"]): string {
  switch (metric) {
    case "volume":
      return fmt(row.volume ?? 0, { notation: "compact" })
    case "value":
      return fmt(row.value ?? 0, { notation: "compact" })
    case "foreignBuy":
      return fmt(row.foreignBuy ?? 0, { notation: "compact" })
    case "foreignSell":
      return fmt(row.foreignSell ?? 0, { notation: "compact" })
  }
}

function LeaderboardCard({ title, rows, metric, loading }: LeaderboardProps) {
  const { t } = useLang()

  return (
    <Card className="gap-0 border-border/80 py-0 shadow-sm">
      <CardHeader className="border-b border-border/60 px-3 py-2.5">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {loading && !rows.length ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">{t("heatmapDetail.chartLoading")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[220px] text-left text-xs">
              <thead className="border-b border-border/50 bg-secondary/20 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">{t("label.symbol")}</th>
                  <th className="px-3 py-2 font-medium">{t("label.last")}</th>
                  <th className="px-3 py-2 font-medium text-right">{t("vnDashboard.metric")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${title}-${row.rank}-${row.symbol}`} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2 font-mono text-muted-foreground">{row.rank}</td>
                    <td className="px-3 py-2 font-semibold text-foreground">{row.symbol}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono tabular-nums">{fmt(row.price ?? 0)}</span>
                        {row.changePercent != null ? (
                          <ChangePill value={row.changePercent} className="w-fit px-1 py-0 text-[10px]" />
                        ) : null}
                      </div>
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono font-semibold tabular-nums ${metric === "foreignBuy" ? "text-gain" : metric === "foreignSell" ? "text-loss" : signClass(row.changePercent ?? 0)}`}
                    >
                      {formatMetric(row, metric)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          {isLive ? t("vnDashboard.sourceKbs") : t("vnDashboard.sourceMock")}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
        <LeaderboardCard
          title={t("vnDashboard.topForeignBuy")}
          rows={dashboard?.topForeignBuy ?? []}
          metric="foreignBuy"
          loading={isLoading}
        />
        <LeaderboardCard
          title={t("vnDashboard.topForeignSell")}
          rows={dashboard?.topForeignSell ?? []}
          metric="foreignSell"
          loading={isLoading}
        />
      </div>
    </section>
  )
}
