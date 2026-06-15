// Shared market data utilities used by providers and legacy exports.

export type Bi = { vi: string; en: string }

export type Trend = "up" | "down" | "neutral"

export function toTrend(changePercent: number): Trend {
  if (changePercent > 0) return "up"
  if (changePercent < 0) return "down"
  return "neutral"
}

export function spark(seed: number, points = 24, trend = 0): number[] {
  const out: number[] = []
  let v = 50 + (seed % 20)
  for (let i = 0; i < points; i++) {
    const n = Math.sin(seed * 0.7 + i * 0.9) * 6 + Math.cos(seed + i * 0.3) * 4
    v = Math.max(8, v + n * 0.4 + trend * 0.6)
    out.push(Number(v.toFixed(2)))
  }
  return out
}

export function strengthSeries(seed: number, points = 48): number[] {
  const out: number[] = []
  let v = 48 + (seed % 12)
  for (let i = 0; i < points; i++) {
    v += Math.sin(seed * 0.45 + i * 0.35) * 1.8 + Math.cos(seed + i * 0.2) * 1.2
    out.push(Number(v.toFixed(2)))
  }
  return out
}
