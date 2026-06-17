import type { MarketType } from "@/types/market"
import type { MarketAsset } from "@/types/market"

import { dollarVolume } from "@/lib/market/heatmap-limits"
import { type VnHeatmapSizingMode } from "@/lib/vietnam/heatmap-sizing"
import { vpsLotToShares } from "@/lib/vietnam/volume-units"

import {
  buildFlatMetricTreemap,
  MAX_ITEM_AREA_SHARE,
  normalizeTreemapWeights,
  TREEMAP_COMPRESSION_POWER,
} from "./treemap-builders"
import type { TreemapLayoutNode, TreemapRect } from "./squarify"

export type HeatmapGroupingMode = "sector" | "industry" | "category" | "marketCap"

export type UsHeatmapSizingMode = "marketCap" | "dollarVolume"
export type CryptoHeatmapSizingMode = "volume" | "marketCap"

export type TreemapGroupLayout = {
  id: string
  labelKey?: string
  label: string
  rect: TreemapRect
  children: TreemapLayoutNode<MarketAsset>[]
}

export type HeatmapTreemapLayout = {
  groups: TreemapGroupLayout[]
  leaves: TreemapLayoutNode<MarketAsset>[]
}

/** @deprecated Use MAX_ITEM_AREA_SHARE from treemap-builders */
export const MAX_LEAF_AREA_FRACTION = MAX_ITEM_AREA_SHARE

type ExtendedMarketAsset = MarketAsset & {
  quoteVolume?: number
  volume24h?: number
  proprietaryNetValue?: number
  proprietaryTradingValue?: number
  proprietaryBuyValue?: number
  proprietarySellValue?: number
  foreignTradingValue?: number
}

/** Default tile sizing mode per market — liquidity-first, not market cap. */
export function defaultSizing(market: "us"): UsHeatmapSizingMode
export function defaultSizing(market: "crypto"): CryptoHeatmapSizingMode
export function defaultSizing(market: "vn"): VnHeatmapSizingMode
export function defaultSizing(
  market: "us" | "crypto" | "vn",
): UsHeatmapSizingMode | CryptoHeatmapSizingMode | VnHeatmapSizingMode {
  if (market === "us") return "dollarVolume"
  if (market === "crypto") return "volume"
  return "tradingValue"
}

/** @deprecated Use normalizeTreemapWeights via buildFlatMetricTreemap */
export function capLeafWeights<T>(
  items: Array<{ data: T; value: number }>,
): Array<{ data: T; value: number }> {
  const normalized = normalizeTreemapWeights(
    items.map((item) => ({ data: item.data, metric: item.value })),
    { maxShare: MAX_ITEM_AREA_SHARE, power: TREEMAP_COMPRESSION_POWER.DEFAULT },
  )
  return normalized.map((item) => ({
    data: item.data,
    value: item.weight,
  }))
}

export function vnTradingValueMetric(asset: MarketAsset): number {
  if (asset.tradingValue != null && asset.tradingValue > 0) return asset.tradingValue
  const shares = asset.volumeShares ?? vpsLotToShares(asset.volume)
  return Math.round(asset.price * shares)
}

/** US tile size: tradingValue → dollarVolume → price×volume → marketCap (volume absent only). */
export function usHeatmapSizeMetric(asset: MarketAsset): number {
  const ext = asset as ExtendedMarketAsset
  if (ext.tradingValue != null && ext.tradingValue > 0) return ext.tradingValue
  const dv = dollarVolume(asset.price, asset.volume)
  if (dv > 0) return dv
  if (asset.volume > 0 && asset.price > 0) return asset.price * asset.volume
  if (asset.volume <= 0 && asset.marketCap > 0) return asset.marketCap
  return 0
}

/** Crypto tile size: quoteVolume → volume24h → price×volume → tradingValue → marketCap. */
export function cryptoHeatmapSizeMetric(asset: MarketAsset): number {
  const ext = asset as ExtendedMarketAsset
  if (ext.quoteVolume != null && ext.quoteVolume > 0) return ext.quoteVolume
  if (ext.volume24h != null && ext.volume24h > 0) return ext.volume24h
  const vol = asset.volume
  if (vol > 0 && asset.price > 0) return asset.price * vol
  if (vol > 0) return vol
  if (ext.tradingValue != null && ext.tradingValue > 0) return ext.tradingValue
  return asset.marketCap > 0 ? asset.marketCap : 0
}

