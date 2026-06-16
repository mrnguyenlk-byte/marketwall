import { squarify, squarifyWithOrientation, type TreemapRect } from "@/lib/treemap/squarify"
import { assetSizeMetric } from "@/lib/treemap/heatmap-engine"
import {
  normalizeVnSectorGroup,
  VN_SECTOR_GROUP_LABEL_KEYS,
  VN_SECTOR_GROUP_ORDER,
  type VnSectorGroupId,
} from "@/lib/vietnam/sector-groups"
import type { VnHeatmapSizingMode } from "@/lib/vietnam/heatmap-sizing"
import type { MarketAsset } from "@/types/market"

/** Fixed sector importance (30% of blended root weight). */
const SECTOR_IMPORTANCE: Record<VnSectorGroupId, number> = {
  banking: 1.25,
  securities: 1.1,
  realEstate: 1.05,
  steel: 1.0,
  oilGas: 0.95,
  technology: 0.95,
  retail: 0.9,
  industrial: 0.85,
  utilities: 0.8,
  other: 0.7,
}

const METRIC_BLEND = 0.7
const IMPORTANCE_BLEND = 0.3
/** Soft cap: largest tile ≤ 12% of sector inner area (weight share). */
const MAX_TILE_IN_SECTOR = 0.12
const MAX_TILE_RETRY = 0.08
const MIN_TILE_IN_SECTOR = 0.02
const HARD_ASPECT_LIMIT = 3
const PREFERRED_ASPECT_MAX = 2.5
const SECTOR_HEADER_RATIO = 0.05
/** Normalized header bounds (~16–24px at 1080px viewport height). */
const SECTOR_HEADER_MIN = 16 / 1080
const SECTOR_HEADER_MAX = 24 / 1080
const SECTOR_GAP = 0.002
const MIN_SQRT_VALUE = 0.0001

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
  tiles: VnSectorTileLayout[]
  other?: VnSectorOtherBucket
}

export type VnSectorTreemapLayout = {
  sectors: VnSectorBlockLayout[]
}

/** @deprecated Use VnSectorTreemapLayout */
export type VnSectorGridLayout = VnSectorTreemapLayout

type WeightedStock = {
  asset: MarketAsset
  weight: number
}

type SectorSquarifyItem =
  | { kind: "stock"; asset: MarketAsset; weight: number }
  | { kind: "other"; symbols: string[]; weight: number }

function metricFor(asset: MarketAsset, sizing: VnHeatmapSizingMode): number {
  return Math.max(assetSizeMetric(asset, "vn", sizing), 0)
}

function aspectRatio(rect: TreemapRect): number {
  const minEdge = Math.max(Math.min(rect.w, rect.h), 1e-9)
  return Math.max(rect.w, rect.h) / minEdge
}

function textTierForSectorShare(share: number): VnTileTextTier {
  if (share >= 0.045) return "large"
  if (share >= 0.02) return "medium"
  if (share >= 0.008) return "small"
  return "tiny"
}

function insetRect(rect: TreemapRect, gap: number): TreemapRect {
  return {
    x: rect.x + gap,
    y: rect.y + gap,
    w: Math.max(rect.w - gap * 2, 0),
    h: Math.max(rect.h - gap * 2, 0),
  }
}

function sectorHeaderHeight(sectorH: number): number {
  return Math.min(Math.max(sectorH * SECTOR_HEADER_RATIO, SECTOR_HEADER_MIN), SECTOR_HEADER_MAX)
}

function prepareStockWeights(
  assets: MarketAsset[],
  sizing: VnHeatmapSizingMode,
  maxTileShare = MAX_TILE_IN_SECTOR,
): { visible: WeightedStock[]; other: MarketAsset[]; weightSum: number } {
  if (!assets.length) return { visible: [], other: [], weightSum: 1 }

  const sqrtItems = assets.map((asset) => {
    const raw = metricFor(asset, sizing)
    return { asset, sqrt: Math.sqrt(raw) }
  })

  let sum = sqrtItems.reduce((s, item) => s + item.sqrt, 0)
  if (sum <= 0) sum = 1

  const capped = sqrtItems.map((item) => ({
    asset: item.asset,
    weight: Math.min(item.sqrt, sum * maxTileShare),
  }))

  sum = capped.reduce((s, item) => s + item.weight, 0) || 1

  const visible: WeightedStock[] = []
  const other: MarketAsset[] = []

  for (const item of capped) {
    const share = item.weight / sum
    if (share >= MIN_TILE_IN_SECTOR) {
      visible.push(item)
    } else {
      other.push(item.asset)
    }
  }

  return { visible, other, weightSum: sum }
}

function flattenWeights(items: SectorSquarifyItem[], power: number): SectorSquarifyItem[] {
  if (power <= 0) return items
  const n = items.length || 1
  const uniform = 1 / n
  return items.map((item) => ({
    ...item,
    weight: item.weight * (1 - power) + uniform * power,
  }))
}

