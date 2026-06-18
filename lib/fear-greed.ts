/** Client-safe fear & greed helpers (no provider imports). */

export type FearGreedReason = {
  vi: string
  en: string
}

export type FearGreedItem = {
  key: string
  value: number
  reasons?: FearGreedReason[]
}

export const fearGreedData: FearGreedItem[] = [
  { key: "fg.vnindex", value: 48 },
  { key: "fg.crypto", value: 71 },
  { key: "fg.usStocks", value: 58 },
]

/** Bands: 0–20 Extreme Fear, 21–40 Fear, 41–60 Neutral, 61–80 Greed, 81–100 Extreme Greed. */
export function fgLabel(value: number): string {
  if (value <= 20) return "fg.extremeFear"
  if (value <= 40) return "fg.fear"
  if (value <= 60) return "fg.neutral"
  if (value <= 80) return "fg.greed"
  return "fg.extremeGreed"
}
