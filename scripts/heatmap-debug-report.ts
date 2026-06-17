#!/usr/bin/env node
/**
 * Heatmap layout debug report — uses the same metric fns and treemap builders as production.
 * Usage: npx tsx scripts/heatmap-debug-report.ts
 */
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config()

import { heatmapRowsToMarketAssets } from "@/lib/market/heatmap-assets"
import { limitHeatmapAssets } from "@/lib/market/heatmap-limits"
import { getMockHeatmapAssets } from "@/lib/mockHeatmapData"
import {
  buildFlatMarketHeatmapLayout,
  cryptoHeatmapSizeMetric,
  defaultSizing,
  usHeatmapSizeMetric,
  vnTradingValueMetric,
} from "@/lib/treemap/heatmap-engine"
import type { TreemapLayoutNode, TreemapRect } from "@/lib/treemap/squarify"
import {
  MAX_ITEM_AREA_SHARE,
  MAX_SECTOR_AREA_SHARE,
  MAX_STOCK_AREA_SHARE_IN_SECTOR,
  MIN_VISIBLE_SHARE,
  KHAC_MAX_SHARE,
  normalizeTreemapWeights,
  splitKhacBucket,
  TREEMAP_COMPRESSION_POWER,
} from "@/lib/treemap/treemap-builders"
import {
  buildFlatVnTreemapLayoutForMode,
  vnHeatmapMetric,
  type VnHeatmapMode,
} from "@/lib/vietnam/vn-heatmap-modes"
import {
  buildSectorGroupedTreemap,
  type VnSectorTreemapLayout,
} from "@/lib/vietnam/vietnam-sector-grid-layout"
import {
  normalizeVnSectorGroup,
  VN_SECTOR_GROUP_LABEL_KEYS,
  VN_SECTOR_GROUP_ORDER,
  type VnSectorGroupId,
} from "@/lib/vietnam/sector-groups"
import type { HeatmapAsset, MarketAsset, MarketType } from "@/types/market"

const API_BASES = [
  process.env.HEATMAP_API_BASE,
  "http://127.0.0.1:3000",
  "https://btrading.org",
].filter((v): v is string => Boolean(v))

const MARKET_API_PATH: Record<MarketType, string> = {
  vn: "vietnam",
  us: "us",
  crypto: "crypto",
}

type WeightRow = { symbol: string; metric: number; share: number }

type FlatModeReport = {
  kind: "flat"
  mode: string
  metricField: string
  dataSource: string
  itemCount: number
  totalMetric: number
  invalidMetricCount: number
  topRaw: WeightRow[]
  topShares: WeightRow[]
  maxTileShare: number
  layoutMaxAspectRatio: number
  layoutTileCount: number
}

type SectorModeReport = {
  kind: "sector"
  mode: string
  metricField: string
  dataSource: string
  itemCount: number
  sectorCount: number
  totalMetric: number
  invalidMetricCount: number
  topRawSectors: Array<{ id: string; label: string; metric: number }>
  topSectorShares: WeightRow[]
  maxRootShare: number
  maxInnerShare: number
  sampleSector: { id: string; label: string; topRaw: WeightRow[]; topShares: WeightRow[] }
  layoutMaxAspectRatio: number
  layoutTileCount: number
}

function aspectRatio(rect: TreemapRect): number {
  const minEdge = Math.max(Math.min(rect.w, rect.h), 1e-9)
  return Math.max(rect.w, rect.h) / minEdge
}