function layoutScore(leaves: TreemapRect[]): number {
  let worst = 0
  let overPreferred = 0
  for (const rect of leaves) {
    const ar = aspectRatio(rect)
    worst = Math.max(worst, ar)
    if (ar > PREFERRED_ASPECT_MAX) overPreferred++
  }
  if (worst > HARD_ASPECT_LIMIT) return worst * 100 + overPreferred * 10
  return worst + overPreferred * 0.5
}

function worstAspect(placements: Array<{ rect: TreemapRect }>): number {
  return Math.max(...placements.map((p) => aspectRatio(p.rect)), 0)
}

function capItemWeights(items: SectorSquarifyItem[], maxShare: number): SectorSquarifyItem[] {
  const sum = items.reduce((s, item) => s + item.weight, 0) || 1
  return items.map((item) => ({
    ...item,
    weight: Math.min(item.weight, sum * maxShare),
  }))
}

function squarifyPlacements(
  inner: TreemapRect,
  items: SectorSquarifyItem[],
  horizontal: boolean,
): Array<{ item: SectorSquarifyItem; rect: TreemapRect }> {
  const nodes = squarifyWithOrientation(
    items.map((item) => ({ data: item, value: Math.max(item.weight, MIN_SQRT_VALUE) })),
    inner,
    horizontal,
    MIN_SQRT_VALUE,
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

function trySquarifyInner(
  inner: TreemapRect,
  baseItems: SectorSquarifyItem[],
  maxShare: number,
): Array<{ item: SectorSquarifyItem; rect: TreemapRect }> {
  const attempts: Array<{ flatten: number; horizontal: boolean }> = [
    { flatten: 0, horizontal: inner.w >= inner.h },
    { flatten: 0, horizontal: inner.w < inner.h },
    { flatten: 0.25, horizontal: inner.w >= inner.h },
    { flatten: 0.25, horizontal: inner.w < inner.h },
    { flatten: 0.5, horizontal: inner.w >= inner.h },
    { flatten: 0.65, horizontal: inner.w < inner.h },
  ]

  let best: {
    placements: Array<{ item: SectorSquarifyItem; rect: TreemapRect }>
    score: number
  } | null = null

  for (const attempt of attempts) {
    let items = maxShare < MAX_TILE_IN_SECTOR ? capItemWeights(baseItems, maxShare) : baseItems
    if (attempt.flatten > 0) {
      items = flattenWeights(items, attempt.flatten)
    }

    const placements = squarifyPlacements(inner, items, attempt.horizontal)
    const score = layoutScore(placements.map((p) => p.rect))
    const worst = worstAspect(placements)

    if (worst <= HARD_ASPECT_LIMIT && (!best || score < best.score)) {
      best = { placements, score }
    }
    if (best && best.score <= PREFERRED_ASPECT_MAX) break
  }

  if (best) return best.placements

  const fallback = squarifyPlacements(inner, baseItems, inner.w >= inner.h)
  if (worstAspect(fallback) <= HARD_ASPECT_LIMIT) return fallback

  return balancedGridFallback(inner, baseItems)
}

function layoutSectorTreemap(
  inner: TreemapRect,
  stocks: WeightedStock[],
  otherSymbols: string[],
  otherWeight: number,
): { tiles: VnSectorTileLayout[]; other?: VnSectorOtherBucket } {
  if ((!stocks.length && !otherSymbols.length) || inner.w <= 0 || inner.h <= 0) {
    return { tiles: [] }
  }

  const baseItems: SectorSquarifyItem[] = stocks.map((stock) => ({
    kind: "stock",
    asset: stock.asset,
    weight: stock.weight,
  }))
  if (otherSymbols.length) {
    baseItems.push({
      kind: "other",
      symbols: otherSymbols,
      weight: Math.max(otherWeight, MIN_SQRT_VALUE),
    })
  }

  let chosen = trySquarifyInner(inner, baseItems, MAX_TILE_IN_SECTOR)
  if (worstAspect(chosen) > HARD_ASPECT_LIMIT) {
    chosen = trySquarifyInner(inner, baseItems, MAX_TILE_RETRY)
  }
  if (worstAspect(chosen) > HARD_ASPECT_LIMIT || aspectRatio(inner) > HARD_ASPECT_LIMIT) {
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
  sizing: VnHeatmapSizingMode,
): VnSectorBlockLayout {
  const headerH = sectorHeaderHeight(rect.h)
  const inner: TreemapRect = {
    x: rect.x,
    y: rect.y + headerH,
    w: rect.w,
    h: Math.max(rect.h - headerH, 0),
  }

  const { visible, other, weightSum } = prepareStockWeights(assets, sizing)
  const otherWeight = Math.max(
    weightSum * MIN_TILE_IN_SECTOR,
    other.reduce((s, asset) => s + Math.sqrt(Math.max(metricFor(asset, sizing), 0)), 0) * 0.5,
  )
  const { tiles, other: otherBucket } = layoutSectorTreemap(
    inner,
    visible,
    other.map((a) => a.symbol),
    otherWeight,
  )

  return {
    id,
    labelKey: VN_SECTOR_GROUP_LABEL_KEYS[id],
    rect,
    tiles,
    other: otherBucket,
  }
}

function rootSectorValues(
  present: VnSectorGroupId[],
  weights: Map<VnSectorGroupId, number>,
  flatten: number,
): number[] {
  const raw = present.map((id) => Math.max(weights.get(id) ?? MIN_SQRT_VALUE, MIN_SQRT_VALUE))
  const sum = raw.reduce((s, w) => s + w, 0) || 1
  const normalized = raw.map((w) => w / sum)
  if (flatten <= 0) return normalized.map((w) => Math.sqrt(w))
  const uniform = 1 / present.length
  return normalized.map((w) => {
    const blended = w * (1 - flatten) + uniform * flatten
    return Math.sqrt(blended)
  })
}

function balancedRootSectors(
  present: VnSectorGroupId[],
): Array<{ id: VnSectorGroupId; rect: TreemapRect }> {
  const n = present.length
  if (!n) return []
  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  const gap = SECTOR_GAP
  const cellW = Math.max((1 - gap * (cols - 1)) / cols, 0)
  const cellH = Math.max((1 - gap * (rows - 1)) / rows, 0)
  return present.map((id, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    return {
      id,
      rect: {
        x: col * (cellW + gap),
        y: row * (cellH + gap),
        w: cellW,
        h: cellH,
      },
    }
  })
}

const ROOT_GRID_FALLBACK_ASPECT = 10

function layoutRootSectors(
  present: VnSectorGroupId[],
  weights: Map<VnSectorGroupId, number>,
): Array<{ id: VnSectorGroupId; rect: TreemapRect }> {
  const root: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
  const flatAttempts = [0, 0.15, 0.3, 0.45]

  let best: Array<{ id: VnSectorGroupId; rect: TreemapRect }> | null = null
  let bestMaxAspect = Infinity

  for (const flatten of flatAttempts) {
    const values = rootSectorValues(present, weights, flatten)
    const nodes = squarify(
      present.map((id, index) => ({
        data: id,
        value: values[index],
      })),
      root,
      MIN_SQRT_VALUE,
    )
    const placements = nodes.map((node) => ({
      id: node.data,
      rect: insetRect(node.rect, SECTOR_GAP),
    }))
    const maxAr = Math.max(...placements.map((p) => aspectRatio(p.rect)), 0)

    if (maxAr < bestMaxAspect) {
      best = placements
      bestMaxAspect = maxAr
    }
  }

  if (!best || bestMaxAspect > ROOT_GRID_FALLBACK_ASPECT) {
    return balancedRootSectors(present)
  }
  return best
}

function blendedSectorWeights(
  buckets: Map<VnSectorGroupId, MarketAsset[]>,
  sizing: VnHeatmapSizingMode,
): Map<VnSectorGroupId, number> {
  const present = [...buckets.entries()].filter(([, list]) => list.length > 0)
  const sqrtTotals = new Map<VnSectorGroupId, number>()

  let grandSqrt = 0
  for (const [id, list] of present) {
    const sum = list.reduce((s, asset) => s + Math.sqrt(metricFor(asset, sizing)), 0)
    sqrtTotals.set(id, sum)
    grandSqrt += sum
  }

  const importanceSum = present.reduce((s, [id]) => s + SECTOR_IMPORTANCE[id], 0) || 1
  const weights = new Map<VnSectorGroupId, number>()

  for (const [id] of present) {
    const normalizedMetric = grandSqrt > 0 ? (sqrtTotals.get(id) ?? 0) / grandSqrt : 0
    const normalizedImportance = SECTOR_IMPORTANCE[id] / importanceSum
    weights.set(
      id,
      METRIC_BLEND * normalizedMetric + IMPORTANCE_BLEND * normalizedImportance,
    )
  }

  return weights
}

export function buildVietnamSectorTreemapLayout(
  assets: MarketAsset[],
  sizing: VnHeatmapSizingMode = "tradingValue",
): VnSectorTreemapLayout {
  const buckets = new Map<VnSectorGroupId, MarketAsset[]>()
  for (const id of VN_SECTOR_GROUP_ORDER) {
    buckets.set(id, [])
  }
  for (const asset of assets) {
    const id = normalizeVnSectorGroup(asset.sector)
    buckets.get(id)?.push(asset)
  }

  const weights = blendedSectorWeights(buckets, sizing)
  const present = VN_SECTOR_GROUP_ORDER.filter((id) => (buckets.get(id)?.length ?? 0) > 0)
  const rootPlacements = layoutRootSectors(present, weights)

  const sectors: VnSectorBlockLayout[] = rootPlacements.map(({ id, rect }) => {
    const list = buckets.get(id) ?? []
    return layoutSectorBlock(rect, id, list, sizing)
  })

  return { sectors }
}

/** @deprecated Use buildVietnamSectorTreemapLayout */
export const buildVietnamSectorGridLayout = buildVietnamSectorTreemapLayout

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
} {
  let maxTileAspect = 0
  let maxSectorAspect = 0
  let maxTileSectorAreaShare = 0

  for (const sector of layout.sectors) {
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

  return { maxTileAspect, maxSectorAspect, maxTileSectorAreaShare }
}

export function tierToTileSize(tier: VnTileTextTier): "large" | "medium" | "small" | "tiny" {
  return tier
}