export function assetSizeMetric(
  asset: MarketAsset,
  marketType: MarketType,
  sizing:
    | VnHeatmapSizingMode
    | UsHeatmapSizingMode
    | CryptoHeatmapSizingMode = "tradingValue",
): number {
  if (marketType === "vn") {
    const mode = sizing as VnHeatmapSizingMode
    switch (mode) {
      case "tradingValue":
        return vnTradingValueMetric(asset)
      case "volume":
        return asset.volumeShares ?? vpsLotToShares(asset.volume)
      case "marketCap":
        return asset.marketCap
    }
  }
  if (marketType === "us") {
    return sizing === "dollarVolume" ? usHeatmapSizeMetric(asset) : asset.marketCap
  }
  return sizing === "volume" ? cryptoHeatmapSizeMetric(asset) : asset.marketCap
}

export function hasUsHeatmapMetrics(assets: MarketAsset[]): boolean {
  return assets.some((asset) => usHeatmapSizeMetric(asset) > 0)
}

export function hasCryptoHeatmapMetrics(assets: MarketAsset[]): boolean {
  return assets.some((asset) => cryptoHeatmapSizeMetric(asset) > 0)
}

/** Flat metric treemap for US (dollar volume) and Crypto (24h volume) — single mode each. */
export function buildFlatMarketHeatmapLayout(
  assets: MarketAsset[],
  marketType: "us" | "crypto",
  sizing: UsHeatmapSizingMode | CryptoHeatmapSizingMode,
): HeatmapTreemapLayout {
  const rect: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
  const metric =
    marketType === "us"
      ? sizing === "dollarVolume"
        ? usHeatmapSizeMetric
        : (asset: MarketAsset) => asset.marketCap
      : sizing === "volume"
        ? cryptoHeatmapSizeMetric
        : (asset: MarketAsset) => asset.marketCap
  const usLinearVolume = marketType === "us" && sizing === "dollarVolume"
  const power =
    marketType === "us"
      ? sizing === "dollarVolume"
        ? TREEMAP_COMPRESSION_POWER.US_DOLLAR_VOLUME
        : TREEMAP_COMPRESSION_POWER.DEFAULT
      : sizing === "volume"
        ? TREEMAP_COMPRESSION_POWER.CRYPTO_VOLUME
        : TREEMAP_COMPRESSION_POWER.DEFAULT
  const sorted = [...assets].sort((a, b) => metric(b) - metric(a))
  return {
    groups: [],
    leaves: buildFlatMetricTreemap(sorted, metric, rect, {
      allowEqualGridFallback: false,
      maxShare: usLinearVolume ? 1 : undefined,
      power,
      forceWeightedFallback: marketType === "crypto",
    }),
  }
}

/** @deprecated US/Crypto use flat layout only; grouping controls removed from UI. */
export function buildHeatmapTreemapLayout(
  assets: MarketAsset[],
  marketType: MarketType,
  _grouping: HeatmapGroupingMode,
  sizing:
    | VnHeatmapSizingMode
    | UsHeatmapSizingMode
    | CryptoHeatmapSizingMode,
): HeatmapTreemapLayout {
  if (marketType === "us") {
    return buildFlatMarketHeatmapLayout(
      assets,
      "us",
      sizing as UsHeatmapSizingMode,
    )
  }
  if (marketType === "crypto") {
    return buildFlatMarketHeatmapLayout(
      assets,
      "crypto",
      sizing as CryptoHeatmapSizingMode,
    )
  }

  const rect: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
  const vnSizing = sizing as VnHeatmapSizingMode
  const metric = (asset: MarketAsset) => assetSizeMetric(asset, marketType, vnSizing)
  const power =
    vnSizing === "marketCap"
      ? TREEMAP_COMPRESSION_POWER.VN_MARKET_CAP_FLAT
      : TREEMAP_COMPRESSION_POWER.VN_FLOW_FLAT
  return {
    groups: [],
    leaves: buildFlatMetricTreemap(assets, metric, rect, { power }),
  }
}

export function tileSizeFromRect(rect: TreemapRect): "large" | "medium" | "small" | "tiny" {
  const area = rect.w * rect.h
  if (area >= 0.035) return "large"
  if (area >= 0.012) return "medium"
  if (area >= 0.0035) return "small"
  return "tiny"
}

export type HeatmapEmptyReason = "no-assets" | "no-metrics"

export function heatmapEmptyMessage(
  marketType: MarketType,
  vnMode?: string,
  reason: HeatmapEmptyReason = "no-metrics",
): string {
  if (reason === "no-assets") {
    return marketType === "vn" ? "Không có mã cổ phiếu" : "No symbols available"
  }
  if (marketType === "vn" && vnMode === "proprietary-flow") {
    return "Chưa có dữ liệu tự doanh"
  }
  if (marketType === "vn" && vnMode === "foreign-flow") {
    return "Chưa có dữ liệu khối ngoại"
  }
  if (marketType === "us") {
    return "Chưa có dữ liệu thanh khoản"
  }
  if (marketType === "crypto") {
    return "Chưa có dữ liệu khối lượng 24h"
  }
  return "Chưa có dữ liệu hiển thị"
}