function maxAspectFromRects(rects: TreemapRect[]): number {
  if (!rects.length) return 0
  return Math.max(...rects.map(aspectRatio))
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "0"
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function fmtPct(share: number): string {
  return `${(share * 100).toFixed(2)}%`
}

function topNByMetric<T>(
  items: T[],
  metric: (item: T) => number,
  symbol: (item: T) => string,
  n = 10,
): WeightRow[] {
  return [...items]
    .map((item) => ({ symbol: symbol(item), metric: metric(item), share: 0 }))
    .sort((a, b) => b.metric - a.metric)
    .slice(0, n)
}

function topNByShare(rows: WeightRow[], n = 10): WeightRow[] {
  return [...rows].sort((a, b) => b.share - a.share).slice(0, n)
}

function normalizedShares<T>(
  items: T[],
  metricFn: (item: T) => number,
  maxShare: number,
  power: number,
  symbolFn: (item: T) => string,
): { rows: WeightRow[]; totalMetric: number; invalidCount: number } {
  const raw = items.map((item) => ({ data: item, metric: metricFn(item) }))
  const invalidCount = raw.filter((r) => r.metric <= 0).length
  const totalMetric = raw.reduce((sum, r) => sum + (r.metric > 0 ? r.metric : 0), 0)
  const normalized = normalizeTreemapWeights(
    raw.filter((r) => r.metric > 0),
    { maxShare, power },
  )
  const rows: WeightRow[] = normalized.map((item) => ({
    symbol: symbolFn(item.data),
    metric: item.metric,
    share: item.weight,
  }))
  return { rows, totalMetric, invalidCount }
}

function collectLeafRects(layout: { leaves: TreemapLayoutNode<MarketAsset>[] }): TreemapRect[] {
  return layout.leaves.map((leaf) => leaf.rect)
}

function collectSectorRects(layout: VnSectorTreemapLayout): TreemapRect[] {
  const rects: TreemapRect[] = []
  for (const sector of layout.sectors) {
    rects.push(sector.rect)
    for (const tile of sector.tiles) rects.push(tile.rect)
    if (sector.other) rects.push(sector.other.rect)
  }
  return rects
}

function analyzeFlatMode(
  mode: string,
  metricField: string,
  assets: MarketAsset[],
  dataSource: string,
  metricFn: (asset: MarketAsset) => number,
  maxShare: number,
  power: number,
  layout: { leaves: TreemapLayoutNode<MarketAsset>[] },
): FlatModeReport {
  const topRaw = topNByMetric(assets, metricFn, (a) => a.symbol)
  const { rows, totalMetric, invalidCount } = normalizedShares(
    assets,
    metricFn,
    maxShare,
    power,
    (a) => a.symbol,
  )
  const topShares = topNByShare(rows)
  const maxTileShare = rows.reduce((max, r) => Math.max(max, r.share), 0)

  return {
    kind: "flat",
    mode,
    metricField,
    dataSource,
    itemCount: assets.length,
    totalMetric,
    invalidMetricCount: invalidCount,
    topRaw,
    topShares,
    maxTileShare,
    layoutMaxAspectRatio: maxAspectFromRects(collectLeafRects(layout)),
    layoutTileCount: layout.leaves.length,
  }
}

function analyzeSectorMode(
  assets: MarketAsset[],
  dataSource: string,
  layout: VnSectorTreemapLayout,
): SectorModeReport {
  const metricFn = (asset: MarketAsset) => Math.max(vnTradingValueMetric(asset), 0)

  const buckets = new Map<VnSectorGroupId, MarketAsset[]>()
  for (const id of VN_SECTOR_GROUP_ORDER) buckets.set(id, [])
  for (const asset of assets) {
    buckets.get(normalizeVnSectorGroup(asset.sector))?.push(asset)
  }

  const present = VN_SECTOR_GROUP_ORDER.filter((id) => (buckets.get(id)?.length ?? 0) > 0)
  const sectorMetrics = present.map((id) => ({
    id,
    label: VN_SECTOR_GROUP_LABEL_KEYS[id],
    metric: (buckets.get(id) ?? []).reduce((sum, a) => sum + metricFn(a), 0),
    assets: buckets.get(id) ?? [],
  }))

  const totalMetric = sectorMetrics.reduce((sum, s) => sum + s.metric, 0)
  const invalidMetricCount = assets.filter((a) => metricFn(a) <= 0).length

  const rootNormalized = normalizeTreemapWeights(
    sectorMetrics.map((s) => ({ data: s, metric: s.metric })),
    {
      maxShare: MAX_SECTOR_AREA_SHARE,
      power: TREEMAP_COMPRESSION_POWER.VN_SECTOR_ROOT,
    },
  )
  const sectorShareRows: WeightRow[] = rootNormalized.map((item) => ({
    symbol: item.data.id,
    metric: item.data.metric,
    share: item.weight,
  }))
  const maxRootShare = sectorShareRows.reduce((max, r) => Math.max(max, r.share), 0)

  let maxInnerShare = 0
  for (const sector of layout.sectors) {
    const headerH = sector.hideLabel
      ? 0
      : Math.min(Math.max(sector.rect.h * 0.07, 18 / 1080), 22 / 1080)
    const innerArea = sector.rect.w * Math.max(sector.rect.h - headerH, 0)
    if (innerArea <= 0) continue
    for (const tile of sector.tiles) {
      maxInnerShare = Math.max(maxInnerShare, (tile.rect.w * tile.rect.h) / innerArea)
    }
    if (sector.other) {
      maxInnerShare = Math.max(
        maxInnerShare,
        (sector.other.rect.w * sector.other.rect.h) / innerArea,
      )
    }
  }

  const largestSector = [...sectorMetrics].sort((a, b) => b.metric - a.metric)[0]
  const sampleInnerNorm = normalizeTreemapWeights(
    largestSector.assets
      .map((a) => ({ data: a, metric: metricFn(a) }))
      .filter((r) => r.metric > 0),
    {
      maxShare: MAX_STOCK_AREA_SHARE_IN_SECTOR,
      power: TREEMAP_COMPRESSION_POWER.VN_STOCK_IN_SECTOR,
    },
  )
  const { items: sampleVisible, khac: sampleKhac } = splitKhacBucket(sampleInnerNorm, {
    minVisibleShare: MIN_VISIBLE_SHARE,
    khacMaxShare: KHAC_MAX_SHARE,
  })
  const sampleShareRows: WeightRow[] = sampleVisible.map((item) => ({
    symbol: item.data.symbol,
    metric: item.metric,
    share: item.weight,
  }))
  if (sampleKhac) {
    sampleShareRows.push({
      symbol: `Khác (${sampleKhac.items.length})`,
      metric: sampleKhac.metric,
      share: sampleKhac.weight,
    })
  }

  const layoutTileCount = layout.sectors.reduce(
    (sum, s) => sum + s.tiles.length + (s.other ? 1 : 0),
    0,
  )

  return {
    kind: "sector",
    mode: "VN sector (sector-volume grouped)",
    metricField: "tradingValue (vnTradingValueMetric)",
    dataSource,
    itemCount: assets.length,
    sectorCount: present.length,
    totalMetric,
    invalidMetricCount,
    topRawSectors: [...sectorMetrics]
      .sort((a, b) => b.metric - a.metric)
      .slice(0, 10)
      .map(({ id, label, metric }) => ({ id, label, metric })),
    topSectorShares: topNByShare(
      sectorShareRows.map((r) => ({
        ...r,
        symbol: `${r.symbol} (${VN_SECTOR_GROUP_LABEL_KEYS[r.symbol as VnSectorGroupId] ?? r.symbol})`,
      })),
    ),
    maxRootShare,
    maxInnerShare,
    sampleSector: {
      id: largestSector.id,
      label: largestSector.label,
      topRaw: topNByMetric(largestSector.assets, metricFn, (a) => a.symbol),
      topShares: topNByShare(sampleShareRows),
    },
    layoutMaxAspectRatio: maxAspectFromRects(collectSectorRects(layout)),
    layoutTileCount,
  }
}

function printFlatReport(r: FlatModeReport) {
  console.log(`MODE: ${r.mode}`)
  console.log(`dataSource: ${r.dataSource}`)
  console.log(`itemCount: ${r.itemCount}`)
  console.log(`metricField: ${r.metricField}`)
  console.log(`totalMetric: ${fmtNum(r.totalMetric)}`)
  console.log(`invalidMetricCount: ${r.invalidMetricCount}`)
  console.log("")
  console.log("--- Top 10 by raw metric ---")
  for (const [i, row] of r.topRaw.entries()) {
    console.log(`  ${i + 1}. ${row.symbol.padEnd(8)} ${fmtNum(row.metric)}`)
  }
  console.log("")
  console.log("--- Top 10 final area shares ---")
  for (const [i, row] of r.topShares.entries()) {
    console.log(`  ${i + 1}. ${row.symbol.padEnd(8)} ${fmtPct(row.share)}`)
  }
  console.log("")
  console.log(`maxTileShare: ${fmtPct(r.maxTileShare)}`)
  console.log(`layoutTileCount: ${r.layoutTileCount}`)
  console.log(`layoutMaxAspectRatio: ${r.layoutMaxAspectRatio.toFixed(3)}`)
}

function printSectorReport(r: SectorModeReport) {
  console.log(`MODE: ${r.mode}`)
  console.log(`dataSource: ${r.dataSource}`)
  console.log(`itemCount: ${r.itemCount}`)
  console.log(`sectorCount: ${r.sectorCount}`)
  console.log(`metricField: ${r.metricField}`)
  console.log(`totalMetric: ${fmtNum(r.totalMetric)}`)
  console.log(`invalidMetricCount: ${r.invalidMetricCount}`)
  console.log("")
  console.log("--- Top 10 root sectors by raw metric ---")
  for (const [i, row] of r.topRawSectors.entries()) {
    console.log(`  ${i + 1}. ${row.id.padEnd(12)} ${row.label.padEnd(24)} ${fmtNum(row.metric)}`)
  }
  console.log("")
  console.log("--- Top 10 root sector area shares ---")
  for (const [i, row] of r.topSectorShares.entries()) {
    console.log(`  ${i + 1}. ${row.symbol.padEnd(28)} ${fmtPct(row.share)}`)
  }
  console.log("")
  console.log(
    `--- Sample inner stocks (sector: ${r.sampleSector.id} / ${r.sampleSector.label}) ---`,
  )
  console.log("  Top by raw metric:")
  for (const [i, row] of r.sampleSector.topRaw.entries()) {
    console.log(`    ${i + 1}. ${row.symbol.padEnd(8)} ${fmtNum(row.metric)}`)
  }
  console.log("  Top by final area share:")
  for (const [i, row] of r.sampleSector.topShares.entries()) {
    console.log(`    ${i + 1}. ${row.symbol.padEnd(8)} ${fmtPct(row.share)}`)
  }
  console.log("")
  console.log(`maxRootSectorShare: ${fmtPct(r.maxRootShare)}`)
  console.log(`maxInnerTileShare: ${fmtPct(r.maxInnerShare)} (layout rect / sector inner area)`)
  console.log(`layoutTileCount: ${r.layoutTileCount}`)
  console.log(`layoutMaxAspectRatio: ${r.layoutMaxAspectRatio.toFixed(3)}`)
}

async function fetchHeatmapRows(
  market: MarketType,
): Promise<{ items: HeatmapAsset[]; source: string }> {
  const path = MARKET_API_PATH[market]
  for (const base of API_BASES) {
    try {
      const url = `${base.replace(/\/$/, "")}/api/heatmaps/${path}`
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "heatmap-debug-report/1.0" },
        signal: AbortSignal.timeout(20_000),
      })
      if (!res.ok) continue
      const json = (await res.json()) as { items?: HeatmapAsset[]; source?: string }
      if (json.items?.length) {
        return { items: json.items, source: `${json.source ?? "live"}@${base}` }
      }
    } catch {
      /* try next base */
    }
  }
  const mock = getMockHeatmapAssets(market)
  return {
    items: mock.map((asset) => ({
      symbol: asset.symbol,
      name: asset.name.en,
      price: asset.price,
      changePercent: asset.changePercent,
      volume: asset.volume,
      sector: asset.sector,
      marketCap: asset.marketCap,
      ...(market === "vn"
        ? {
            volumeLot: asset.volume,
            volumeShares: asset.volumeShares,
            tradingValue: asset.tradingValue,
            foreignBuy: asset.foreignBuy,
            foreignSell: asset.foreignSell,
            foreignNet: asset.foreignNet,
            foreignBuyValue: asset.foreignBuyValue,
            foreignSellValue: asset.foreignSellValue,
            foreignNetValue: asset.foreignNetValue,
          }
        : {}),
    })),
    source: "mock-local",
  }
}

