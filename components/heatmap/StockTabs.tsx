"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fmt } from "@/components/marketwall/shared"
import { useVietnamChart } from "@/hooks/useVietnamChart"
import {
  getAvailableDetailTabs,
  getHistoricalRows,
  getSummaryStatRows,
  hasMetric,
  hasRealFinancials,
  hasRealProfile,
  hasRealShareholders,
  hasText,
  hasVnChartData,
  type DetailTabId,
} from "@/lib/market/asset-detail-availability"
import { useLang } from "@/lib/i18n"
import type { MarketAsset } from "@/types/market"

import { StockChart } from "./StockChart"
import { StockSummaryTable } from "./StockSummaryTable"

type StockTabsProps = {
  asset: MarketAsset
  activeTab: string
  onTabChange: (tab: string) => void
}

const TAB_LABELS: Record<DetailTabId, string> = {
  overview: "heatmapDetail.tab.overview",
  chart: "heatmapDetail.tab.chart",
  profile: "heatmapDetail.tab.profile",
  shareholders: "heatmapDetail.tab.shareholders",
  financials: "heatmapDetail.tab.financials",
  historical: "heatmapDetail.tab.historical",
}

function ChartStatsLayout({
  chart,
  stats,
}: {
  chart: ReactNode
  stats: ReactNode
}) {
  if (chart && stats) {
    return (
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,1fr)] lg:gap-4">
        <div className="min-w-0">{chart}</div>
        <div className="min-w-0">{stats}</div>
      </div>
    )
  }
  if (chart) return <div className="min-w-0">{chart}</div>
  if (stats) return <div className="min-w-0">{stats}</div>
  return null
}

