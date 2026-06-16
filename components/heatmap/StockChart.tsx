"use client"

import type { VnChartResponse } from "@/hooks/useVietnamChart"
import { hasVnChartData } from "@/lib/market/asset-detail-availability"
import type { MarketAsset } from "@/types/market"

import { TradingViewChart } from "./TradingViewChart"
import { VietnamNativeChart } from "./VietnamNativeChart"

type StockChartProps = {
  asset: MarketAsset
  className?: string
  vnChart?: VnChartResponse | null
  onAvailabilityChange?: (available: boolean) => void
}

/** Renders a chart only when production data exists; otherwise returns null. */
export function StockChart({
  asset,
  className,
  vnChart,
  onAvailabilityChange,
}: StockChartProps) {
  if (asset.marketType === "vn") {
    if (!hasVnChartData(vnChart)) return null
    return (
      <VietnamNativeChart
        symbol={asset.symbol}
        className={className}
        data={vnChart ?? undefined}
      />
    )
  }

  return (
    <TradingViewChart
      symbol={asset.tradingViewSymbol}
      className={className}
      onAvailabilityChange={onAvailabilityChange}
    />
  )
}
