/** VN index leaders — visual tile emphasis in sector-volume heatmap (top 10 by prominence). */
export const VN_HEATMAP_LEADER_SYMBOLS = new Set([
  "VCB",
  "VHM",
  "VIC",
  "FPT",
  "TCB",
  "HPG",
  "MBB",
  "ACB",
  "SSI",
  "VPB",
])

export function isVnHeatmapLeader(symbol: string): boolean {
  return VN_HEATMAP_LEADER_SYMBOLS.has(symbol.toUpperCase())
}
