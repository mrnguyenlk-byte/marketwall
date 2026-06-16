import { squarifyWithOrientation, type TreemapRect } from "@/lib/treemap/squarify"
import { assetSizeMetric } from "@/lib/treemap/heatmap-engine"
import {
  normalizeVnSectorGroup,
  VN_SECTOR_GROUP_LABEL_KEYS,
  type VnSectorGroupId,
} from "@/lib/vietnam/sector-groups"
import type { VnHeatmapSizingMode } from "@/lib/vietnam/heatmap-sizing"
import type { MarketAsset } from "@/types/market"

/** Row 1: Banking, Securities, Real Estate, Steel */
export const VN_SECTOR_GRID_ROW_1: VnSectorGroupId[] = [
  "banking",
  "securities",
  "realEstate",
  "steel",
]

/** Row 2: Oil & Gas, Retail, Technology, Industrial (KCN), Utilities, Other */
export const VN_SECTOR_GRID_ROW_2: VnSectorGroupId[] = [
  "oilGas",
  "retail",
  "technology",
  "industrial",
  "utilities",
  "other",
]

/** Fixed minimum sector importance (40% of blended weight). */
const SECTOR_IMPORTANCE: Record<VnSectorGroupId, number> = {
  banking: 1.25,
  securities: 1.1,
  realEstate: 1.05,
  steel: 1.0,
  oilGas: 0.95,
  retail: 0.9,
  technology: 0.95,
  industrial: 0.85,
  utilities: 0.8,
  other: 0.7,
}

const VALUE_BLEND = 0.6
const IMPORTANCE_BLEND = 0.4
/** Soft cap: largest tile ≤ 12% of sector inner area (weight share). */
const MAX_TILE_IN_SECTOR = 0.12
const MIN_TILE_IN_SECTOR = 0.02
const HARD_ASPECT_LIMIT = 3
const PREFERRED_ASPECT_MAX = 2.5
const SECTOR_HEADER_RATIO = 0.07
const GAP = 0.002
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

export type VnSectorGridLayout = {
  sectors: VnSectorBlockLayout[]
}

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