async function loadLimitedAssets(
  market: MarketType,
  vnMode?: VnHeatmapMode,
): Promise<{ assets: MarketAsset[]; source: string }> {
  const result = await fetchHeatmapRows(market)
  const assets = heatmapRowsToMarketAssets(result.items, market)
  if (market === "vn") {
    return {
      assets: limitHeatmapAssets(assets, "vn", vnMode ?? "sector-volume"),
      source: result.source,
    }
  }
  if (market === "us") {
    return {
      assets: limitHeatmapAssets(assets, "us", defaultSizing("us")),
      source: result.source,
    }
  }
  return {
    assets: limitHeatmapAssets(assets, "crypto", defaultSizing("crypto")),
    source: result.source,
  }
}

function section(title: string) {
  console.log("")
  console.log("=".repeat(80))
  console.log(title)
  console.log("=".repeat(80))
}

async function main() {
  console.log("Heatmap debug report")
  console.log(`generatedAt: ${new Date().toISOString()}`)
  console.log(`branch: heatmap-rewrite`)

  const vnModes: Array<{ mode: VnHeatmapMode; label: string; metricField: string }> = [
    {
      mode: "sector-volume",
      label: "VN sector (sector-volume grouped)",
      metricField: "tradingValue (vnTradingValueMetric)",
    },
    {
      mode: "market-cap",
      label: "VN market-cap",
      metricField: "marketCap (vnMarketCapMetric)",
    },
    {
      mode: "foreign-flow",
      label: "VN foreign (foreign-flow)",
      metricField: "foreignNetValue|foreignTradingValue|shares×price (vnForeignFlowMetric)",
    },
    {
      mode: "proprietary-flow",
      label: "VN proprietary (proprietary-flow)",
      metricField:
        "proprietaryNetValue|proprietaryTradingValue|buy/sell (vnProprietaryFlowMetric)",
    },
  ]

  const { assets: vnAssets, source: vnSource } = await loadLimitedAssets("vn", "sector-volume")

  section("VN sector (sector-volume grouped)")
  const sectorLayout = buildSectorGroupedTreemap(vnAssets)
  printSectorReport(analyzeSectorMode(vnAssets, vnSource, sectorLayout))

  for (const { mode, label, metricField } of vnModes.filter((m) => m.mode !== "sector-volume")) {
    section(label)
    const { assets, source } = await loadLimitedAssets("vn", mode)
    const layout = buildFlatVnTreemapLayoutForMode(assets, mode)
    const power =
      mode === "market-cap"
        ? TREEMAP_COMPRESSION_POWER.VN_MARKET_CAP_FLAT
        : TREEMAP_COMPRESSION_POWER.VN_FLOW_FLAT
    printFlatReport(
      analyzeFlatMode(
        label,
        metricField,
        assets,
        source,
        (a) => vnHeatmapMetric(a, mode),
        MAX_ITEM_AREA_SHARE,
        power,
        layout,
      ),
    )
  }

  section("US (dollar volume / liquidity)")
  const { assets: usAssets, source: usSource } = await loadLimitedAssets("us")
  const usLayout = buildFlatMarketHeatmapLayout(usAssets, "us", defaultSizing("us"))
  printFlatReport(
    analyzeFlatMode(
      "US (dollar volume / liquidity)",
      "usHeatmapSizeMetric (tradingValue → dollarVolume → price×volume → marketCap)",
      usAssets,
      usSource,
      usHeatmapSizeMetric,
      MAX_ITEM_AREA_SHARE,
      TREEMAP_COMPRESSION_POWER.US_DOLLAR_VOLUME,
      usLayout,
    ),
  )

  section("Crypto (24h volume)")
  const { assets: cryptoAssets, source: cryptoSource } = await loadLimitedAssets("crypto")
  const cryptoLayout = buildFlatMarketHeatmapLayout(
    cryptoAssets,
    "crypto",
    defaultSizing("crypto"),
  )
  printFlatReport(
    analyzeFlatMode(
      "Crypto (24h volume)",
      "cryptoHeatmapSizeMetric (quoteVolume → volume24h → price×volume → marketCap)",
      cryptoAssets,
      cryptoSource,
      cryptoHeatmapSizeMetric,
      MAX_ITEM_AREA_SHARE,
      TREEMAP_COMPRESSION_POWER.CRYPTO_VOLUME,
      cryptoLayout,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
