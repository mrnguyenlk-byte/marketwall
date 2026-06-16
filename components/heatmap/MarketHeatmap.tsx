"use client"

import { useMemo } from "react"

import { FinvizTreemap } from "@/components/heatmap/FinvizTreemap"
import { VietnamSectorGridHeatmap } from "@/components/heatmap/VietnamSectorGridHeatmap"
import { limitHeatmapAssets } from "@/lib/market/heatmap-limits"
import {
  DEFAULT_VN_HEATMAP_SIZING,
  type VnHeatmapSizingMode,
} from "@/lib/vietnam/heatmap-sizing"
import type {
  CryptoHeatmapSizingMode,
  HeatmapGroupingMode,
  UsHeatmapSizingMode,
} from "@/lib/treemap/heatmap-engine"
import type { Lang } from "@/lib/i18n"
import type { MarketAsset, MarketType } from "@/types/market"

export type { HeatmapGroupingMode }

type MarketHeatmapProps = {
  assets: MarketAsset[]
  locale: Lang
  marketType: MarketType
  groupingMode?: HeatmapGroupingMode
  sizingMode?: VnHeatmapSizingMode | UsHeatmapSizingMode | CryptoHeatmapSizingMode
  groupLabel?: (key: string) => string
  onTileClick: (asset: MarketAsset) => void
}

function defaultSizing(marketType: MarketType): VnHeatmapSizingMode | UsHeatmapSizingMode | CryptoHeatmapSizingMode {
  if (marketType === "vn") return DEFAULT_VN_HEATMAP_SIZING
  if (marketType === "us") return "marketCap"
  return "volume"
}

export function MarketHeatmap({
  assets,
  locale: _locale,
  marketType,
  groupingMode = "sector",
  sizingMode,
  groupLabel,
  onTileClick,
}: MarketHeatmapProps) {
  const sizing = sizingMode ?? defaultSizing(marketType)

  const limitedAssets = useMemo(
    () => limitHeatmapAssets(assets, marketType, sizing),
    [assets, marketType, sizing],
  )

  if (marketType === "vn" && groupingMode === "sector") {
    return (
      <VietnamSectorGridHeatmap
        assets={limitedAssets}
        sizing={sizing as VnHeatmapSizingMode}
        groupLabel={groupLabel}
        onTileClick={onTileClick}
      />
    )
  }

  return (
    <FinvizTreemap
      assets={limitedAssets}
      marketType={marketType}
      grouping={groupingMode}
      sizing={sizing}
      groupLabel={groupLabel}
      onTileClick={onTileClick}
    />
  )
}
