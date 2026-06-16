"use client"

import type { MarketAsset } from "@/types/market"

import { VietnamNativeChart } from "./VietnamNativeChart"
import { TradingViewChart } from "./TradingViewChart"

type StockChartProps = {
  asset: MarketAsset
  className?: string
  /** Pre-fetched VN chart payload (optional — avoids duplicate hook when parent loads data). */
  vnChartData?: Parameters<typeof VietnamNativeChart>[0]["data"]
  vnChartLoading?: boolean
  vnChartError?: boolean
}

/** Route HOSE/HNX/UPCOM to native Lightweight chart; others use TradingView. */
export function StockChart({
  asset,
  className,
  vnChartData,
  vnChartLoading,
  vnChartError,
}: StockChartProps) {
  if (asset.marketType === "vn") {
    return (
      <VietnamNativeChart
        symbol={asset.symbol}
        className={className}
        data={vnChartData}
        isLoading={vnChartLoading}
        hasError={vnChartError}
      />
    )
  }

  return <TradingViewChart symbol={asset.tradingViewSymbol} className={className} />
}
