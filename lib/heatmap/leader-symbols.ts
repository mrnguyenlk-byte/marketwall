import type { CSSProperties } from "react"

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

/** Subtle inner glow for leader tiles — no white border/ring. */
export function vnHeatmapLeaderGlowStyle(): CSSProperties {
  return {
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
  }
}
