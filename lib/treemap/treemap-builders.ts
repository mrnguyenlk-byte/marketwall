/** FROZEN — do not change layout without debug failure */
import {
  squarify,
  type TreemapLayoutNode,
  type TreemapRect,
} from "@/lib/treemap/squarify"

const MIN_VALUE = 0.0001
const HARD_ASPECT_LIMIT = 6
/** Squarify → weighted grid when worst tile aspect exceeds this (flat VN modes). */
const FLAT_ASPECT_FALLBACK_LIMIT = 10
const FLAT_LAYOUT_GAP = 0.002
const DEFAULT_MAX_CAP_ITERATIONS = 50

/** Max share of parent area for a single flat leaf (US, Crypto). */
export const MAX_ITEM_AREA_SHARE = 0.18
/** Max share of parent area for a single flat leaf (VN flat modes 2–4). */
export const VN_MAX_ITEM_AREA_SHARE = 0.18
/** Max share of heatmap root for a single sector block (VN mode 1). */
export const MAX_SECTOR_AREA_SHARE = 0.25
/** Max share of sector inner area for a single stock tile (VN mode 1). */
export const MAX_STOCK_AREA_SHARE_IN_SECTOR = 0.18

/** Power exponents for metric → area-share compression (rawShare ** power). */
export const TREEMAP_COMPRESSION_POWER = {
  VN_SECTOR_ROOT: 0.85,
  VN_STOCK_IN_SECTOR: 0.75,
  VN_MARKET_CAP_FLAT: 0.85,
  VN_FLOW_FLAT: 0.75,
  US_DOLLAR_VOLUME: 0.75,
  CRYPTO_VOLUME: 0.75,
  DEFAULT: 0.75,
} as const

export type GroupedSquarifiedTreemap<T, G> = {
  groups: Array<{
    data: G
    rect: TreemapRect
    children: TreemapLayoutNode<T>[]
  }>
  leaves: TreemapLayoutNode<T>[]
}

export type NormalizeTreemapOptions = {
  maxShare: number
  /** Compression exponent applied to raw share before capping (default 0.75). */
  power?: number
  maxIterations?: number
}

export type NormalizedTreemapItem<T> = {
  data: T
  metric: number
  weight: number
}

function aspectRatio(rect: TreemapRect): number {
  const minEdge = Math.max(Math.min(rect.w, rect.h), 1e-9)
  return Math.max(rect.w, rect.h) / minEdge
}

function worstAspect(rects: TreemapRect[]): number {
  if (!rects.length) return 0
  return Math.max(...rects.map(aspectRatio))
}

/** True when every raw metric is zero or missing — equal grid is allowed only then. */
export function allMetricsInvalid<T>(
  items: Array<{ data: T; value: number }>,
): boolean {
  return !items.some((item) => item.value > 0)
}

/**
 * Power-compress metrics into area shares, cap at maxShare, redistribute excess.
 * Steps: filter invalid → raw share → power → normalize → cap loop → final weights.
 */
export function normalizeTreemapWeights<T>(
  items: Array<{ data: T; metric: number }>,
  options: NormalizeTreemapOptions,
): NormalizedTreemapItem<T>[] {
  const maxShare = options.maxShare
  const power = options.power ?? TREEMAP_COMPRESSION_POWER.DEFAULT
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_CAP_ITERATIONS

  const valid = items.filter((item) => item.metric > 0)
  if (!valid.length) return []

  const total = valid.reduce((sum, item) => sum + item.metric, 0)
  if (total <= 0) return []

  const compressedSum = valid.reduce((sum, item) => {
    const rawShare = item.metric / total
    return sum + rawShare ** power
  }, 0)
  if (compressedSum <= 0) return []

  let shares: Array<{ data: T; metric: number; weight: number }> = valid.map((item) => {
    const rawShare = item.metric / total
    return {
      data: item.data,
      metric: item.metric,
      weight: (rawShare ** power) / compressedSum,
    }
  })

  for (let iter = 0; iter < maxIterations; iter++) {
    let excess = 0
    let uncappedTotal = 0
    const pass = shares.map((item) => {
      if (item.weight > maxShare + 1e-12) {
        excess += item.weight - maxShare
        return { ...item, weight: maxShare, capped: true as const }
      }
      uncappedTotal += item.weight
      return { ...item, capped: false as const }
    })

    if (excess <= 1e-12) {
      return pass.map(({ data, metric, weight }) => ({ data, metric, weight }))
    }

    if (uncappedTotal <= 1e-12) {
      return pass.map(({ data, metric, weight }) => ({ data, metric, weight }))
    }

    shares = pass.map((item) => {
      if (item.capped) return { data: item.data, metric: item.metric, weight: item.weight }
      return {
        data: item.data,
        metric: item.metric,
        weight: item.weight + excess * (item.weight / uncappedTotal),
      }
    })
  }

  return shares.map(({ data, metric, weight }) => ({ data, metric, weight }))
}

