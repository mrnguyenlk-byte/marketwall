"use client"

import { useMemo } from "react"

import { FinvizTreemap } from "@/components/heatmap/FinvizTreemap"
import { VietnamFlatTreemap } from "@/components/heatmap/VietnamFlatTreemap"
import { VietnamSectorGridHeatmap } from "@/components/heatmap/VietnamSectorGridHeatmap"
import { limitHeatmapAssets } from "@/lib/market/heatmap-limits"
import {
  DEFAULT_VN_HEATMAP_MODE,
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
    const sizing = marketType === "us" ? "dollarVolume" : "volume"
    return limitHeatmapAssets(assets, marketType, sizing)
  }, [assets, marketType, mode])

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

  const usCryptoSizing = marketType === "us" ? "dollarVolume" as const : "volume" as const

  return (
    <FinvizTreemap
      assets={limitedAssets}
      marketType={marketType}
      sizing={usCryptoSizing}
      onTileClick={onTileClick}
    />
  )
}
