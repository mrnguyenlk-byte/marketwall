import "server-only"

import {
  advanceDeclineScore,
  volumeBreadthScore,
  type BreadthQuote,
} from "@/lib/fear-greed/breadth"
import { momentumToScore, weightedComposite } from "@/lib/fear-greed/normalize"
import { fetchSp500Momentum20d } from "@/lib/fear-greed/momentum"
import type { HeatmapAsset } from "@/types/market"

export const US_FEAR_GREED_WEIGHTS = {
  sp500Momentum20d: 1 / 3,
  marketBreadth: 1 / 3,
  volumeBreadth: 1 / 3,
} as const

export type UsFearGreedInput = {
  heatmapItems: HeatmapAsset[]
  /** Optional pre-fetched S&P 500 20D %; fetched live when omitted. */
  momentum20dPercent?: number | null
}

export type UsFearGreedBreakdown = {
  sp500Momentum20d: number
  marketBreadth: number
  volumeBreadth: number
  composite: number
}

function toBreadthQuotes(items: HeatmapAsset[]): BreadthQuote[] {
  return items.map((item) => ({
    changePercent: item.changePercent,
    volume: item.volume,
  }))
}

export async function computeUsFearGreed(input: UsFearGreedInput): Promise<UsFearGreedBreakdown> {
  const quotes = toBreadthQuotes(input.heatmapItems)
  const marketBreadth = advanceDeclineScore(quotes)
  const volumeBreadth = volumeBreadthScore(quotes)

  const momentumPct =
    input.momentum20dPercent ?? (await fetchSp500Momentum20d())
  const sp500Momentum20d = momentumToScore(momentumPct ?? 0)

  const composite = weightedComposite([
    { score: sp500Momentum20d, weight: US_FEAR_GREED_WEIGHTS.sp500Momentum20d },
    { score: marketBreadth, weight: US_FEAR_GREED_WEIGHTS.marketBreadth },
    { score: volumeBreadth, weight: US_FEAR_GREED_WEIGHTS.volumeBreadth },
  ])

  return {
    sp500Momentum20d,
    marketBreadth,
    volumeBreadth,
    composite,
  }
}