function splitHorizontal(rect: TreemapRect, weights: number[]): TreemapRect[] {
  const total = weights.reduce((s, w) => s + w, 0) || 1
  let x = rect.x
  const out: TreemapRect[] = []
  for (let i = 0; i < weights.length; i++) {
    const w = (weights[i] / total) * rect.w
    out.push({ x, y: rect.y, w: Math.max(w - (i < weights.length - 1 ? GAP : 0), 0), h: rect.h })
    x += w
  }
  return out
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

function squarifySectorItems(
  inner: TreemapRect,
  items: SectorSquarifyItem[],
): Array<{ item: SectorSquarifyItem; rect: TreemapRect }> {
  /** Tall sector columns: stack horizontal bands (vertical slices). Wide bands: side-by-side. */
  const preferHorizontal = inner.w >= inner.h
  const nodes = squarifyWithOrientation(
    items.map((item) => ({ data: item, value: Math.max(item.weight, MIN_SQRT_VALUE) })),
    inner,
    preferHorizontal,
    MIN_SQRT_VALUE,
  )
  return nodes.map((node) => ({ item: node.data, rect: node.rect }))
}

function capItemWeights(items: SectorSquarifyItem[], maxShare: number): SectorSquarifyItem[] {
  const sum = items.reduce((s, item) => s + item.weight, 0) || 1
  return items.map((item) => ({
    ...item,
    weight: Math.min(item.weight, sum * maxShare),
  }))
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

  const attempts: Array<{ flatten: number; maxShare: number; horizontal: boolean }> = [
    { flatten: 0, maxShare: MAX_TILE_IN_SECTOR, horizontal: inner.w >= inner.h },
    { flatten: 0, maxShare: MAX_TILE_IN_SECTOR, horizontal: inner.w < inner.h },
    { flatten: 0.25, maxShare: MAX_TILE_IN_SECTOR, horizontal: inner.w >= inner.h },
    { flatten: 0.25, maxShare: MAX_TILE_IN_SECTOR, horizontal: inner.w < inner.h },
    { flatten: 0.5, maxShare: MAX_TILE_IN_SECTOR, horizontal: inner.w >= inner.h },
    { flatten: 0.65, maxShare: 0.1, horizontal: inner.w < inner.h },
  ]

  let best: {
    placements: Array<{ item: SectorSquarifyItem; rect: TreemapRect }>
    score: number
  } | null = null

  for (const attempt of attempts) {
    let items = baseItems
    if (attempt.maxShare < MAX_TILE_IN_SECTOR) {
      items = capItemWeights(baseItems, attempt.maxShare)
    }
    if (attempt.flatten > 0) {
      items = flattenWeights(items, attempt.flatten)
    }

    const placements = squarifyWithOrientation(
      items.map((item) => ({ data: item, value: Math.max(item.weight, MIN_SQRT_VALUE) })),
      inner,
      attempt.horizontal,
      MIN_SQRT_VALUE,
    ).map((node) => ({ item: node.data, rect: node.rect }))
    const score = layoutScore(placements.map((p) => p.rect))
    const worst = Math.max(...placements.map((p) => aspectRatio(p.rect)), 0)

    if (worst <= HARD_ASPECT_LIMIT && (!best || score < best.score)) {
      best = { placements, score }
    }
    if (best && best.score <= PREFERRED_ASPECT_MAX) break
  }

  const chosen =
    best?.placements ??
    squarifySectorItems(inner, baseItems)
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
  const headerH = Math.min(rect.h * SECTOR_HEADER_RATIO, 0.032)
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

function blendedSectorWeights(
  buckets: Map<VnSectorGroupId, MarketAsset[]>,
  sizing: VnHeatmapSizingMode,
): Map<VnSectorGroupId, number> {
  const present = [...buckets.entries()].filter(([, list]) => list.length > 0)
  const valueTotals = new Map<VnSectorGroupId, number>()

  let grandValue = 0
  for (const [id, list] of present) {
    const sum = list.reduce((s, asset) => s + metricFor(asset, sizing), 0)
    valueTotals.set(id, sum)
    grandValue += sum
  }

  const importanceSum = present.reduce((s, [id]) => s + SECTOR_IMPORTANCE[id], 0) || 1
  const weights = new Map<VnSectorGroupId, number>()

  for (const [id] of present) {
    const normalizedValue = grandValue > 0 ? (valueTotals.get(id) ?? 0) / grandValue : 0
    const normalizedImportance = SECTOR_IMPORTANCE[id] / importanceSum
    weights.set(id, VALUE_BLEND * normalizedValue + IMPORTANCE_BLEND * normalizedImportance)
  }

  return weights
}

export function buildVietnamSectorGridLayout(
  assets: MarketAsset[],
  sizing: VnHeatmapSizingMode = "tradingValue",
): VnSectorGridLayout {
  const buckets = new Map<VnSectorGroupId, MarketAsset[]>()
  for (const id of [...VN_SECTOR_GRID_ROW_1, ...VN_SECTOR_GRID_ROW_2]) {
    buckets.set(id, [])
  }
  for (const asset of assets) {
    const id = normalizeVnSectorGroup(asset.sector)
    buckets.get(id)?.push(asset)
  }

  const weights = blendedSectorWeights(buckets, sizing)
  const row1Ids = VN_SECTOR_GRID_ROW_1.filter((id) => (buckets.get(id)?.length ?? 0) > 0)
  const row2Ids = VN_SECTOR_GRID_ROW_2.filter((id) => (buckets.get(id)?.length ?? 0) > 0)

  const row1Weight = row1Ids.reduce((s, id) => s + (weights.get(id) ?? 0), 0)
  const row2Weight = row2Ids.reduce((s, id) => s + (weights.get(id) ?? 0), 0)
  const totalRowWeight = row1Weight + row2Weight || 1

  const row1H = (row1Weight / totalRowWeight) * (1 - GAP)
  const row2H = 1 - row1H - GAP

  const sectors: VnSectorBlockLayout[] = []

  if (row1Ids.length) {
    const rowRect: TreemapRect = { x: 0, y: 0, w: 1, h: row1H }
    const rowWeights = row1Ids.map((id) => weights.get(id) ?? 0)
    const rects = splitHorizontal(rowRect, rowWeights)
    row1Ids.forEach((id, index) => {
      const list = buckets.get(id) ?? []
      sectors.push(layoutSectorBlock(insetRect(rects[index], GAP), id, list, sizing))
    })
  }

  if (row2Ids.length) {
    const rowRect: TreemapRect = { x: 0, y: row1H + GAP, w: 1, h: row2H }
    const rowWeights = row2Ids.map((id) => weights.get(id) ?? 0)
    const rects = splitHorizontal(rowRect, rowWeights)
    row2Ids.forEach((id, index) => {
      const list = buckets.get(id) ?? []
      sectors.push(layoutSectorBlock(insetRect(rects[index], GAP), id, list, sizing))
    })
  }

  return { sectors }
}

/** Sector tile counts for verification / docs. */
export function countVnSectorGridTiles(layout: VnSectorGridLayout): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const sector of layout.sectors) {
    counts[sector.id] = sector.tiles.length + (sector.other ? 1 : 0)
  }
  counts.total = layout.sectors.reduce((s, sec) => s + sec.tiles.length, 0)
  return counts
}

export function tierToTileSize(tier: VnTileTextTier): "large" | "medium" | "small" | "tiny" {
  return tier
}