function balancedGridFallback<T>(
  inner: TreemapRect,
  items: Array<{ data: T; value: number }>,
  gap = FLAT_LAYOUT_GAP,
): TreemapLayoutNode<T>[] {
  const n = items.length
  if (!n || inner.w <= 0 || inner.h <= 0) return []

  let bestCols = 1
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
    }
  }

  const cols = bestCols
  const rows = Math.ceil(n / cols)
  const cellW = Math.max((inner.w - gap * (cols - 1)) / cols, 0)
  const cellH = Math.max((inner.h - gap * (rows - 1)) / rows, 0)
  const sorted = [...items].sort((a, b) => b.value - a.value)

  return sorted.map((item, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    return {
      data: item.data,
      value: item.value,
      rect: {
        x: inner.x + col * (cellW + gap),
        y: inner.y + row * (cellH + gap),
        w: cellW,
        h: cellH,
      },
    }
  })
}

/** Split sorted items into bands with roughly equal total weight (preserves order). */
function partitionByWeight<T>(
  items: Array<{ data: T; value: number }>,
  numBands: number,
): Array<Array<{ data: T; value: number }>> {
  if (numBands <= 1 || items.length <= 1) return [items]

  const total = items.reduce((sum, item) => sum + item.value, 0)
  if (total <= 0) {
    const bands: Array<Array<{ data: T; value: number }>> = []
    const base = Math.floor(items.length / numBands)
    const extra = items.length % numBands
    let idx = 0
    for (let b = 0; b < numBands; b++) {
      const count = base + (b < extra ? 1 : 0)
      if (count > 0) {
        bands.push(items.slice(idx, idx + count))
        idx += count
      }
    }
    return bands.length ? bands : [items]
  }

  const target = total / numBands
  const bands: Array<Array<{ data: T; value: number }>> = []
  let current: Array<{ data: T; value: number }> = []
  let currentSum = 0

  for (const item of items) {
    if (bands.length < numBands - 1 && current.length > 0 && currentSum >= target) {
      bands.push(current)
      current = [item]
      currentSum = item.value
    } else {
      current.push(item)
      currentSum += item.value
    }
  }
  if (current.length) bands.push(current)
  return bands.length ? bands : [items]
}

function layoutWeightBandsHorizontal<T>(
  inner: TreemapRect,
  bands: Array<Array<{ data: T; value: number }>>,
  gap: number,
): TreemapLayoutNode<T>[] {
  const totalWeight = bands.reduce(
    (sum, band) => sum + band.reduce((bandSum, item) => bandSum + item.value, 0),
    0,
  )
  if (totalWeight <= 0) return []

  const availH = inner.h - gap * Math.max(bands.length - 1, 0)
  const nodes: TreemapLayoutNode<T>[] = []
  let curY = inner.y

  for (const band of bands) {
    const bandWeight = band.reduce((sum, item) => sum + item.value, 0)
    const bandH = (bandWeight / totalWeight) * availH
    let curX = inner.x
    for (const item of band) {
      const tileW = bandWeight > 0 ? (item.value / bandWeight) * inner.w : inner.w / band.length
      nodes.push({
        data: item.data,
        value: item.value,
        rect: { x: curX, y: curY, w: tileW, h: bandH },
      })
      curX += tileW
    }
    curY += bandH + gap
  }

  return nodes
}

