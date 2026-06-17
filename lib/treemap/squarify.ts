/** Squarified treemap (Bruls–Huizing–van Wijk) — Finviz-style packed layout. */

export type TreemapRect = {
  x: number
  y: number
  w: number
  h: number
}

export type TreemapLayoutNode<T> = {
  data: T
  value: number
  rect: TreemapRect
}

function sumValues(items: Array<{ value: number }>): number {
  return items.reduce((sum, item) => sum + Math.max(item.value, 0), 0)
}

function worst(row: number[], length: number): number {
  if (!row.length || length <= 0) return Infinity
  const sum = row.reduce((a, b) => a + b, 0)
  const max = Math.max(...row)
  const min = Math.min(...row)
  const s2 = sum * sum
  const l2 = length * length
  return Math.max((l2 * max) / s2, s2 / (l2 * min))
}

/** Lay out rows along the shorter side of the remaining rectangle (classic Bruls). */
function rowIsHorizontal(remaining: TreemapRect): boolean {
  return remaining.w >= remaining.h
}

function layoutRow<T>(
  row: Array<{ data: T; value: number }>,
  band: TreemapRect,
  horizontal: boolean,
  out: TreemapLayoutNode<T>[],
) {
  const rowSum = sumValues(row)
  if (rowSum <= 0) return

  if (horizontal) {
    let x = band.x
    for (const item of row) {
      const w = (item.value / rowSum) * band.w
      out.push({ data: item.data, value: item.value, rect: { x, y: band.y, w, h: band.h } })
      x += w
    }
  } else {
    let y = band.y
    for (const item of row) {
      const h = (item.value / rowSum) * band.h
      out.push({ data: item.data, value: item.value, rect: { x: band.x, y, w: band.w, h } })
      y += h
    }
  }
}

function rowBandRect<T>(
  row: Array<{ data: T; value: number }>,
  remaining: TreemapRect,
  horizontal: boolean,
  remainingTotal: number,
): TreemapRect {
  const rowSum = sumValues(row)
  if (rowSum <= 0 || remainingTotal <= 0) return remaining
  if (horizontal) {
    const bandW = (rowSum / remainingTotal) * remaining.w
    return { x: remaining.x, y: remaining.y, w: bandW, h: remaining.h }
  }
  const bandH = (rowSum / remainingTotal) * remaining.h
  return { x: remaining.x, y: remaining.y, w: remaining.w, h: bandH }
}

function advanceRemaining<T>(
  row: Array<{ data: T; value: number }>,
  remaining: TreemapRect,
  horizontal: boolean,
  remainingTotal: number,
): TreemapRect {
  const rowSum = sumValues(row)
  if (rowSum <= 0 || remainingTotal <= 0) return remaining
  if (horizontal) {
    const used = (rowSum / remainingTotal) * remaining.w
    return { x: remaining.x + used, y: remaining.y, w: remaining.w - used, h: remaining.h }
  }
  const used = (rowSum / remainingTotal) * remaining.h
  return { x: remaining.x, y: remaining.y + used, w: remaining.w, h: remaining.h - used }
}

/**
 * Classic squarified treemap — weights map to area within `rect`.
 * Rows are built greedily; each row is placed along the shorter side of the remainder.
 */
export function squarify<T>(
  items: Array<{ data: T; value: number }>,
  rect: TreemapRect,
  minValue = 0.0001,
): TreemapLayoutNode<T>[] {
  if (!items.length || rect.w <= 0 || rect.h <= 0) return []

  const total = sumValues(items)
  if (total <= 0) return []

  const containerArea = rect.w * rect.h
  const normalized = items
    .map((item) => ({
      ...item,
      value: Math.max(item.value, minValue) * (containerArea / total),
    }))
    .sort((a, b) => b.value - a.value)

  const normalizedTotal = sumValues(normalized)
  const out: TreemapLayoutNode<T>[] = []
  let row: Array<{ data: T; value: number }> = []
  let remaining = { ...rect }
  let remainingTotal = normalizedTotal
  let horizontal = rowIsHorizontal(remaining)

  const flushRow = () => {
    if (!row.length) return
    const band = rowBandRect(row, remaining, horizontal, remainingTotal)
    layoutRow(row, band, horizontal, out)
    remaining = advanceRemaining(row, remaining, horizontal, remainingTotal)
    remainingTotal -= sumValues(row)
    horizontal = rowIsHorizontal(remaining)
    row = []
  }

  for (const item of normalized) {
    const next = [...row, item]
    const length = horizontal ? remaining.h : remaining.w
    if (!row.length || worst(next.map((n) => n.value), length) <= worst(row.map((n) => n.value), length)) {
      row = next
    } else {
      flushRow()
      row = [item]
    }
  }

  if (row.length) {
    const band = rowBandRect(row, remaining, horizontal, remainingTotal)
    layoutRow(row, band, horizontal, out)
  }

  return out
}

/** @deprecated Use squarify — orientation is chosen per remaining rect (Bruls). */
export function squarifyWithOrientation<T>(
  items: Array<{ data: T; value: number }>,
  rect: TreemapRect,
  _initialHorizontal: boolean,
  minValue = 0.0001,
): TreemapLayoutNode<T>[] {
  return squarify(items, rect, minValue)
}

/** Partition container among weighted groups, then squarify leaves in each cell. */
export function squarifyGroups<T, G>(
  groups: Array<{ data: G; value: number; items: Array<{ data: T; value: number }> }>,
  rect: TreemapRect,
  headerRatio = 0.04,
): Array<{ data: G; value: number; rect: TreemapRect; children: TreemapLayoutNode<T>[] }> {
  const groupNodes = squarify(
    groups.map((g) => ({ data: g, value: g.value })),
    rect,
  )

  return groupNodes.map((node) => {
    const group = node.data
    const headerH = Math.min(node.rect.h * headerRatio, 0.028)
    const inner: TreemapRect = {
      x: node.rect.x,
      y: node.rect.y + headerH,
      w: node.rect.w,
      h: Math.max(node.rect.h - headerH, 0),
    }
    const children = inner.h > 0 && inner.w > 0 ? squarify(group.items, inner) : []
    return {
      data: group.data,
      value: group.value,
      rect: node.rect,
      children,
    }
  })
}
