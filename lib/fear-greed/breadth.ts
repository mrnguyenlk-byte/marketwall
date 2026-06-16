import { roundScore } from "@/lib/fear-greed/normalize"

export type BreadthQuote = {
  changePercent: number
  volume: number
}

const FLAT_THRESHOLD = 0.05

/** Advancing / (advancing + declining) × 100; flat names excluded; empty → 50. */
export function advanceDeclineScore(quotes: BreadthQuote[]): number {
  let advancing = 0
  let declining = 0

  for (const q of quotes) {
    if (q.changePercent > FLAT_THRESHOLD) advancing += 1
    else if (q.changePercent < -FLAT_THRESHOLD) declining += 1
  }

  const total = advancing + declining
  if (total === 0) return 50
  return roundScore((advancing / total) * 100)
}

/** Up-volume / (up + down volume) × 100; flat volume excluded; empty → 50. */
export function volumeBreadthScore(quotes: BreadthQuote[]): number {
  let upVolume = 0
  let downVolume = 0

  for (const q of quotes) {
    if (q.volume <= 0) continue
    if (q.changePercent > 0) upVolume += q.volume
    else if (q.changePercent < 0) downVolume += q.volume
  }

  const total = upVolume + downVolume
  if (total === 0) return 50
  return roundScore((upVolume / total) * 100)
}

/** Net foreign flow mapped to 0–100 (50 = balanced buy/sell). */
export function foreignFlowScore(foreignBuy: number, foreignSell: number): number {
  const total = foreignBuy + foreignSell
  if (total <= 0) return 50
  const netRatio = (foreignBuy - foreignSell) / total
  return roundScore(50 + netRatio * 50)
}
