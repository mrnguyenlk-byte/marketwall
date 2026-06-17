import {
  allMetricsInvalid,
  MAX_STOCK_AREA_SHARE_IN_SECTOR,
  normalizeTreemapWeights,
  packSquarified,
  TREEMAP_COMPRESSION_POWER,
} from "@/lib/treemap/treemap-builders"
import type { TreemapRect } from "@/lib/treemap/squarify"
import { vnTradingValueMetric } from "@/lib/treemap/heatmap-engine"
import {
  VN_SECTOR_GROUP_LABEL_KEYS,
  VN_SECTOR_GROUP_ORDER,
  type VnSectorGroupId,
} from "@/lib/vietnam/sector-groups"
import { vnSectorGroupForAsset } from "@/lib/vietnam/vn-sector-map"
import type { MarketAsset } from "@/types/market"

const INNER_ASPECT_LIMIT = 6
/** Match VietnamSectorGridHeatmap header: min(7%, 22px) with min-h 18px. */
const SECTOR_HEADER_RATIO = 0.07
const SECTOR_HEADER_MIN = 18 / 1080
const SECTOR_HEADER_MAX = 22 / 1080
const SECTOR_GAP = 0.002
/** Max root share for a single sector block (VN mode 1). */
export const VN_SECTOR_ROOT_MAX_SHARE = 0.25
const MIN_SQRT_VALUE = 0.0001
const MIN_LABEL_SECTOR_H = 0.035
const MIN_LABEL_SECTOR_W = 0.06
const MIN_LABEL_SECTOR_AREA = 0.003

export type VnTileTextTier = "large" | "medium" | "small" | "tiny"

export type VnSectorTileLayout = {
  asset: MarketAsset
  rect: TreemapRect
  textTier: VnTileTextTier
}

export type VnSectorBlockLayout = {
  id: VnSectorGroupId
  labelKey: string
  rect: TreemapRect
  hideLabel: boolean
  tiles: VnSectorTileLayout[]
}

export type VnSectorTreemapLayout = {
  sectors: VnSectorBlockLayout[]
}

/** @deprecated Use VnSectorTreemapLayout */
export type VnSectorGridLayout = VnSectorTreemapLayout

type SectorSquarifyItem = { kind: "stock"; asset: MarketAsset; weight: number }

function tradingValueMetric(asset: MarketAsset): number {
  return Math.max(vnTradingValueMetric(asset), 0)
}

const MIN_UNCLASSIFIED_ROOT_SHARE = 0.003

function sectorTotalMetric(assets: MarketAsset[]): number {
  return assets.reduce((sum, asset) => sum + tradingValueMetric(asset), 0)
}

function includeSectorInLayout(
  id: VnSectorGroupId,
  assets: MarketAsset[],
  allAssets: MarketAsset[],
): boolean {
  if (!assets.length) return false
  if (id !== "unclassified") return true

  const sectorMetric = sectorTotalMetric(assets)
  const totalMetric = sectorTotalMetric(allAssets)
  if (totalMetric <= 0) return false
  return sectorMetric / totalMetric >= MIN_UNCLASSIFIED_ROOT_SHARE
}

function aspectRatio(rect: TreemapRect): number {
  const minEdge = Math.max(Math.min(rect.w, rect.h), 1e-9)
  return Math.max(rect.w, rect.h) / minEdge
}

function textTierForSectorShare(share: number): VnTileTextTier {
  if (share >= 0.04) return "large"
  if (share >= 0.015) return "medium"
  if (share >= 0.006) return "small"
  return "tiny"
}

function insetRect(rect: TreemapRect, gap: number): TreemapRect {
  const inset = gap / 2
  return {
    x: rect.x + inset,
    y: rect.y + inset,
    w: Math.max(rect.w - gap, 0),
    h: Math.max(rect.h - gap, 0),
  }
}

function sectorHeaderHeight(sectorH: number): number {
  return Math.min(Math.max(sectorH * SECTOR_HEADER_RATIO, SECTOR_HEADER_MIN), SECTOR_HEADER_MAX)
}

function shouldHideSectorLabel(rect: TreemapRect): boolean {
  return (
    rect.h < MIN_LABEL_SECTOR_H ||
    rect.w < MIN_LABEL_SECTOR_W ||
    rect.w * rect.h < MIN_LABEL_SECTOR_AREA
  )
}

