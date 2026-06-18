/** Deterministic heatmap ordering — metric desc, changePercent desc, symbol asc. */

export type HeatmapSortable = {
  symbol: string
  changePercent?: number
}

export function compareHeatmapMetricDesc(
  metricA: number,
  metricB: number,
  a: HeatmapSortable,
  b: HeatmapSortable,
): number {
  const byMetric = metricB - metricA
  if (byMetric !== 0) return byMetric

  const changeA = a.changePercent ?? 0
  const changeB = b.changePercent ?? 0
  const byChange = changeB - changeA
  if (byChange !== 0) return byChange

  return a.symbol.localeCompare(b.symbol, "en")
}
