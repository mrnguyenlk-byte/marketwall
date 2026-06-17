import type {
  FinancialSnapshot,
  HistoricalPriceRow,
  MarketAsset,
  ShareholderRow,
} from "@/types/market"
import type { VnChartResponse } from "@/hooks/useVietnamChart"

/** Positive numeric field with real production value (0 treated as unavailable). */
export function hasMetric(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0
}

export function hasText(value: string | null | undefined): value is string {
  const trimmed = value?.trim()
  return !!trimmed && trimmed !== "N/A" && trimmed !== "—"
}

export function isHeatmapOnlyAsset(asset: MarketAsset): boolean {
  return (
    asset.shareholders.length === 0 &&
    asset.historicalPrices.length === 0 &&
    !hasRealFinancials(asset.financials) &&
    isSyntheticHeatmapOhlc(asset)
  )
}

/** OHLC synthesized in heatmapRowsToMarketAssets when only last price is known. */
export function isSyntheticHeatmapOhlc(asset: MarketAsset): boolean {
  return (
    asset.open === asset.prevClose &&
    asset.high === asset.price &&
    asset.low === asset.price &&
    asset.close === asset.price
  )
}

export function hasRealFinancials(financials: FinancialSnapshot): boolean {
  return (
    hasMetric(financials.revenue) ||
    hasMetric(financials.netIncome) ||
    hasMetric(financials.totalAssets) ||
    hasMetric(financials.totalLiabilities) ||
    (financials.roe != null && financials.roe !== 0) ||
    (financials.roa != null && financials.roa !== 0)
  )
}

export function hasRealShareholders(rows: ShareholderRow[]): boolean {
  return rows.some((row) => hasText(row.name) && row.percent > 0)
}

export function hasRealProfile(asset: MarketAsset): boolean {
  const en = asset.profile.en?.trim() ?? ""
  const vi = asset.profile.vi?.trim() ?? ""
  const candidate = en.length >= vi.length ? en : vi
  if (!hasText(candidate)) return false
  if (candidate === asset.symbol) return false
  if (candidate === asset.name.en || candidate === asset.name.vi) return false
  return candidate.length >= 48
}

export function hasVnChartData(vnChart?: VnChartResponse | null): boolean {
  return (vnChart?.bars?.length ?? 0) > 0 && vnChart?.unavailable !== true
}

export function getHistoricalRows(
  asset: MarketAsset,
  vnChart?: VnChartResponse | null,
): HistoricalPriceRow[] {
  if (asset.marketType === "vn") {
    if (!hasVnChartData(vnChart)) return []
    return (vnChart!.bars ?? [])
      .slice(-30)
      .reverse()
      .map((bar) => ({
        date: bar.time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      }))
  }
  return asset.historicalPrices.filter(
    (row) =>
      hasText(row.date) &&
      hasMetric(row.open) &&
      hasMetric(row.high) &&
      hasMetric(row.low) &&
      hasMetric(row.close),
  )
}

export type SummaryStatRow = { key: string; label: string; value: string }