export function StockTabs({ asset, activeTab, onTabChange }: StockTabsProps) {
  const { t, lang } = useLang()
  const isVn = asset.marketType === "vn"
  const vnChart = useVietnamChart(isVn ? asset.symbol : null)

  const [nonVnChartLive, setNonVnChartLive] = useState(false)

  useEffect(() => {
    setNonVnChartLive(false)
  }, [asset.symbol])

  const summaryRows = useMemo(() => getSummaryStatRows(asset, t, fmt), [asset, t])
  const historicalRows = useMemo(
    () => getHistoricalRows(asset, vnChart.data),
    [asset, vnChart.data],
  )

  const hasChart = isVn ? hasVnChartData(vnChart.data) : nonVnChartLive

  const availableTabs = useMemo(
    () =>
      getAvailableDetailTabs(asset, {
        hasChart,
        summaryRows,
        historicalRows,
      }),
    [asset, hasChart, summaryRows, historicalRows],
  )

  useEffect(() => {
    if (!availableTabs.length) return
    if (!availableTabs.includes(activeTab as DetailTabId)) {
      onTabChange(availableTabs[0])
    }
  }, [activeTab, availableTabs, onTabChange])

  const chartProbe = !isVn && !hasChart ? (
    <StockChart
      asset={asset}
      className="hidden"
      onAvailabilityChange={setNonVnChartLive}
    />
  ) : null

  const chartPanel = hasChart ? (
    <StockChart
      asset={asset}
      vnChart={vnChart.data}
      className="min-h-[240px] sm:min-h-[320px]"
      onAvailabilityChange={isVn ? undefined : setNonVnChartLive}
    />
  ) : null

  const statsPanel = (
    <StockSummaryTable asset={asset} omitHeaderFields />
  )

  const financialRows = (
    [
      ["heatmapDetail.revenue", asset.financials.revenue],
      ["heatmapDetail.netIncome", asset.financials.netIncome],
      ["heatmapDetail.totalAssets", asset.financials.totalAssets],
      ["heatmapDetail.totalLiabilities", asset.financials.totalLiabilities],
      ["heatmapDetail.roe", asset.financials.roe],
      ["heatmapDetail.roa", asset.financials.roa],
    ] as const
  ).filter(([key, value]) => {
    if (key.endsWith("roe") || key.endsWith("roa")) {
      return value != null && value !== 0
    }
    return hasMetric(value)
  })

  const profileFields = [
    hasText(asset.sector) && asset.sector.toLowerCase() !== "unknown"
      ? { label: t("heatmapDetail.sector"), value: asset.sector }
      : null,
    hasText(asset.exchange)
      ? { label: t("heatmapDetail.exchange"), value: asset.exchange }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  if (!availableTabs.length) return null

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="flex min-h-0 flex-1 flex-col">
      <TabsList
        variant="line"
        className="w-full shrink-0 justify-start overflow-x-auto rounded-none border-b border-border bg-transparent px-3 sm:px-4"
      >
        {availableTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {t(TAB_LABELS[tab])}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {availableTabs.includes("overview") ? (
          <TabsContent value="overview" className="mt-0 p-3 sm:p-4">
            {chartProbe}
            <ChartStatsLayout chart={chartPanel} stats={statsPanel} />
          </TabsContent>
        ) : null}

        {availableTabs.includes("chart") ? (
          <TabsContent value="chart" className="mt-0 p-3 sm:p-4">
            {chartProbe}
            <ChartStatsLayout
              chart={chartPanel}
              stats={
                <div className="min-w-0 lg:sticky lg:top-0 lg:self-start">{statsPanel}</div>
              }
            />
          </TabsContent>
        ) : null}

        {availableTabs.includes("profile") && hasRealProfile(asset) ? (
          <TabsContent value="profile" className="mt-0 space-y-3 p-3 sm:p-4">
            <p className="text-sm leading-relaxed text-foreground">{asset.profile[lang]}</p>
            {profileFields.length > 0 ? (
              <dl className="grid grid-cols-2 gap-3 text-xs">
                {profileFields.map((field) => (
                  <div key={field.label}>
                    <dt className="text-muted-foreground">{field.label}</dt>
                    <dd className="font-semibold">{field.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </TabsContent>
        ) : null}

        {availableTabs.includes("shareholders") && hasRealShareholders(asset.shareholders) ? (
          <TabsContent value="shareholders" className="mt-0 p-3 sm:p-4">
            <ul className="divide-y divide-border rounded-md border border-border">
              {asset.shareholders.map((row) => (
                <li
                  key={row.name}
                  className="flex items-center justify-between px-3 py-2 text-xs"
                >
                  <span>{row.name}</span>
                  <span className="font-mono tabular-nums">{row.percent.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </TabsContent>
        ) : null}

        {availableTabs.includes("financials") && hasRealFinancials(asset.financials) ? (
          <TabsContent value="financials" className="mt-0 p-3 sm:p-4">
            <div className="rounded-md border border-border">
              {financialRows.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-xs last:border-0"
                >
                  <span className="text-muted-foreground">{t(key)}</span>
                  <span className="font-mono tabular-nums">
                    {key.endsWith("roe") || key.endsWith("roa")
                      ? `${value.toFixed(1)}%`
                      : fmt(value, { notation: "compact" })}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        ) : null}

        {availableTabs.includes("historical") && historicalRows.length > 0 ? (
          <TabsContent value="historical" className="mt-0 p-3 sm:p-4">
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="border-b border-border bg-secondary/30">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("label.time")}</th>
                    <th className="px-3 py-2 font-medium">{t("heatmapDetail.open")}</th>
                    <th className="px-3 py-2 font-medium">{t("label.high")}</th>
                    <th className="px-3 py-2 font-medium">{t("label.low")}</th>
                    <th className="px-3 py-2 font-medium">{t("label.last")}</th>
                    <th className="px-3 py-2 font-medium">{t("label.volume")}</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalRows.map((row) => (
                    <tr key={row.date} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.open)}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.high)}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.low)}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{fmt(row.close)}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">
                        {fmt(row.volume, { notation: "compact" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ) : null}
      </div>
    </Tabs>
  )
}
