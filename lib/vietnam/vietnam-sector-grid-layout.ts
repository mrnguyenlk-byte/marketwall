import {
  allMetricsInvalid,
  KHAC_MAX_SHARE,
  MAX_SECTOR_AREA_SHARE,
  MAX_STOCK_AREA_SHARE_IN_SECTOR,
  MIN_VISIBLE_SHARE,
  normalizeTreemapWeights,
  packSquarified,
  splitKhacBucket,
  TREEMAP_COMPRESSION_POWER,
} from "@/lib/treemap/treemap-builders"
import type { TreemapRect } from "@/lib/treemap/squarify"
import { vnTradingValueMetric } from "@/lib/treemap/heatmap-engine"
import {
  normalizeVnSectorGroup,
  VN_SECTOR_GROUP_LABEL_KEYS,
  VN_SECTOR_GROUP_ORDER,
  type VnSectorGroupId,
} from "@/lib/vietnam/sector-groups"
import type { MarketAsset } from "@/types/market"

const INNER_ASPECT_LIMIT = 6
/** Match VietnamSectorGridHeatmap header: min(7%, 22px) with min-h 18px. */
const SECTOR_HEADER_RATIO = 0.07
const SECTOR_HEADER_MIN = 18 / 1080
const SECTOR_HEADER_MAX = 22 / 1080
const SECTOR_GAP = 0.002
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

export type VnSectorOtherBucket = {
  symbols: string[]
  rect: TreemapRect
  weight: number
}

export type VnSectorBlockLayout = {
  id: VnSectorGroupId
  labelKey: string
  rect: TreemapRect
  hideLabel: boolean
  tiles: VnSectorTileLayout[]
  other?: VnSectorOtherBucket
}

export type VnSectorTreemapLayout = {
  sectors: VnSectorBlockLayout[]
}

/** @deprecated Use VnSectorTreemapLayout */
export type VnSectorGridLayout = VnSectorTreemapLayout

type SectorSquarifyItem =
  | { kind: "stock"; asset: MarketAsset; weight: number }
  | { kind: "other"; symbols: string[]; weight: number }

function tradingValueMetric(asset: MarketAsset): number {
  return Math.max(vnTradingValueMetric(asset), 0)
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

function layoutSectorTreemap(
  inner: TreemapRect,
  assets: MarketAsset[],
): { tiles: VnSectorTileLayout[]; other?: VnSectorOtherBucket } {
  if (!assets.length || inner.w <= 0 || inner.h <= 0) {
    return { tiles: [] }
  }

  const rawMetrics = assets.map((asset) => ({
    data: asset,
    metric: tradingValueMetric(asset),
  }))

  const normalized = normalizeTreemapWeights(rawMetrics, {
    maxShare: MAX_STOCK_AREA_SHARE_IN_SECTOR,
    power: TREEMAP_COMPRESSION_POWER.VN_STOCK_IN_SECTOR,
  })
  const { items: visible, khac } = splitKhacBucket(normalized, {
    minVisibleShare: MIN_VISIBLE_SHARE,
    khacMaxShare: KHAC_MAX_SHARE,
  })

  const baseItems: SectorSquarifyItem[] = visible.map((item) => ({
    kind: "stock",
    asset: item.data,
    weight: item.weight,
  }))
  if (khac) {
    baseItems.push({
      kind: "other",
      symbols: khac.items.map((asset) => asset.symbol),
      weight: khac.weight,
    })
  }

  if (!baseItems.length) return { tiles: [] }

  let chosen = squarifyPlacements(inner, baseItems, true)
  if (worstAspect(chosen) > INNER_ASPECT_LIMIT) {
    chosen = balancedGridFallback(inner, baseItems)
  }

  const innerArea = inner.w * inner.h || 1
  const tiles: VnSectorTileLayout[] = []
  let otherBucket: VnSectorOtherBucket | undefined

  for (const { item, rect } of chosen) {
    const share = (rect.w * rect.h) / innerArea
    if (item.kind === "stock") {
      tiles.push({
        asset: item.asset,
        rect,
        textTier: textTierForSectorShare(share),
      })
    } else {
      otherBucket = { symbols: item.symbols, rect, weight: item.weight }
    }
  }

  return { tiles, other: otherBucket }
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

  const { tiles, other: otherBucket } = layoutSectorTreemap(inner, assets)

  return {
    id,
    labelKey: VN_SECTOR_GROUP_LABEL_KEYS[id],
    rect,
    hideLabel,
    tiles,
    other: otherBucket,
  }
}

function layoutRootSectors(
  present: VnSectorGroupId[],
  buckets: Map<VnSectorGroupId, MarketAsset[]>,
): Array<{ id: VnSectorGroupId; rect: TreemapRect }> {
  const root: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
  const rootRaw = present.map((id) => ({
    data: id,
    metric: (buckets.get(id) ?? []).reduce((sum, asset) => sum + tradingValueMetric(asset), 0),
  }))
  const metricsInvalid = allMetricsInvalid(
    rootRaw.map((item) => ({ data: item.data, value: item.metric })),
  )

  const normalized = normalizeTreemapWeights(rootRaw, {
    maxShare: MAX_SECTOR_AREA_SHARE,
    power: TREEMAP_COMPRESSION_POWER.VN_SECTOR_ROOT,
  })
  const weighted = normalized.map((item) => ({
    data: item.data,
    value: item.weight,
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
 * Root: squarify sectors by power-compressed trading value, max 22%. Inner: max 18% per stock.
 */
export function buildSectorGroupedTreemap(assets: MarketAsset[]): VnSectorTreemapLayout {
  const buckets = new Map<VnSectorGroupId, MarketAsset[]>()
  for (const id of VN_SECTOR_GROUP_ORDER) {
    buckets.set(id, [])
  }
  for (const asset of assets) {
    const id = normalizeVnSectorGroup(asset.sector)
    buckets.get(id)?.push(asset)
  }

  const present = VN_SECTOR_GROUP_ORDER.filter((id) => (buckets.get(id)?.length ?? 0) > 0)
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
    counts[sector.id] = sector.tiles.length + (sector.other ? 1 : 0)
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
    if (sector.other && innerArea > 0) {
      maxTileSectorAreaShare = Math.max(
        maxTileSectorAreaShare,
        (sector.other.rect.w * sector.other.rect.h) / innerArea,
      )
    }
  }

  return { maxTileAspect, maxSectorAspect, maxTileSectorAreaShare, rootCoverage }
}

export function tierToTileSize(tier: VnTileTextTier): "large" | "medium" | "small" | "tiny" {
  return tier
}
