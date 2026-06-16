import type { TreemapRect } from "@/lib/treemap/squarify"
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
const MAX_TILE_IN_SECTOR = 0.28
const MIN_TILE_IN_SECTOR = 0.02
const MAX_ASPECT_RATIO = 3.5
const SECTOR_HEADER_RATIO = 0.07
const GAP = 0.002

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

function metricFor(asset: MarketAsset, sizing: VnHeatmapSizingMode): number {
  return Math.max(assetSizeMetric(asset, "vn", sizing), 0)
}

function textTierForArea(area: number): VnTileTextTier {
  if (area >= 0.045) return "large"
  if (area >= 0.02) return "medium"
  if (area >= 0.008) return "small"
  return "tiny"
}

function aspectRatio(rect: TreemapRect): number {
  const minEdge = Math.max(Math.min(rect.w, rect.h), 1e-9)
  return Math.max(rect.w, rect.h) / minEdge
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
): { visible: WeightedStock[]; other: MarketAsset[] } {
  if (!assets.length) return { visible: [], other: [] }

  const sqrtItems = assets.map((asset) => {
    const raw = metricFor(asset, sizing)
    return { asset, sqrt: Math.sqrt(raw) }
  })

  let sum = sqrtItems.reduce((s, item) => s + item.sqrt, 0)
  if (sum <= 0) sum = 1

  let capped = sqrtItems.map((item) => ({
    asset: item.asset,
    weight: Math.min(item.sqrt, sum * MAX_TILE_IN_SECTOR),
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

  const visibleSum = visible.reduce((s, item) => s + item.weight, 0) || 1
  return {
    visible: visible.map((item) => ({ ...item, weight: item.weight / visibleSum })),
    other,
  }
}

function cellAspect(inner: TreemapRect, cols: number, rows: number): number {
  const cellW = inner.w / cols
  const cellH = inner.h / rows
  return Math.max(cellW / cellH, cellH / cellW)
}

function findPlacement(
  occupied: boolean[][],
  cols: number,
  rows: number,
  targetCells: number,
): { col: number; row: number; colSpan: number; rowSpan: number } | null {
  let best: { col: number; row: number; colSpan: number; rowSpan: number; score: number } | null =
    null

  for (let rowSpan = 1; rowSpan <= rows; rowSpan++) {
    for (let colSpan = 1; colSpan <= cols; colSpan++) {
      if (colSpan * rowSpan < targetCells) continue
      if (colSpan * rowSpan > targetCells + 2) continue
      const ar = Math.max(colSpan / rowSpan, rowSpan / colSpan)
      if (ar > MAX_ASPECT_RATIO) continue

      for (let row = 0; row <= rows - rowSpan; row++) {
        for (let col = 0; col <= cols - colSpan; col++) {
          let fits = true
          for (let r = row; r < row + rowSpan && fits; r++) {
            for (let c = col; c < col + colSpan; c++) {
              if (occupied[r][c]) fits = false
            }
          }
          if (!fits) continue
          const score = Math.abs(colSpan * rowSpan - targetCells) + ar * 0.1
          if (!best || score < best.score) {
            best = { col, row, colSpan, rowSpan, score }
          }
        }
      }
    }
  }

  return best ? { col: best.col, row: best.row, colSpan: best.colSpan, rowSpan: best.rowSpan } : null
}

function layoutSectorTiles(
  inner: TreemapRect,
  stocks: WeightedStock[],
  otherSymbols: string[],
): { tiles: VnSectorTileLayout[]; other?: VnSectorOtherBucket } {
  const placements: VnSectorTileLayout[] = []
  const totalItems = stocks.length + (otherSymbols.length ? 1 : 0)
  if (!totalItems || inner.w <= 0 || inner.h <= 0) {
    return { tiles: placements }
  }

  const aspect = inner.w / Math.max(inner.h, 1e-6)
  let cols = Math.max(2, Math.round(Math.sqrt(totalItems * aspect)))
  let rows = Math.max(1, Math.ceil(totalItems / cols))

  for (let i = 0; i < 16; i++) {
    if (cellAspect(inner, cols, rows) <= MAX_ASPECT_RATIO) break
    if (cols <= rows) cols++
    else rows++
  }

  const occupied = Array.from({ length: rows }, () => Array(cols).fill(false))
  const gridCells = cols * rows
  const weightSum = stocks.reduce((s, st) => s + st.weight, 0) + (otherSymbols.length ? MIN_TILE_IN_SECTOR : 0)

  const queue: Array<{ kind: "stock"; stock: WeightedStock } | { kind: "other" }> = [
    ...stocks.map((stock) => ({ kind: "stock" as const, stock })),
  ]
  if (otherSymbols.length) queue.push({ kind: "other" })

  queue.sort((a, b) => {
    const wa = a.kind === "stock" ? a.stock.weight : MIN_TILE_IN_SECTOR
    const wb = b.kind === "stock" ? b.stock.weight : MIN_TILE_IN_SECTOR
    return wb - wa
  })

  let otherBucket: VnSectorOtherBucket | undefined

  for (const entry of queue) {
    const weight = entry.kind === "stock" ? entry.stock.weight : MIN_TILE_IN_SECTOR
    const targetCells = Math.max(
      1,
      Math.min(
        gridCells,
        Math.round((weight / weightSum) * gridCells),
      ),
    )

    const placement =
      findPlacement(occupied, cols, rows, targetCells) ??
      findPlacement(occupied, cols, rows, 1)

    if (!placement) continue

    const rect: TreemapRect = {
      x: inner.x + (placement.col / cols) * inner.w,
      y: inner.y + (placement.row / rows) * inner.h,
      w: (placement.colSpan / cols) * inner.w,
      h: (placement.rowSpan / rows) * inner.h,
    }

    if (aspectRatio(rect) > MAX_ASPECT_RATIO) continue

    for (let r = placement.row; r < placement.row + placement.rowSpan; r++) {
      for (let c = placement.col; c < placement.col + placement.colSpan; c++) {
        occupied[r][c] = true
      }
    }

    if (entry.kind === "stock") {
      placements.push({
        asset: entry.stock.asset,
        rect,
        textTier: textTierForArea(rect.w * rect.h),
      })
    } else {
      otherBucket = { symbols: otherSymbols, rect, weight: MIN_TILE_IN_SECTOR }
    }
  }

  return { tiles: placements, other: otherBucket }
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

  const { visible, other } = prepareStockWeights(assets, sizing)
  const { tiles, other: otherBucket } = layoutSectorTiles(inner, visible, other.map((a) => a.symbol))

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

  const container: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
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

export function tierToTileSize(tier: VnTileTextTier): "large" | "medium" | "small" | "tiny" {
  return tier
}