function layoutWeightBandsVertical<T>(
  inner: TreemapRect,
  bands: Array<Array<{ data: T; value: number }>>,
  gap: number,
): TreemapLayoutNode<T>[] {
  const totalWeight = bands.reduce(
    (sum, band) => sum + band.reduce((bandSum, item) => bandSum + item.value, 0),
    0,
  )
  if (totalWeight <= 0) return []

  const availW = inner.w - gap * Math.max(bands.length - 1, 0)
  const nodes: TreemapLayoutNode<T>[] = []
  let curX = inner.x

  for (const band of bands) {
    const bandWeight = band.reduce((sum, item) => sum + item.value, 0)
    const bandW = (bandWeight / totalWeight) * availW
    let curY = inner.y
    for (const item of band) {
      const tileH = bandWeight > 0 ? (item.value / bandWeight) * inner.h : inner.h / band.length
      nodes.push({
        data: item.data,
        value: item.value,
        rect: { x: curX, y: curY, w: bandW, h: tileH },
      })
      curY += tileH
    }
    curX += bandW + gap
  }

  return nodes
}

/** Split sorted items into bands with roughly equal item count (preserves order). */
function partitionByCount<T>(
  items: Array<{ data: T; value: number }>,
  numBands: number,
): Array<Array<{ data: T; value: number }>> {
  if (numBands <= 1 || items.length <= 1) return [items]

  const bands: Array<Array<{ data: T; value: number }>> = []
  const n = items.length
  const base = Math.floor(n / numBands)
  const extra = n % numBands
  let idx = 0

  for (let b = 0; b < numBands; b++) {
    const count = base + (b < extra ? 1 : 0)
    if (count > 0) {
      bands.push(items.slice(idx, idx + count))
      idx += count
    }
  }

  return bands.length ? bands : [items]
}

/** Merge single-item bands into a neighbor so horizontal rows are never one tile wide. */
function mergeSingletonBands<T>(
  bands: Array<Array<{ data: T; value: number }>>,
): Array<Array<{ data: T; value: number }>> {
  if (bands.length <= 1) return bands

  const merged = bands.map((band) => [...band])
  let i = 0
  while (i < merged.length) {
    if (merged[i].length === 1) {
      if (i < merged.length - 1) {
        merged[i + 1] = [...merged[i], ...merged[i + 1]]
        merged.splice(i, 1)
      } else if (i > 0) {
        merged[i - 1] = [...merged[i - 1], ...merged[i]]
        merged.splice(i, 1)
        i--
      } else {
        i++
      }
    } else {
      i++
    }
  }

  return merged.length ? merged : bands
}

/**
 * Weight-proportional grid fallback — tile area ∝ value, metric order preserved.
 * Tries horizontal and vertical band counts to minimize worst aspect ratio.
 */
function weightedBalancedGridFallback<T>(
  inner: TreemapRect,
  items: Array<{ data: T; value: number }>,
  gap = FLAT_LAYOUT_GAP,
): TreemapLayoutNode<T>[] {
  const n = items.length
  if (!n || inner.w <= 0 || inner.h <= 0) return []

  const sorted = [...items].sort((a, b) => b.value - a.value)
  const idealBands = Math.max(1, Math.round(Math.sqrt(n)))
  const minBands = Math.max(1, Math.floor(idealBands * 0.5))
  const maxBands = Math.min(n, Math.ceil(idealBands * 2.5))

  let bestNodes: TreemapLayoutNode<T>[] = []
  let bestWorst = Infinity

  for (let bands = minBands; bands <= maxBands; bands++) {
    const weightBands = mergeSingletonBands(partitionByWeight(sorted, bands))
    const countBands = partitionByCount(sorted, bands)

    for (const partitioned of [weightBands, countBands]) {
      for (const layout of [
        layoutWeightBandsHorizontal(inner, partitioned, gap),
        layoutWeightBandsVertical(inner, partitioned, gap),
      ]) {
        const score = worstAspect(layout.map((node) => node.rect))
        if (score < bestWorst) {
          bestWorst = score
          bestNodes = layout
        }
      }
    }
  }

  if (bestWorst > FLAT_ASPECT_FALLBACK_LIMIT) {
    for (let bands = 1; bands <= n; bands++) {
      const weightBands = mergeSingletonBands(partitionByWeight(sorted, bands))
      const countBands = partitionByCount(sorted, bands)

      for (const partitioned of [weightBands, countBands]) {
        for (const layout of [
          layoutWeightBandsHorizontal(inner, partitioned, gap),
          layoutWeightBandsVertical(inner, partitioned, gap),
        ]) {
          const score = worstAspect(layout.map((node) => node.rect))
          if (score < bestWorst) {
            bestWorst = score
            bestNodes = layout
          }
          if (bestWorst <= FLAT_ASPECT_FALLBACK_LIMIT) return bestNodes
        }
      }
    }
  }

  return bestNodes
}