export function getSummaryStatRows(
  asset: MarketAsset,
  t: (key: string) => string,
  fmt: (n: number, opts?: { notation?: "compact" }) => string,
): SummaryStatRow[] {
  const rows: SummaryStatRow[] = []
  const syntheticOhlc = isSyntheticHeatmapOhlc(asset)

  const push = (key: string, label: string, value: string) => {
    if (hasText(value)) rows.push({ key, label, value })
  }

  push("symbol", t("label.symbol"), asset.symbol)
  push("exchange", t("heatmapDetail.exchange"), asset.exchange)
  push("last", t("label.last"), `${fmt(asset.price)} ${asset.currency}`)
  push(
    "changePct",
    t("label.changePct"),
    `${asset.changePercent >= 0 ? "+" : ""}${asset.changePercent.toFixed(2)}%`,
  )

  if (!syntheticOhlc) {
    if (hasMetric(asset.open)) push("open", t("heatmapDetail.open"), fmt(asset.open))
    if (hasMetric(asset.high)) push("high", t("label.high"), fmt(asset.high))
    if (hasMetric(asset.low)) push("low", t("label.low"), fmt(asset.low))
    if (hasMetric(asset.prevClose)) {
      push("prevClose", t("heatmapDetail.prevClose"), fmt(asset.prevClose))
    }
  }

  if (hasMetric(asset.volume)) {
    push("volume", t("label.volume"), fmt(asset.volume, { notation: "compact" }))
  }
  if (hasMetric(asset.volumeShares) && asset.volumeShares !== asset.volume) {
    push(
      "volumeShares",
      t("vnDashboard.volumeShares"),
      fmt(asset.volumeShares, { notation: "compact" }),
    )
  }
  if (hasMetric(asset.tradingValue)) {
    push(
      "tradingValue",
      t("vnDashboard.tradingValue"),
      fmt(asset.tradingValue, { notation: "compact" }),
    )
  }
  if (hasMetric(asset.marketCap)) {
    push("marketCap", t("label.marketCap"), fmt(asset.marketCap, { notation: "compact" }))
  }
  if (hasText(asset.sector) && asset.sector.toLowerCase() !== "unknown") {
    push("sector", t("heatmapDetail.sector"), asset.sector)
  }
  if (asset.pe != null && asset.pe > 0) {
    push("pe", t("heatmapDetail.pe"), asset.pe.toFixed(2))
  }
  if (asset.eps != null && asset.eps !== 0) {
    push("eps", t("heatmapDetail.eps"), fmt(asset.eps))
  }
  if (asset.dividendYield != null && asset.dividendYield > 0) {
    push("dividendYield", t("heatmapDetail.dividendYield"), `${asset.dividendYield.toFixed(2)}%`)
  }
  if (hasMetric(asset.week52High)) {
    push("week52High", t("heatmapDetail.week52High"), fmt(asset.week52High))
  }
  if (hasMetric(asset.week52Low)) {
    push("week52Low", t("heatmapDetail.week52Low"), fmt(asset.week52Low))
  }
  if (hasMetric(asset.foreignBuy)) {
    push(
      "foreignBuy",
      t("vnAnalytics.foreignBuyVol"),
      fmt(asset.foreignBuy, { notation: "compact" }),
    )
  }
  if (hasMetric(asset.foreignSell)) {
    push(
      "foreignSell",
      t("vnAnalytics.foreignSellVol"),
      fmt(asset.foreignSell, { notation: "compact" }),
    )
  }
  if (asset.foreignNet != null && asset.foreignNet !== 0) {
    push(
      "foreignNet",
      t("vnAnalytics.foreignNetVol"),
      fmt(asset.foreignNet, { notation: "compact" }),
    )
  }

  return rows
}

export type DetailTabId =
  | "overview"
  | "chart"
  | "profile"
  | "shareholders"
  | "financials"
  | "historical"

/** Default tab when opening StockDetailModal from symbol clicks / search. */
export const DEFAULT_SYMBOL_DETAIL_TAB: DetailTabId = "chart"

export function getAvailableDetailTabs(
  asset: MarketAsset,
  options: {
    hasChart: boolean
    summaryRows: SummaryStatRow[]
    historicalRows: HistoricalPriceRow[]
  },
): DetailTabId[] {
  const tabs: DetailTabId[] = []
  const statsBeyondHeader = options.summaryRows.filter(
    (row) => !["symbol", "exchange", "last", "changePct"].includes(row.key),
  )

  if (options.hasChart || statsBeyondHeader.length > 0) {
    tabs.push("overview")
  }
  if (options.hasChart) tabs.push("chart")
  if (hasRealProfile(asset)) tabs.push("profile")
  if (hasRealShareholders(asset.shareholders)) tabs.push("shareholders")
  if (hasRealFinancials(asset.financials)) tabs.push("financials")
  if (options.historicalRows.length > 0) tabs.push("historical")
  return tabs
}
