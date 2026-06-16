import "server-only"

import {
  advanceDeclineScore,
  foreignFlowScore,
  volumeBreadthScore,
  type BreadthQuote,
} from "@/lib/fear-greed/breadth"
import { momentumToScore, weightedComposite } from "@/lib/fear-greed/normalize"
import { fetchVnindexMomentum20d } from "@/lib/fear-greed/momentum"
import type {
  VietnamHeatmapStock,
  VietnamMarketDashboard,
} from "@/lib/providers/vietnam-market-provider"

export const VN_FEAR_GREED_WEIGHTS = {
  advanceDecline: 0.25,
  volumeBreadth: 0.25,
  momentum20d: 0.25,
  foreignFlow: 0.25,
} as const

export type VietnamFearGreedInput = {
  heatmapStocks: {
    hose: VietnamHeatmapStock[]
    hnx: VietnamHeatmapStock[]
    upcom: VietnamHeatmapStock[]
  }
  dashboard: VietnamMarketDashboard
  /** Optional pre-fetched 20D VNINDEX %; fetched live when omitted. */
  momentum20dPercent?: number | null
}

export type VietnamFearGreedBreakdown = {
  advanceDecline: number
  volumeBreadth: number
  momentum20d: number
  foreignFlow: number
  composite: number
}

function flattenStocks(input: VietnamFearGreedInput): BreadthQuote[] {
  const all = [
    ...input.heatmapStocks.hose,
    ...input.heatmapStocks.hnx,
    ...input.heatmapStocks.upcom,
  ]
  return all.map((s) => ({
    changePercent: s.changePercent,
    volume: s.volume,
  }))
}

function foreignFlowFromDashboard(dashboard: VietnamMarketDashboard): {
  buy: number
  sell: number
} {
  const buy = dashboard.topForeignBuy.reduce((sum, row) => sum + (row.foreignBuy ?? 0), 0)
  const sell = dashboard.topForeignSell.reduce((sum, row) => sum + (row.foreignSell ?? 0), 0)
  return { buy, sell }
}

export async function computeVietnamFearGreed(
  input: VietnamFearGreedInput,
): Promise<VietnamFearGreedBreakdown> {
  const quotes = flattenStocks(input)
  const advanceDecline = advanceDeclineScore(quotes)
  const volumeBreadth = volumeBreadthScore(quotes)

  const momentumPct =
    input.momentum20dPercent ??
    (await fetchVnindexMomentum20d("VNINDEX"))
  const momentum20d = momentumToScore(momentumPct ?? 0)

  const { buy, sell } = foreignFlowFromDashboard(input.dashboard)
  const foreignFlow = foreignFlowScore(buy, sell)

  const composite = weightedComposite([
    { score: advanceDecline, weight: VN_FEAR_GREED_WEIGHTS.advanceDecline },
    { score: volumeBreadth, weight: VN_FEAR_GREED_WEIGHTS.volumeBreadth },
    { score: momentum20d, weight: VN_FEAR_GREED_WEIGHTS.momentum20d },
    { score: foreignFlow, weight: VN_FEAR_GREED_WEIGHTS.foreignFlow },
  ])

  return {
    advanceDecline,
    volumeBreadth,
    momentum20d,
    foreignFlow,
    composite,
  }
}