export type PackSquarifiedOptions = {
  /** When false, never fall back to equal-size grid (default). */
  allowEqualGridFallback?: boolean
  /** Squarify → weighted grid when worst aspect exceeds this (default 10). Set 0 to disable. */
  aspectFallbackLimit?: number
  /** Always use weighted grid when squarify aspect exceeds limit (crypto flat). */
  forceWeightedFallback?: boolean
  /** Skip squarify and use weight-proportional grid (preserves metric order top-left). */
  preferOrderedGrid?: boolean
}

/** Squarified pack — weighted grid when aspect too high; equal grid only for invalid metrics. */
export function packSquarified<T>(
  items: Array<{ data: T; value: number }>,
  rect: TreemapRect,
  options?: PackSquarifiedOptions,
): TreemapLayoutNode<T>[] {
  if (!items.length || rect.w <= 0 || rect.h <= 0) return []

  const rawInvalid = allMetricsInvalid(items)
  const allowEqualGrid = options?.allowEqualGridFallback ?? rawInvalid
  const aspectLimit = options?.aspectFallbackLimit ?? FLAT_ASPECT_FALLBACK_LIMIT

  const weighted = items.map((item, index) => ({
    ...item,
    value: Math.max(item.value, MIN_VALUE) + (items.length - index) * 1e-12,
  }))

  if (options?.preferOrderedGrid) {
    const ordered = weightedBalancedGridFallback(rect, weighted)
    if (ordered.length) return ordered
  }

  const packed = squarify(weighted, rect, MIN_VALUE)
  const worst = worstAspect(packed.map((node) => node.rect))

  if (aspectLimit > 0 && worst > aspectLimit) {
    const weightedGrid = weightedBalancedGridFallback(rect, weighted)
    const gridWorst = worstAspect(weightedGrid.map((node) => node.rect))
    if (options?.forceWeightedFallback || gridWorst < worst) return weightedGrid
  }

  if (!allowEqualGrid) return packed

  if (worst <= HARD_ASPECT_LIMIT) return packed

  const grid = balancedGridFallback(rect, weighted)
  const gridWorst = worstAspect(grid.map((node) => node.rect))
  if (gridWorst < worst) return grid

  return packed
}

export type FlatMetricTreemapOptions = {
  maxShare?: number
  power?: number
  allowEqualGridFallback?: boolean
  aspectFallbackLimit?: number
  forceWeightedFallback?: boolean
}

/** Flat squarified treemap — tile size from normalized/capped weights, never slice bars. */
export function buildFlatMetricTreemap<T>(
  items: T[],
  metric: (item: T) => number,
  rect: TreemapRect = { x: 0, y: 0, w: 1, h: 1 },
  options?: FlatMetricTreemapOptions,
): TreemapLayoutNode<T>[] {
  const maxShare = options?.maxShare ?? MAX_ITEM_AREA_SHARE
  const power = options?.power ?? TREEMAP_COMPRESSION_POWER.DEFAULT
  const raw = [...items]
    .map((item) => ({
      data: item,
      metric: metric(item),
    }))
    .sort((a, b) => b.metric - a.metric)
  const rawForInvalid = raw.map((item) => ({ data: item.data, value: item.metric }))

  const normalized = normalizeTreemapWeights(raw, { maxShare, power })
  const weighted = [...normalized]
    .sort((a, b) => b.weight - a.weight || b.metric - a.metric)
    .map((item) => ({
      data: item.data,
      value: item.weight,
    }))

  return packSquarified(weighted, rect, {
    allowEqualGridFallback:
      options?.allowEqualGridFallback ?? allMetricsInvalid(rawForInvalid),
    aspectFallbackLimit: options?.aspectFallbackLimit,
    forceWeightedFallback: options?.forceWeightedFallback,
  })
}

