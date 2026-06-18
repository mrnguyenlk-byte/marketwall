#!/usr/bin/env node
/**
 * Heatmap regression audit — stock counts, sector dimensions, layout timing.
 * Usage:
 *   npx tsx scripts/heatmap-regression-audit.ts
 *   HEATMAP_API_BASE=https://btrading.org npx tsx scripts/heatmap-regression-audit.ts
 */
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config()

import { heatmapRowsToMarketAssets } from "@/lib/market/heatmap-assets"
import { limitHeatmapAssets } from "@/lib/market/heatmap-limits"
import { getMockHeatmapAssets } from "@/lib/mockHeatmapData"
import { isVnHeatmapLeader } from "@/lib/heatmap/leader-symbols"
import { vnTradingValueMetric } from "@/lib/treemap/heatmap-engine"
import {
  MAX_STOCK_AREA_SHARE_IN_SECTOR,
  normalizeTreemapWeights,
  TREEMAP_COMPRESSION_POWER,
} from "@/lib/treemap/treemap-builders"
import {
  buildSectorGroupedTreemap,
  LAYOUT_VIEWPORT_HEIGHT_PX,
  SECTOR_HEADER_HEIGHT_PX,
} from "@/lib/vietnam/vietnam-sector-grid-layout"
import {
  VN_SECTOR_GROUP_ORDER,
  vnSectorViLabel,
  type VnSectorGroupId,
} from "@/lib/vietnam/sector-groups"
import { vnSectorGroupForAsset } from "@/lib/vietnam/vn-sector-map"
import type { HeatmapAsset, MarketAsset } from "@/types/market"

const API_BASE = process.env.HEATMAP_API_BASE ?? "http://127.0.0.1:3000"
const CONTAINER_WIDTH_PX = 1200

type SectorAuditRow = {
  sectorId: VnSectorGroupId
  sectorName: string
  stockCountInput: number
  stockCountAfterWeight: number
  stockCountRendered: number
  leaderTilesRendered: number
  sectorWidthPx: number
  sectorHeightPx: number
  innerWidthPx: number
  innerHeightPx: number
  headerPx: number
  hideLabel: boolean
}

function tradingValueMetric(asset: MarketAsset): number {
  return Math.max(vnTradingValueMetric(asset), 0)
}

async function fetchVnAssets(): Promise<{ assets: MarketAsset[]; source: string; rawCount: number }> {
  const url = `${API_BASE.replace(/\/$/, "")}/api/heatmaps/vietnam`
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "heatmap-regression-audit/1.0" },
      signal: AbortSignal.timeout(25_000),
    })
    if (res.ok) {
      const json = (await res.json()) as { items?: HeatmapAsset[]; source?: string }
      if (json.items?.length) {
        const assets = limitHeatmapAssets(
          heatmapRowsToMarketAssets(json.items, "vn"),
          "vn",
          "sector-volume",
        )
        return {
          assets,
          source: `${json.source ?? "live"}@${API_BASE}`,
          rawCount: json.items.length,
        }
      }
    }
  } catch {
    /* fall through */
  }

  const mock = getMockHeatmapAssets("vn")
  const items = mock.map((asset) => ({
    symbol: asset.symbol,
    name: asset.name.en,
    price: asset.price,
    changePercent: asset.changePercent,
    volume: asset.volume,
    sector: asset.sector,
    marketCap: asset.marketCap,
    volumeLot: asset.volume,
    volumeShares: asset.volumeShares,
    tradingValue: asset.tradingValue,
  }))
  return {
    assets: limitHeatmapAssets(heatmapRowsToMarketAssets(items, "vn"), "vn", "sector-volume"),
    source: "mock-local",
    rawCount: items.length,
  }
}

function auditSector(
  id: VnSectorGroupId,
  inputAssets: MarketAsset[],
  renderedCount: number,
  leaderCount: number,
  sectorRect: { x: number; y: number; w: number; h: number },
  hideLabel: boolean,
): SectorAuditRow {
  const rawMetrics = inputAssets
    .map((asset) => ({ data: asset, metric: tradingValueMetric(asset) }))
    .sort((a, b) => b.metric - a.metric)

  const afterWeight = normalizeTreemapWeights(
    rawMetrics.filter((r) => r.metric > 0),
    {
      maxShare: MAX_STOCK_AREA_SHARE_IN_SECTOR,
      power: TREEMAP_COMPRESSION_POWER.VN_STOCK_IN_SECTOR,
    },
  )

  const sectorWidthPx = sectorRect.w * CONTAINER_WIDTH_PX
  const sectorHeightPx = sectorRect.h * LAYOUT_VIEWPORT_HEIGHT_PX
  const headerPx = hideLabel ? 0 : SECTOR_HEADER_HEIGHT_PX
  const innerWidthPx = sectorRect.w * CONTAINER_WIDTH_PX
  const innerHeightPx = Math.max(sectorRect.h * LAYOUT_VIEWPORT_HEIGHT_PX - headerPx, 0)

  return {
    sectorId: id,
    sectorName: vnSectorViLabel(id),
    stockCountInput: inputAssets.length,
    stockCountAfterWeight: afterWeight.length,
    stockCountRendered: renderedCount,
    leaderTilesRendered: leaderCount,
    sectorWidthPx: Math.round(sectorWidthPx * 100) / 100,
    sectorHeightPx: Math.round(sectorHeightPx * 100) / 100,
    innerWidthPx: Math.round(innerWidthPx * 100) / 100,
    innerHeightPx: Math.round(innerHeightPx * 100) / 100,
    headerPx,
    hideLabel,
  }
}

