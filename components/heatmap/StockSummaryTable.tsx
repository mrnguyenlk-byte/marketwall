"use client"

import { fmt } from "@/components/marketwall/shared"
import { useLang } from "@/lib/i18n"
import type { MarketAsset } from "@/types/market"

type StockSummaryTableProps = {
  asset: MarketAsset
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  )
}

export function StockSummaryTable({ asset }: StockSummaryTableProps) {
  const { t } = useLang()

  const optionalRows: Array<{ label: string; value: string }> = []
  if (asset.pe != null) {
    optionalRows.push({ label: t("heatmapDetail.pe"), value: asset.pe.toFixed(2) })
  }
  if (asset.eps != null) {
    optionalRows.push({ label: t("heatmapDetail.eps"), value: fmt(asset.eps) })
  }
  if (asset.dividendYield != null) {
    optionalRows.push({
      label: t("heatmapDetail.dividendYield"),
      value: `${asset.dividendYield.toFixed(2)}%`,
    })
  }
  if (asset.week52High != null) {
    optionalRows.push({
      label: t("heatmapDetail.week52High"),
      value: fmt(asset.week52High),
    })
  }
  if (asset.week52Low != null) {
    optionalRows.push({
      label: t("heatmapDetail.week52Low"),
      value: fmt(asset.week52Low),
    })
  }

  return (
    <div className="rounded-md border border-border bg-card/40 px-3 py-1">
      <Row label={t("label.symbol")} value={asset.symbol} />
      <Row label={t("heatmapDetail.exchange")} value={asset.exchange} />
      <Row label={t("label.last")} value={`${fmt(asset.price)} ${asset.currency}`} />
      <Row
        label={t("label.changePct")}
        value={`${asset.changePercent >= 0 ? "+" : ""}${asset.changePercent.toFixed(2)}%`}
      />
      <Row label={t("heatmapDetail.open")} value={fmt(asset.open)} />
      <Row label={t("label.high")} value={fmt(asset.high)} />
      <Row label={t("label.low")} value={fmt(asset.low)} />
      <Row label={t("heatmapDetail.prevClose")} value={fmt(asset.prevClose)} />
      <Row
        label={t("label.volume")}
        value={fmt(asset.volume, { notation: "compact" })}
      />
      <Row
        label={t("label.marketCap")}
        value={fmt(asset.marketCap, { notation: "compact" })}
      />
      <Row label={t("heatmapDetail.sector")} value={asset.sector} />
      {optionalRows.map((row) => (
        <Row key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  )
}