/** @deprecated Use buildFlatMetricTreemap */
export const buildFlatSquarifiedTreemap = buildFlatMetricTreemap

function insetRect(rect: TreemapRect, gap: number): TreemapRect {
  const inset = gap / 2
  return {
    x: rect.x + inset,
    y: rect.y + inset,
    w: Math.max(rect.w - gap, 0),
    h: Math.max(rect.h - gap, 0),
  }
}

export type GroupedSectorTreemapOptions = {
  rect?: TreemapRect
  gap?: number
  headerRatio?: number
  maxSectorShare?: number
  maxStockShare?: number
  sectorPower?: number
  stockPower?: number
}

/** Two-level grouped sector treemap — squarified sector blocks, squarified leaves inside. */
export function buildGroupedSectorTreemap<T>(
  items: T[],
  sectorKey: (item: T) => string,
  metric: (item: T) => number,
  options?: GroupedSectorTreemapOptions,
): GroupedSquarifiedTreemap<T, string> {
  const rect = options?.rect ?? { x: 0, y: 0, w: 1, h: 1 }
  const gap = options?.gap ?? 0.002
  const headerRatio = options?.headerRatio ?? 0.04

  const buckets = new Map<string, T[]>()
  for (const item of items) {
    const key = sectorKey(item)
    const list = buckets.get(key) ?? []
    list.push(item)
    buckets.set(key, list)
  }

  const groups = [...buckets.entries()]
    .map(([id, groupItems]) => ({
      data: id,
      items: [...groupItems].sort((a, b) => metric(b) - metric(a)),
    }))
    .sort(
      (a, b) =>
        b.items.reduce((sum, item) => sum + metric(item), 0) -
        a.items.reduce((sum, item) => sum + metric(item), 0),
    )

  return buildGroupedSectorTreemapFromGroups(groups, metric, {
    rect,
    gap,
    headerRatio,
    maxSectorShare: options?.maxSectorShare ?? MAX_SECTOR_AREA_SHARE,
    maxStockShare: options?.maxStockShare ?? MAX_STOCK_AREA_SHARE_IN_SECTOR,
    sectorPower: options?.sectorPower ?? TREEMAP_COMPRESSION_POWER.VN_SECTOR_ROOT,
    stockPower: options?.stockPower ?? TREEMAP_COMPRESSION_POWER.VN_STOCK_IN_SECTOR,
  })
}

