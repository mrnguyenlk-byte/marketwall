"use client"

import { fmt } from "@/components/marketwall/shared"
import { useLang } from "@/lib/i18n"
import { getSummaryStatRows } from "@/lib/market/asset-detail-availability"
import type { MarketAsset } from "@/types/market"

type StockSummaryTableProps = {
  asset: MarketAsset
  /** Omit header-duplicated fields when stats sit beside the modal header. */
  omitHeaderFields?: boolean
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  )
}

export function StockSummaryTable({ asset, omitHeaderFields = false }: StockSummaryTableProps) {
  const { t } = useLang()

  const rows = getSummaryStatRows(asset, t, fmt).filter((row) => {
    if (!omitHeaderFields) return true
    return !["symbol", "exchange", "last", "changePct"].includes(row.key)
  })

  if (!rows.length) return null

  return (
    <div className="rounded-md border border-border bg-card/40 px-3 py-1">
      {rows.map((row) => (
        <Row key={row.key} label={row.label} value={row.value} />
      ))}
    </div>
  )
}