function printTable(rows: SectorAuditRow[]) {
  const header =
    "sectorName".padEnd(28) +
    "input".padStart(6) +
    "weight".padStart(8) +
    "render".padStart(8) +
    "leaders".padStart(9) +
    "  sectorW×H".padStart(14) +
    "  innerW×H".padStart(14) +
    "  hdr"
  console.log(header)
  console.log("-".repeat(header.length + 4))

  let totalInput = 0
  let totalWeight = 0
  let totalRender = 0
  let totalLeaders = 0

  for (const row of rows) {
    totalInput += row.stockCountInput
    totalWeight += row.stockCountAfterWeight
    totalRender += row.stockCountRendered
    totalLeaders += row.leaderTilesRendered

    const dim = `${row.sectorWidthPx}×${row.sectorHeightPx}`
    const inner = `${row.innerWidthPx}×${row.innerHeightPx}`
    console.log(
      `${row.sectorName.padEnd(28)}` +
        `${String(row.stockCountInput).padStart(6)}` +
        `${String(row.stockCountAfterWeight).padStart(8)}` +
        `${String(row.stockCountRendered).padStart(8)}` +
        `${String(row.leaderTilesRendered).padStart(9)}` +
        `  ${dim.padStart(14)}` +
        `  ${inner.padStart(14)}` +
        `  ${row.headerPx}px${row.hideLabel ? " (hidden)" : ""}`,
    )
  }

  console.log("-".repeat(header.length + 4))
  console.log(
    `${"TOTAL".padEnd(28)}` +
      `${String(totalInput).padStart(6)}` +
      `${String(totalWeight).padStart(8)}` +
      `${String(totalRender).padStart(8)}` +
      `${String(totalLeaders).padStart(9)}`,
  )
}

async function main() {
  console.log("Heatmap regression audit")
  console.log(`generatedAt: ${new Date().toISOString()}`)
  console.log(`apiBase: ${API_BASE}`)
  console.log(`assumedViewport: ${CONTAINER_WIDTH_PX}×${LAYOUT_VIEWPORT_HEIGHT_PX}px`)
  console.log(`sectorHeaderPx: ${SECTOR_HEADER_HEIGHT_PX} (layout uses ${SECTOR_HEADER_HEIGHT_PX / LAYOUT_VIEWPORT_HEIGHT_PX} normalized)`)

  const { assets, source, rawCount } = await fetchVnAssets()
  console.log(`dataSource: ${source}`)
  console.log(`apiRawItemCount: ${rawCount}`)
  console.log(`limitedAssetCount: ${assets.length}`)

  const buckets = new Map<VnSectorGroupId, MarketAsset[]>()
  for (const id of VN_SECTOR_GROUP_ORDER) buckets.set(id, [])
  for (const asset of assets) {
    buckets.get(vnSectorGroupForAsset(asset))?.push(asset)
  }

  console.time("buildSectorGroupedTreemap")
  const layout = buildSectorGroupedTreemap(assets)
  console.timeEnd("buildSectorGroupedTreemap")

  const reactTileCount = layout.sectors.reduce((sum, s) => sum + s.tiles.length, 0)
  const leaderTileCount = layout.sectors.reduce(
    (sum, s) => sum + s.tiles.filter((t) => isVnHeatmapLeader(t.asset.symbol)).length,
    0,
  )

  console.log("")
  console.log(`layoutSectorCount: ${layout.sectors.length}`)
  console.log(`layoutTileCount (React components): ${reactTileCount}`)
  console.log(`leaderTilesInLayout: ${leaderTileCount}`)
  console.log(`nonLeaderTilesInLayout: ${reactTileCount - leaderTileCount}`)
  console.log(`expectedVisibleWithZ10Bug: ~${leaderTileCount} (leaders z-25 only)`)

  const rows: SectorAuditRow[] = []
  for (const sector of layout.sectors) {
    const input = buckets.get(sector.id) ?? []
    const leaders = sector.tiles.filter((t) => isVnHeatmapLeader(t.asset.symbol)).length
    rows.push(
      auditSector(
        sector.id,
        input,
        sector.tiles.length,
        leaders,
        sector.rect,
        sector.hideLabel,
      ),
    )
  }

  rows.sort((a, b) => b.stockCountInput - a.stockCountInput)

  console.log("")
  console.log("--- Per-sector stock counts & dimensions ---")
  printTable(rows)

  const droppedByInvalid = assets.filter((a) => tradingValueMetric(a) <= 0).length
  const sectorsExcluded = VN_SECTOR_GROUP_ORDER.filter(
    (id) => !layout.sectors.some((s) => s.id === id),
  )

  console.log("")
  console.log("--- Pipeline summary ---")
  console.log(`invalidMetricCount (metric<=0): ${droppedByInvalid}`)
  console.log(`sectorsExcludedFromLayout: ${sectorsExcluded.length ? sectorsExcluded.join(", ") : "none"}`)
  console.log(
    `input→weight drop: ${rows.reduce((s, r) => s + (r.stockCountInput - r.stockCountAfterWeight), 0)} (invalid metrics only)`,
  )
  console.log(
    `weight→render drop: ${rows.reduce((s, r) => s + (r.stockCountAfterWeight - r.stockCountRendered), 0)} (layout engine)`,
  )

  const zeroInner = rows.filter((r) => r.innerWidthPx <= 0 || r.innerHeightPx <= 0)
  if (zeroInner.length) {
    console.log("")
    console.log("WARNING: sectors with zero/negative inner area:")
    for (const r of zeroInner) {
      console.log(`  ${r.sectorId}: inner ${r.innerWidthPx}×${r.innerHeightPx}`)
    }
  } else {
    console.log("")
    console.log("All rendered sectors have positive inner area after 22px header subtraction.")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
