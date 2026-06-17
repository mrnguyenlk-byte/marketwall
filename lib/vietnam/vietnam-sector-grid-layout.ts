import { allMetricsInvalid, packSquarified } from "@/lib/treemap/treemap-builders"
import type { TreemapRect } from "@/lib/treemap/squarify"
import { assetSizeMetric } from "@/lib/treemap/heatmap-engine"
import {
  normalizeVnSectorGroup,
  VN_SECTOR_GROUP_LABEL_KEYS,
  VN_SECTOR_GROUP_ORDER,
  type VnSectorGroupId,
} from "@/lib/vietnam/sector-groups"
import type { MarketAsset } from "@/types/market"

/** Soft cap: largest tile ≤ 12% of sector inner area (weight share). */
const MAX_TILE_IN_SECTOR = 0.12
const MAX_TILE_RETRY = 0.08
const MIN_TILE_IN_SECTOR = 0.02
const HARD_ASPECT_LIMIT = 3
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

type WeightedStock = {
  asset: MarketAsset
  weight: number
}

type SectorSquarifyItem =
  | { kind: "stock"; asset: MarketAsset; weight: number }
  | { kind: "other"; symbols: string[]; weight: number }

function volumeMetric(asset: MarketAsset): number {
  return Math.max(assetSizeMetric(asset, "vn", "volume"), 0)
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

function prepareStockWeights(
  assets: MarketAsset[],
  maxTileShare = MAX_TILE_IN_SECTOR,
): { visible: WeightedStock[]; other: MarketAsset[]; weightSum: number } {
  if (!assets.length) return { visible: [], other: [], weightSum: 1 }

  const sqrtItems = assets.map((asset) => {
    const raw = volumeMetric(asset)
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
): Array<{ item: SectorSquarifyItem; rect: TreemapRect }> {
  const nodes = packSquarified(
    items.map((item) => ({ data: item, value: Math.max(item.weight, MIN_SQRT_VALUE) })),
    inner,
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
  const items = maxShare < MAX_TILE_IN_SECTOR ? capItemWeights(baseItems, maxShare) : baseItems
  const placements = squarifyPlacements(inner, items)
  if (worstAspect(placements) <= HARD_ASPECT_LIMIT) return placements

  const uncapped = squarifyPlacements(inner, baseItems)
  if (worstAspect(uncapped) <= HARD_ASPECT_LIMIT) return uncapped

  const rawWeights = baseItems.map((item) => ({ data: item, value: item.weight }))
  if (allMetricsInvalid(rawWeights)) return balancedGridFallback(inner, baseItems)

  return uncapped
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
  if (
    worstAspect(chosen) > HARD_ASPECT_LIMIT &&
    allMetricsInvalid(baseItems.map((item) => ({ data: item, value: item.weight })))
  ) {
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

  const { visible, other, weightSum } = prepareStockWeights(assets)
  const otherWeight = Math.max(
    weightSum * MIN_TILE_IN_SECTOR,
    other.reduce((s, asset) => s + Math.sqrt(volumeMetric(asset)), 0) * 0.5,
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
    hideLabel,
    tiles,
    other: otherBucket,
  }
}

function sectorRootWeights(buckets: Map<VnSectorGroupId, MarketAsset[]>): Map<VnSectorGroupId, number> {
  const weights = new Map<VnSectorGroupId, number>()
  for (const [id, list] of buckets.entries()) {
    if (!list.length) continue
    const sectorMetric = list.reduce((s, asset) => s + volumeMetric(asset), 0)
    weights.set(id, Math.sqrt(Math.max(sectorMetric, MIN_SQRT_VALUE)))
  }
  return weights
}

function layoutRootSectors(
  present: VnSectorGroupId[],
  weights: Map<VnSectorGroupId, number>,
): Array<{ id: VnSectorGroupId; rect: TreemapRect }> {
  const root: TreemapRect = { x: 0, y: 0, w: 1, h: 1 }
  const items = present.map((id) => ({
    data: id,
    value: Math.max(weights.get(id) ?? MIN_SQRT_VALUE, MIN_SQRT_VALUE),
  }))
  const nodes = packSquarified(items, root)
  return nodes.map((node) => ({
    id: node.data,
    rect: insetRect(node.rect, SECTOR_GAP),
  }))
}

/**
 * Mode 1 — sector-grouped two-level treemap (volume-weighted).
 * Root: squarify sectors by sqrt(sum volume). Inner: squarify stocks by sqrt(volume).
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

  const weights = sectorRootWeights(buckets)
  const present = VN_SECTOR_GROUP_ORDER.filter((id) => (buckets.get(id)?.length ?? 0) > 0)
  const rootPlacements = layoutRootSectors(present, weights)

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
