"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLang } from "@/lib/i18n"
import type { MarketAsset } from "@/types/market"
import { fmt } from "@/components/marketwall/shared"

import { StockSummaryTable } from "./StockSummaryTable"
import { TradingViewChart } from "./TradingViewChart"

type StockTabsProps = {
  asset: MarketAsset
  activeTab: string
  onTabChange: (tab: string) => void
}

export function StockTabs({ asset, activeTab, onTabChange }: StockTabsProps) {
  const { t, lang } = useLang()

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="flex min-h-0 flex-1 flex-col">
      <TabsList
        variant="line"
        className="w-full shrink-0 justify-start overflow-x-auto rounded-none border-b border-border bg-transparent px-3 sm:px-4"
      >
        <TabsTrigger value="overview">{t("heatmapDetail.tab.overview")}</TabsTrigger>
        <TabsTrigger value="chart">{t("heatmapDetail.tab.chart")}</TabsTrigger>
        <TabsTrigger value="profile">{t("heatmapDetail.tab.profile")}</TabsTrigger>
        <TabsTrigger value="shareholders">{t("heatmapDetail.tab.shareholders")}</TabsTrigger>
        <TabsTrigger value="dividends">{t("heatmapDetail.tab.dividends")}</TabsTrigger>
        <TabsTrigger value="financials">{t("heatmapDetail.tab.financials")}</TabsTrigger>
        <TabsTrigger value="historical">{t("heatmapDetail.tab.historical")}</TabsTrigger>
      </TabsList>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <TradingViewChart symbol={asset.tradingViewSymbol} />
            <StockSummaryTable asset={asset} />
          </div>
        </TabsContent>

        <TabsContent value="chart" className="mt-0">
          <TradingViewChart symbol={asset.tradingViewSymbol} className="min-h-[360px]" />
          <p className="mt-2 text-[11px] text-muted-foreground">{t("misc.delayed")}</p>
        </TabsContent>

        <TabsContent value="profile" className="mt-0 space-y-3">
          <p className="text-sm leading-relaxed text-foreground">{asset.profile[lang]}</p>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">{t("heatmapDetail.sector")}</dt>
              <dd className="font-semibold">{asset.sector}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("heatmapDetail.exchange")}</dt>
              <dd className="font-semibold">{asset.exchange}</dd>
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="shareholders" className="mt-0">
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

        <TabsContent value="dividends" className="mt-0">
          {asset.dividends.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("heatmapDetail.noDividends")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {asset.dividends.map((row) => (
                <li
                  key={row.date}
                  className="flex items-center justify-between px-3 py-2 text-xs"
                >
                  <span>{row.date}</span>
                  <span className="font-mono tabular-nums">
                    {fmt(row.amount)} {asset.currency}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="financials" className="mt-0">
          <div className="rounded-md border border-border">
            {(
              [
                ["heatmapDetail.revenue", asset.financials.revenue],
                ["heatmapDetail.netIncome", asset.financials.netIncome],
                ["heatmapDetail.totalAssets", asset.financials.totalAssets],
                ["heatmapDetail.totalLiabilities", asset.financials.totalLiabilities],
                ["heatmapDetail.roe", asset.financials.roe],
                ["heatmapDetail.roa", asset.financials.roa],
              ] as const
            ).map(([key, value]) => (
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

        <TabsContent value="historical" className="mt-0">
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
                {asset.historicalPrices.map((row) => (
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
      </div>
    </Tabs>
  )
}
