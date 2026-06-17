"use client"

import { useMemo } from "react"

import { FinvizTreemap } from "@/components/heatmap/FinvizTreemap"
import { VietnamFlatTreemap } from "@/components/heatmap/VietnamFlatTreemap"
import { VietnamSectorGridHeatmap } from "@/components/heatmap/VietnamSectorGridHeatmap"
import { limitHeatmapAssets } from "@/lib/market/heatmap-limits"
import {
  defaultSizing,
  hasCryptoHeatmapMetrics,
  hasUsHeatmapMetrics,
  heatmapEmptyMessage,
  type CryptoHeatmapSizingMode,
  type UsHeatmapSizingMode,
} from "@/lib/treemap/heatmap-engine"
import {
  DEFAULT_VN_HEATMAP_MODE,
  vnModeHasValidMetrics,
  type VnHeatmapMode,
} from "@/lib/vietnam/vn-heatmap-modes"
import type { Lang } from "@/lib/i18n"
import type { MarketAsset, MarketType } from "@/types/market"

export type { HeatmapGroupingMode } from "@/lib/treemap/heatmap-engine"

type MarketHeatmapProps = {
  assets: MarketAsset[]
  locale: Lang
  marketType: MarketType
  vnMode?: VnHeatmapMode
  groupLabel?: (key: string) => string
  onTileClick: (asset: MarketAsset) => void
}

function HeatmapEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-heatmap-gap p-4">
      <p className="text-center text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function MarketHeatmap({
  assets,
  locale: _locale,
  marketType,
  vnMode,
  groupLabel,
  onTileClick,
}: MarketHeatmapProps) {
  const mode = vnMode ?? DEFAULT_VN_HEATMAP_MODE

  const limitedAssets = useMemo(() => {
    if (marketType === "vn") {
      return limitHeatmapAssets(assets, marketType, mode)
    }
    if (marketType === "us") {
      return limitHeatmapAssets(assets, marketType, defaultSizing("us"))
    }
    return limitHeatmapAssets(assets, marketType, defaultSizing("crypto"))
  }, [assets, marketType, mode])

  const emptyMessage = useMemo(() => {
    if (!limitedAssets.length) {
      return heatmapEmptyMessage(marketType, mode, "no-assets")
    }
    if (marketType === "vn") {
      if (mode === "foreign-flow" || mode === "proprietary-flow") {
        if (!vnModeHasValidMetrics(limitedAssets, mode)) {
          return heatmapEmptyMessage(marketType, mode, "no-metrics")
        }
      }
      return null
    }
    if (marketType === "us" && !hasUsHeatmapMetrics(limitedAssets)) {
      return heatmapEmptyMessage(marketType, undefined, "no-metrics")
    }
    if (marketType === "crypto" && !hasCryptoHeatmapMetrics(limitedAssets)) {
      return heatmapEmptyMessage(marketType, undefined, "no-metrics")
    }
    return null
  }, [limitedAssets, marketType, mode])

  if (emptyMessage) {
    return <HeatmapEmptyState message={emptyMessage} />
  }

  if (marketType === "vn") {
    if (mode === "sector-volume") {
      return (
        <VietnamSectorGridHeatmap
          assets={limitedAssets}
          groupLabel={groupLabel}
          onTileClick={onTileClick}
        />
      )
    }

    return (
      <VietnamFlatTreemap
        assets={limitedAssets}
        mode={mode}
        onTileClick={onTileClick}
      />
    )
  }

  const usCryptoSizing: UsHeatmapSizingMode | CryptoHeatmapSizingMode =
    marketType === "us"
      ? defaultSizing("us")
      : defaultSizing("crypto")

  return (
    <FinvizTreemap
      assets={limitedAssets}
      marketType={marketType}
      sizing={usCryptoSizing}
      onTileClick={onTileClick}
    />
  )
}
