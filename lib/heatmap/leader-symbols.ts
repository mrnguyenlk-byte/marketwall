/** VN index leaders — subtle tile emphasis in sector-volume heatmap. */
export const VN_HEATMAP_LEADER_SYMBOLS = new Set([
  "VCB",
  "FPT",
  "VHM",
  "VIC",
  "HPG",
])

export function isVnHeatmapLeader(symbol: string): boolean {
  return VN_HEATMAP_LEADER_SYMBOLS.has(symbol.toUpperCase())
}
