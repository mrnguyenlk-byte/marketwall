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

function sumValues<T>(items: Array<{ value: number }>): number {
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

function layoutRow<T>(
  row: Array<{ data: T; value: number }>,
  rect: TreemapRect,
  horizontal: boolean,
  out: TreemapLayoutNode<T>[],
) {
  const rowSum = sumValues(row)
  if (rowSum <= 0) return

  if (horizontal) {
    let x = rect.x
    for (const item of row) {
      const w = (item.value / rowSum) * rect.w
      out.push({ data: item.data, value: item.value, rect: { x, y: rect.y, w, h: rect.h } })
      x += w
    }
  } else {
    let y = rect.y
    for (const item of row) {
      const h = (item.value / rowSum) * rect.h
      out.push({ data: item.data, value: item.value, rect: { x: rect.x, y, w: rect.w, h } })
      y += h
    }
  }
}

export function squarify<T>(
  items: Array<{ data: T; value: number }>,
  rect: TreemapRect,
  minValue = 0.0001,
): TreemapLayoutNode<T>[] {
  if (!items.length || rect.w <= 0 || rect.h <= 0) return []

  const normalized = items
    .map((item) => ({ ...item, value: Math.max(item.value, minValue) }))
    .sort((a, b) => b.value - a.value)

  const total = sumValues(normalized)
  const out: TreemapLayoutNode<T>[] = []
  let row: Array<{ data: T; value: number }> = []
  let remaining = { ...rect }
  let horizontal = remaining.w >= remaining.h

  for (const item of normalized) {
    const next = [...row, item]
    const length = horizontal ? remaining.h : remaining.w
    if (!row.length || worst(next.map((n) => n.value), length) <= worst(row.map((n) => n.value), length)) {
      row = next
    } else {
      layoutRow(row, remaining, horizontal, out)
      const rowSum = sumValues(row)
      if (horizontal) {
        const used = (rowSum / total) * rect.w
        remaining = { x: remaining.x + used, y: remaining.y, w: remaining.w - used, h: remaining.h }
      } else {
        const used = (rowSum / total) * rect.h
        remaining = { x: remaining.x, y: remaining.y + used, w: remaining.w, h: remaining.h - used }
      }
      horizontal = remaining.w >= remaining.h
      row = [item]
    }
  }

  if (row.length) layoutRow(row, remaining, horizontal, out)
  return out
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
    const headerH = Math.min(node.rect.h * headerRatio, 14 / rect.h)
    const inner: TreemapRect = {
      x: node.rect.x,
      y: node.rect.y + headerH,
      w: node.rect.w,
      h: Math.max(node.rect.h - headerH, 0),
    }
    const children = squarify(group.items, inner)
    return {
      data: group.data,
      value: group.value,
      rect: node.rect,
      children,
    }
  })
}