function buildGroupedSectorTreemapFromGroups<T, G>(
  groups: Array<{ data: G; items: T[] }>,
  itemMetric: (item: T) => number,
  options: {
    rect: TreemapRect
    gap: number
    headerRatio: number
    maxSectorShare: number
    maxStockShare: number
    sectorPower: number
    stockPower: number
  },
): GroupedSquarifiedTreemap<T, G> {
  const { rect, gap, headerRatio, maxSectorShare, maxStockShare, sectorPower, stockPower } =
    options

  const nonEmpty = groups.filter((group) => group.items.length > 0)
  if (!nonEmpty.length) {
    return { groups: [], leaves: [] }
  }

  const rootRaw = [...nonEmpty]
    .map((group) => ({
      data: group,
      metric: group.items.reduce((sum, item) => sum + itemMetric(item), 0),
    }))
    .sort((a, b) => b.metric - a.metric)
  const rootRawForInvalid = rootRaw.map((item) => ({
    data: item.data,
    value: item.metric,
  }))

  const rootNormalized = normalizeTreemapWeights(rootRaw, {
    maxShare: maxSectorShare,
    power: sectorPower,
  })
  const rootWeighted = [...rootNormalized]
    .sort((a, b) => b.weight - a.weight || b.metric - a.metric)
    .map((item) => ({
      data: item.data,
      value: item.weight,
    }))

  const rootPacked = packSquarified(rootWeighted, rect, {
    allowEqualGridFallback: allMetricsInvalid(rootRawForInvalid),
  })
  const result: GroupedSquarifiedTreemap<T, G> = { groups: [], leaves: [] }

  for (const node of rootPacked) {
    const group = node.data
    const groupRect = insetRect(node.rect, gap)
    const headerH = Math.min(groupRect.h * headerRatio, 0.028)
    const inner: TreemapRect = {
      x: groupRect.x,
      y: groupRect.y + headerH,
      w: groupRect.w,
      h: Math.max(groupRect.h - headerH, 0),
    }

    const children =
      inner.w > 0 && inner.h > 0
        ? buildFlatMetricTreemap(group.items, itemMetric, inner, {
            maxShare: maxStockShare,
            power: stockPower,
          })
        : []

    result.groups.push({
      data: group.data,
      rect: groupRect,
      children,
    })
    result.leaves.push(...children)
  }

  return result
}

/** @deprecated Use buildGroupedSectorTreemap */
export function buildGroupedSquarifiedTreemap<T, G>(
  groups: Array<{ data: G; items: T[] }>,
  groupMetric: (group: { data: G; items: T[] }) => number,
  itemMetric: (item: T) => number,
  options?: GroupedSectorTreemapOptions,
): GroupedSquarifiedTreemap<T, G> {
  const rect = options?.rect ?? { x: 0, y: 0, w: 1, h: 1 }
  const gap = options?.gap ?? 0.002
  const headerRatio = options?.headerRatio ?? 0.04
  const maxSectorShare = options?.maxSectorShare ?? MAX_SECTOR_AREA_SHARE
  const maxStockShare = options?.maxStockShare ?? MAX_STOCK_AREA_SHARE_IN_SECTOR
  const sectorPower = options?.sectorPower ?? TREEMAP_COMPRESSION_POWER.VN_SECTOR_ROOT
  const stockPower = options?.stockPower ?? TREEMAP_COMPRESSION_POWER.VN_STOCK_IN_SECTOR

  const nonEmpty = groups.filter((group) => group.items.length > 0)
  if (!nonEmpty.length) {
    return { groups: [], leaves: [] }
  }

  const rootRaw = [...nonEmpty]
    .map((group) => ({
      data: group,
      metric: groupMetric(group),
    }))
    .sort((a, b) => b.metric - a.metric)
  const rootRawForInvalid = rootRaw.map((item) => ({
    data: item.data,
    value: item.metric,
  }))

  const rootNormalized = normalizeTreemapWeights(rootRaw, {
    maxShare: maxSectorShare,
    power: sectorPower,
  })
  const rootWeighted = [...rootNormalized]
    .sort((a, b) => b.weight - a.weight || b.metric - a.metric)
    .map((item) => ({
      data: item.data,
      value: item.weight,
    }))

  const rootPacked = packSquarified(rootWeighted, rect, {
    allowEqualGridFallback: allMetricsInvalid(rootRawForInvalid),
  })
  const result: GroupedSquarifiedTreemap<T, G> = { groups: [], leaves: [] }

  for (const node of rootPacked) {
    const group = node.data
    const groupRect = insetRect(node.rect, gap)
    const headerH = Math.min(groupRect.h * headerRatio, 0.028)
    const inner: TreemapRect = {
      x: groupRect.x,
      y: groupRect.y + headerH,
      w: groupRect.w,
      h: Math.max(groupRect.h - headerH, 0),
    }

    const children =
      inner.w > 0 && inner.h > 0
        ? buildFlatMetricTreemap(group.items, itemMetric, inner, {
            maxShare: maxStockShare,
            power: stockPower,
          })
        : []

    result.groups.push({
      data: group.data,
      rect: groupRect,
      children,
    })
    result.leaves.push(...children)
  }

  return result
}
