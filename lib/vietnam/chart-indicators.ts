import type { VnOhlcBar } from "@/lib/providers/vietnam-chart-provider"

export type VnMaPoint = {
  time: string
  value: number
}

/** Simple moving average over close prices. */
export function computeSma(bars: VnOhlcBar[], period: number): VnMaPoint[] {
  if (period <= 0 || bars.length < period) return []

  const points: VnMaPoint[] = []
  let sum = 0

  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close
    if (i >= period) sum -= bars[i - period].close
    if (i >= period - 1) {
      points.push({
        time: bars[i].time,
        value: Number((sum / period).toFixed(2)),
      })
    }
  }

  return points
}

export function computeMaBundle(bars: VnOhlcBar[]) {
  return {
    ma10: computeSma(bars, 10),
    ma20: computeSma(bars, 20),
    ma50: computeSma(bars, 50),
  }
}
