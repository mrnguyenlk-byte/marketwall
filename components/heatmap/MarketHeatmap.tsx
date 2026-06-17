"use client"

import { useMemo } from "react"

import { FinvizTreemap } from "@/components/heatmap/FinvizTreemap"
import { VietnamFlatTreemap } from "@/components/heatmap/VietnamFlatTreemap"
import { VietnamSectorGridHeatmap } from "@/components/heatmap/VietnamSectorGridHeatmap"
import { limitHeatmapAssets } from "@/lib/market/heatmap-limits"
import type {
  CryptoHeatmapSizingMode,
  HeatmapGroupingMode,
  UsHeatmapSizingMode,
} from "@/lib/treemap/heatmap-engine"
import {
  DEFAULT_VN_HEATMAP_MODE,
  type VnHeatmapMode,
} from "@/lib/vietnam/vn-heatmap-modes"
import type { Lang } from "@/lib/i18n"
import type { MarketAsset, MarketType } from "@/types/market"

export type { HeatmapGroupingMode }

type MarketHeatmapProps = {
  assets: MarketAsset[]
  locale: Lang
  marketType: MarketType
  groupingMode?: HeatmapGroupingMode
  sizingMode?: UsHeatmapSizingMode | CryptoHeatmapSizingMode
  vnMode?: VnHeatmapMode
  groupLabel?: (key: string) => string
  onTileClick: (asset: MarketAsset) => void
}

function defaultUsSizing(): UsHeatmapSizingMode {
  return "marketCap"
}

function defaultCryptoSizing(): CryptoHeatmapSizingMode {
  return "volume"
}

export function MarketHeatmap({
  assets,
  locale: _locale,
  marketType,
  groupingMode = "sector",
  sizingMode,
  vnMode,
  groupLabel,
  onTileClick,
}: MarketHeatmapProps) {
  const mode = vnMode ?? DEFAULT_VN_HEATMAP_MODE

  const limitedAssets = useMemo(() => {
    if (marketType === "vn") {
      return limitHeatmapAssets(assets, marketType, mode)
    }
    const sizing = sizingMode ?? (marketType === "us" ? defaultUsSizing() : defaultCryptoSizing())
    return limitHeatmapAssets(assets, marketType, sizing)
  }, [assets, marketType, mode, sizingMode])

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

  const sizing = sizingMode ?? (marketType === "us" ? defaultUsSizing() : defaultCryptoSizing())

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