function worstAspect(placements: Array<{ rect: TreemapRect }>): number {
  if (!placements.length) return 0
  return Math.max(...placements.map((p) => aspectRatio(p.rect)))
}

function squarifyPlacements(
  inner: TreemapRect,
  items: SectorSquarifyItem[],
  allowEqualGrid: boolean,
): Array<{ item: SectorSquarifyItem; rect: TreemapRect }> {
  const nodes = packSquarified(
    items.map((item) => ({ data: item, value: Math.max(item.weight, MIN_SQRT_VALUE) })),
    inner,
    { allowEqualGridFallback: allowEqualGrid },
  )
  return nodes.map((node) => ({ item: node.data, rect: node.rect }))
}

function balancedGridFallback(
  inner: TreemapRect,
  items: SectorSquarifyItem[],
): Array<{ item: SectorSquarifyItem; rect: TreemapRect }> {
  const n = items.length
  if (!n || inner.w <= 0 || inner.h <= 0) return []

  const gap = SECTOR_GAP
  let bestCols = 1
  let bestRows = n
  let bestScore = Infinity

  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const cellW = Math.max((inner.w - gap * (cols - 1)) / cols, 0)
    const cellH = Math.max((inner.h - gap * (rows - 1)) / rows, 0)
    if (cellW <= 0 || cellH <= 0) continue
    const score = aspectRatio({ x: 0, y: 0, w: cellW, h: cellH })
    if (score < bestScore) {
      bestScore = score
      bestCols = cols
      bestRows = rows
    }
  }

  const cols = bestCols
  const rows = bestRows
  const cellW = Math.max((inner.w - gap * (cols - 1)) / cols, 0)
  const cellH = Math.max((inner.h - gap * (rows - 1)) / rows, 0)
  const sorted = [...items].sort((a, b) => b.weight - a.weight)

  return sorted.map((item, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    return {
      item,
      rect: {
        x: inner.x + col * (cellW + gap),
        y: inner.y + row * (cellH + gap),
        w: cellW,
        h: cellH,
      },
    }
  })
}

function layoutSectorTreemap(inner: TreemapRect, assets: MarketAsset[]): VnSectorTileLayout[] {
  if (!assets.length || inner.w <= 0 || inner.h <= 0) {
    return []
  }

  const rawMetrics = [...assets]
    .map((asset) => ({
      data: asset,
      metric: tradingValueMetric(asset),
    }))
    .sort((a, b) => b.metric - a.metric)

  const normalized = normalizeTreemapWeights(rawMetrics, {
    maxShare: MAX_STOCK_AREA_SHARE_IN_SECTOR,
    power: TREEMAP_COMPRESSION_POWER.VN_STOCK_IN_SECTOR,
  })

  const baseItems: SectorSquarifyItem[] = [...normalized]
    .sort((a, b) => b.weight - a.weight || b.metric - a.metric)
    .map((item) => ({
      kind: "stock" as const,
      asset: item.data,
      weight: item.weight,
    }))

  if (!baseItems.length) return []

  let chosen = squarifyPlacements(inner, baseItems, true)
  if (worstAspect(chosen) > INNER_ASPECT_LIMIT) {
    chosen = balancedGridFallback(inner, baseItems)
  }

  const innerArea = inner.w * inner.h || 1
  return chosen.map(({ item, rect }) => ({
    asset: item.asset,
    rect,
    textTier: textTierForSectorShare((rect.w * rect.h) / innerArea),
  }))
}

function layoutSectorBlock(
  rect: TreemapRect,
  id: VnSectorGroupId,
  assets: MarketAsset[],
): VnSectorBlockLayout {
  const hideLabel = shouldHideSectorLabel(rect)
  const headerH = hideLabel ? 0 : sectorHeaderHeight(rect.h)
  const inner: TreemapRect = {
    x: rect.x,
    y: rect.y + headerH,
    w: rect.w,
    h: Math.max(rect.h - headerH, 0),
  }

  const tiles = layoutSectorTreemap(inner, assets)

  return {
    id,
    labelKey: VN_SECTOR_GROUP_LABEL_KEYS[id],
    rect,
    hideLabel,
    tiles,
  }
}

