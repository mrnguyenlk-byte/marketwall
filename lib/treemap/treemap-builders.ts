import { capLeafWeights } from "@/lib/treemap/heatmap-engine"
import {
  squarify,
  squarifyWithOrientation,
  type TreemapLayoutNode,
  type TreemapRect,
} from "@/lib/treemap/squarify"

const MIN_VALUE = 0.0001
const PREFERRED_ASPECT_MAX = 3
const HARD_ASPECT_LIMIT = 6

export type GroupedSquarifiedTreemap<T, G> = {
  groups: Array<{
    data: G
    rect: TreemapRect
    children: TreemapLayoutNode<T>[]
  }>
  leaves: TreemapLayoutNode<T>[]
}

function aspectRatio(rect: TreemapRect): number {
  const minEdge = Math.max(Math.min(rect.w, rect.h), 1e-9)
  return Math.max(rect.w, rect.h) / minEdge
}

function worstAspect(rects: TreemapRect[]): number {
  if (!rects.length) return 0
  return Math.max(...rects.map(aspectRatio))
}

function layoutScore(rects: TreemapRect[]): number {
  let worst = 0
  let overPreferred = 0
  for (const rect of rects) {
    const ar = aspectRatio(rect)
    worst = Math.max(worst, ar)
    if (ar > PREFERRED_ASPECT_MAX) overPreferred++
  }
  if (worst > HARD_ASPECT_LIMIT) return worst * 100 + overPreferred * 10
  return worst + overPreferred * 0.5
}

function sqrtMetric(value: number): number {
  return Math.sqrt(Math.max(value, 0))
}

function balancedGridFallback<T>(
  inner: TreemapRect,
  items: Array<{ data: T; value: number }>,
  gap = 0.002,
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

/** Squarify with orientation retry and balanced-grid fallback — never slice-only bars. */
export function packSquarified<T>(
  items: Array<{ data: T; value: number }>,
  rect: TreemapRect,
): TreemapLayoutNode<T>[] {
  if (!items.length || rect.w <= 0 || rect.h <= 0) return []

  const weighted = items.map((item) => ({
    ...item,
    value: Math.max(item.value, MIN_VALUE),
  }))

  const candidates: TreemapLayoutNode<T>[][] = [
    squarify(weighted, rect, MIN_VALUE),
    squarifyWithOrientation(weighted, rect, true, MIN_VALUE),
    squarifyWithOrientation(weighted, rect, false, MIN_VALUE),
  ]

  let best = candidates[0]
  let bestScore = layoutScore(best.map((node) => node.rect))

  for (const candidate of candidates.slice(1)) {
    const score = layoutScore(candidate.map((node) => node.rect))
    if (score < bestScore) {
      best = candidate
      bestScore = score
    }
  }

  const worst = worstAspect(best.map((node) => node.rect))
  if (worst <= HARD_ASPECT_LIMIT) return best

  const grid = balancedGridFallback(rect, weighted)
  const gridWorst = worstAspect(grid.map((node) => node.rect))
  if (gridWorst < worst) return grid

  return best
}

/** Flat squarified treemap — tile size from metric (sqrt-weighted), never slice bars. */
export function buildFlatSquarifiedTreemap<T>(
  items: T[],
  metric: (item: T) => number,
  rect: TreemapRect = { x: 0, y: 0, w: 1, h: 1 },
): TreemapLayoutNode<T>[] {
  const weighted = capLeafWeights(
    items.map((item) => ({
      data: item,
      value: metric(item),
    })),
  )
  return packSquarified(weighted, rect)
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

/** Two-level grouped squarified treemap — group blocks at root, squarified leaves inside. */
export function buildGroupedSquarifiedTreemap<T, G>(
  groups: Array<{ data: G; items: T[] }>,
  groupMetric: (group: { data: G; items: T[] }) => number,
  itemMetric: (item: T) => number,
  options?: {
    rect?: TreemapRect
    gap?: number
    headerRatio?: number
  },
): GroupedSquarifiedTreemap<T, G> {
  const rect = options?.rect ?? { x: 0, y: 0, w: 1, h: 1 }
  const gap = options?.gap ?? 0.002
  const headerRatio = options?.headerRatio ?? 0.04

  const nonEmpty = groups.filter((group) => group.items.length > 0)
  if (!nonEmpty.length) {
    return { groups: [], leaves: [] }
  }

  const rootWeighted = nonEmpty.map((group) => ({
    data: group,
    value: Math.max(sqrtMetric(groupMetric(group)), MIN_VALUE),
  }))

  const rootPacked = packSquarified(rootWeighted, rect)
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
        ? buildFlatSquarifiedTreemap(group.items, itemMetric, inner)
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