function layoutRootSectors(
  present: VnSectorGroupId[],
  buckets: Map<VnSectorGroupId, MarketAsset[]>,
): Array<{ id: VnSectorGroupId; rect: TreemapRect }> {
  const root: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
  const rootRaw = present
    .map((id) => ({
      data: id,
      metric: (buckets.get(id) ?? []).reduce((sum, asset) => sum + tradingValueMetric(asset), 0),
    }))
    .sort((a, b) => b.metric - a.metric)
  const metricsInvalid = allMetricsInvalid(
    rootRaw.map((item) => ({ data: item.data, value: item.metric })),
  )

  const normalized = normalizeTreemapWeights(rootRaw, {
    maxShare: VN_SECTOR_ROOT_MAX_SHARE,
    power: TREEMAP_COMPRESSION_POWER.VN_SECTOR_ROOT,
  })
  const weighted = [...normalized]
    .sort((a, b) => b.weight - a.weight || b.metric - a.metric)
    .map((item) => ({
      data: item.data,
      value: item.weight,
      metric: item.metric,
    }))

  const nodes = packSquarified(weighted, root, {
    allowEqualGridFallback: metricsInvalid,
  })
  return nodes.map((node) => ({
    id: node.data,
    rect: insetRect(node.rect, SECTOR_GAP),
  }))
}

/**
 * Mode 1 — sector-grouped two-level treemap (trading-value-weighted).
 * Root: squarify sectors by power-compressed trading value, max 18%. Inner: max 12% per stock.
 */
export function buildSectorGroupedTreemap(assets: MarketAsset[]): VnSectorTreemapLayout {
  const buckets = new Map<VnSectorGroupId, MarketAsset[]>()
  for (const id of VN_SECTOR_GROUP_ORDER) {
    buckets.set(id, [])
  }
  for (const asset of assets) {
    const id = vnSectorGroupForAsset(asset)
    buckets.get(id)?.push(asset)
  }

  const present = VN_SECTOR_GROUP_ORDER.filter((id) =>
    includeSectorInLayout(id, buckets.get(id) ?? [], assets),
  )
  const rootPlacements = layoutRootSectors(present, buckets)

  const sectors: VnSectorBlockLayout[] = rootPlacements.map(({ id, rect }) => {
    const list = buckets.get(id) ?? []
    return layoutSectorBlock(rect, id, list)
  })

  return { sectors }
}

/** @deprecated Use buildSectorGroupedTreemap — volume sizing only */
export function buildVietnamSectorTreemapLayout(
  assets: MarketAsset[],
  _sizing: "volume" = "volume",
): VnSectorTreemapLayout {
  return buildSectorGroupedTreemap(assets)
}

/** @deprecated Use buildSectorGroupedTreemap */
export const buildVietnamSectorGridLayout = buildSectorGroupedTreemap

/** Sector tile counts for verification / docs. */
export function countVnSectorTreemapTiles(layout: VnSectorTreemapLayout): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const sector of layout.sectors) {
    counts[sector.id] = sector.tiles.length
  }
  counts.total = layout.sectors.reduce((s, sec) => s + sec.tiles.length, 0)
  return counts
}

/** @deprecated Use countVnSectorTreemapTiles */
export const countVnSectorGridTiles = countVnSectorTreemapTiles

export function analyzeVnSectorTreemapLayout(layout: VnSectorTreemapLayout): {
  maxTileAspect: number
  maxSectorAspect: number
  maxTileSectorAreaShare: number
  rootCoverage: number
} {
  let maxTileAspect = 0
  let maxSectorAspect = 0
  let maxTileSectorAreaShare = 0
  let rootCoverage = 0

  for (const sector of layout.sectors) {
    rootCoverage += sector.rect.w * sector.rect.h
    maxSectorAspect = Math.max(maxSectorAspect, aspectRatio(sector.rect))
    const headerH = sectorHeaderHeight(sector.rect.h)
    const innerArea = sector.rect.w * Math.max(sector.rect.h - headerH, 0)
    for (const tile of sector.tiles) {
      maxTileAspect = Math.max(maxTileAspect, aspectRatio(tile.rect))
      if (innerArea > 0) {
        maxTileSectorAreaShare = Math.max(
          maxTileSectorAreaShare,
          (tile.rect.w * tile.rect.h) / innerArea,
        )
      }
    }
  }

  return { maxTileAspect, maxSectorAspect, maxTileSectorAreaShare, rootCoverage }
}

export function tierToTileSize(tier: VnTileTextTier): "large" | "medium" | "small" | "tiny" {
  return tier
}
