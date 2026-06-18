import "server-only"

import type { FearGreedReason } from "@/lib/fear-greed"
import { foreignFlowScore } from "@/lib/fear-greed/breadth"
import {
  linearToScore,
  momentumToScore,
  roundScore,
  weightedComposite,
} from "@/lib/fear-greed/normalize"
import { fetchVnindexIndexContext } from "@/lib/fear-greed/momentum"
import type {
  VietnamHeatmapStock,
  VietnamMarketDashboard,
  VietnamMarketIndex,
} from "@/lib/providers/vietnam-market-provider"
import type { VietnamMarketAnalytics } from "@/lib/vietnam/market-analytics"
import { vnSectorGroupForAsset } from "@/lib/vietnam/vn-sector-map"
import { VN_SECTOR_GROUP_ORDER } from "@/lib/vietnam/sector-groups"
import type { MarketAsset } from "@/types/market"

export const VN_FEAR_GREED_WEIGHTS = {
  momentum: 0.2,
  breadth: 0.2,
  liquidity: 0.15,
  sectorParticipation: 0.15,
  foreignFlow: 0.15,
  volatility: 0.15,
} as const

export type VietnamFearGreedInput = {
  heatmapStocks: {
    hose: VietnamHeatmapStock[]
    hnx: VietnamHeatmapStock[]
    upcom: VietnamHeatmapStock[]
  }
  dashboard: VietnamMarketDashboard
  analytics: VietnamMarketAnalytics
  indices?: VietnamMarketIndex[]
  /** Optional pre-fetched VNINDEX context; fetched live when omitted. */
  indexContext?: Awaited<ReturnType<typeof fetchVnindexIndexContext>> | null
}

export type VietnamFearGreedBreakdown = {
  momentum: number
  breadth: number
  liquidity: number
  sectorParticipation: number
  foreignFlow: number
  volatility: number
  composite: number
  reasons: FearGreedReason[]
}

const FLAT_THRESHOLD = 0.05

function flattenStocks(input: VietnamFearGreedInput): VietnamHeatmapStock[] {
  return [...input.heatmapStocks.hose, ...input.heatmapStocks.hnx, ...input.heatmapStocks.upcom]
}

function findVnindex(input: VietnamFearGreedInput): VietnamMarketIndex | null {
  return input.indices?.find((i) => i.symbol.toUpperCase() === "VNINDEX") ?? null
}

function momentumScore(
  dailyChange: number,
  momentum20d: number | null,
  ma20: number | null,
  ma50: number | null,
  lastClose: number | null,
): number {
  const dailyScore = momentumToScore(dailyChange, 3)

  const trendParts: number[] = [dailyScore]
  if (momentum20d != null) trendParts.push(momentumToScore(momentum20d, 10))

  if (lastClose != null && lastClose > 0) {
    if (ma20 != null && ma20 > 0) {
      const aboveMa20Pct = ((lastClose - ma20) / ma20) * 100
      trendParts.push(momentumToScore(aboveMa20Pct, 5))
    }
    if (ma50 != null && ma50 > 0) {
      const aboveMa50Pct = ((lastClose - ma50) / ma50) * 100
      trendParts.push(momentumToScore(aboveMa50Pct, 8))
    }
  }

  const total = trendParts.reduce((sum, s) => sum + s, 0)
  return roundScore(total / trendParts.length)
}

function breadthScore(analytics: VietnamMarketAnalytics): number {
  const { breadth } = analytics
  if (!breadth.available) return 50

  const total = breadth.advancingCount + breadth.decliningCount
  if (total === 0) return 50
  return roundScore((breadth.advancingCount / total) * 100)
}

function liquidityScore(analytics: VietnamMarketAnalytics): number {
  const { liquidity } = analytics
  if (!liquidity.available) return 50

  const prev = liquidity.previousSessionValue
  if (prev == null || prev <= 0) return 50

  const ratioPct = ((liquidity.totalValue - prev) / prev) * 100
  return momentumToScore(ratioPct, 25)
}

function sectorParticipationScore(stocks: VietnamHeatmapStock[]): number {
  const bySector = new Map<string, { sum: number; count: number }>()

  for (const stock of stocks) {
    if (stock.price <= 0) continue
    const asset = { symbol: stock.symbol, sector: stock.sector } as MarketAsset
    const group = vnSectorGroupForAsset(asset)
    const row = bySector.get(group) ?? { sum: 0, count: 0 }
    row.sum += stock.changePercent
    row.count += 1
    bySector.set(group, row)
  }

  const sectors = VN_SECTOR_GROUP_ORDER.filter((id) => bySector.has(id))
  if (sectors.length === 0) return 50

  let positive = 0
  for (const id of sectors) {
    const row = bySector.get(id)!
    const avg = row.sum / row.count
    if (avg > FLAT_THRESHOLD) positive += 1
  }

  return roundScore((positive / sectors.length) * 100)
}

function foreignFlowComponent(analytics: VietnamMarketAnalytics): number {
  const { foreignFlow } = analytics
  if (!foreignFlow.available) return 50
  return foreignFlowScore(foreignFlow.buyValue, foreignFlow.sellValue)
}

function volatilityScore(
  indexRangePct: number | null,
  stocks: VietnamHeatmapStock[],
): number {
  let rangePct = indexRangePct

  if (rangePct == null) {
    const live = stocks.filter((s) => s.price > 0)
    if (live.length === 0) return 50
    const avgAbs =
      live.reduce((sum, s) => sum + Math.abs(s.changePercent), 0) / live.length
    rangePct = avgAbs * 2
  }

  // Lower intraday range → higher greed score.
  const fearFromRange = linearToScore(rangePct, 0.4, 3.5)
  return roundScore(100 - fearFromRange)
}

function fmtPct(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(digits)}%`
}

function buildReasons(input: {
  dailyChange: number
  momentum20d: number | null
  ma20: number | null
  lastClose: number | null
  breadth: VietnamMarketAnalytics["breadth"]
  liquidity: VietnamMarketAnalytics["liquidity"]
  sectorPositivePct: number
  foreignNetValue: number
  rangePct: number | null
  components: Array<{ key: string; score: number; vi: string; en: string }>
}): FearGreedReason[] {
  const reasons: FearGreedReason[] = []

  const vnindex = input.dailyChange
  reasons.push({
    vi: `VNINDEX ${fmtPct(vnindex)} trong phiên${input.momentum20d != null ? `, momentum 20 phiên ${fmtPct(input.momentum20d)}` : ""}`,
    en: `VNINDEX ${fmtPct(vnindex)} today${input.momentum20d != null ? `, 20D momentum ${fmtPct(input.momentum20d)}` : ""}`,
  })

  if (input.ma20 != null && input.lastClose != null && input.lastClose > 0) {
    const rel = ((input.lastClose - input.ma20) / input.ma20) * 100
    reasons.push({
      vi: `Giá VNINDEX ${rel >= 0 ? "trên" : "dưới"} MA20 (${fmtPct(rel)})`,
      en: `VNINDEX ${rel >= 0 ? "above" : "below"} MA20 (${fmtPct(rel)})`,
    })
  }

  if (input.breadth.available) {
    const total = input.breadth.advancingCount + input.breadth.decliningCount
    const greenRatio = total > 0 ? (input.breadth.advancingCount / total) * 100 : 50
    reasons.push({
      vi: `Độ rộng: ${input.breadth.advancingCount} mã tăng / ${input.breadth.decliningCount} mã giảm (${greenRatio.toFixed(0)}% tăng)`,
      en: `Breadth: ${input.breadth.advancingCount} advancers / ${input.breadth.decliningCount} decliners (${greenRatio.toFixed(0)}% green)`,
    })
  }

  if (input.liquidity.available && input.liquidity.previousSessionValue != null) {
    const prev = input.liquidity.previousSessionValue
    const delta =
      prev > 0 ? ((input.liquidity.totalValue - prev) / prev) * 100 : 0
    reasons.push({
      vi: `Thanh khoản GTGD ${delta >= 0 ? "cao hơn" : "thấp hơn"} phiên trước ${fmtPct(delta)}`,
      en: `Turnover ${delta >= 0 ? "above" : "below"} prior session ${fmtPct(delta)}`,
    })
  }

  reasons.push({
    vi: `${input.sectorPositivePct.toFixed(0)}% nhóm ngành dẫn dắt tăng giá`,
    en: `${input.sectorPositivePct.toFixed(0)}% sector groups closing higher`,
  })

  if (input.foreignNetValue !== 0) {
    reasons.push({
      vi: `Khối ngoại ${input.foreignNetValue > 0 ? "mua ròng" : "bán ròng"} ${Math.abs(input.foreignNetValue).toLocaleString("vi-VN")} VND`,
      en: `Foreign ${input.foreignNetValue > 0 ? "net buy" : "net sell"} ${Math.abs(input.foreignNetValue).toLocaleString("en-US")} VND`,
    })
  }

  if (input.rangePct != null) {
    reasons.push({
      vi: `Biên độ intraday VNINDEX ${input.rangePct.toFixed(2)}%`,
      en: `VNINDEX intraday range ${input.rangePct.toFixed(2)}%`,
    })
  }

  if (reasons.length >= 2) return reasons.slice(0, 4)

  const fallback = input.components
    .map((c) => ({ vi: c.vi, en: c.en, delta: Math.abs(c.score - 50) }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 4 - reasons.length)
    .map(({ vi, en }) => ({ vi, en }))

  return [...reasons, ...fallback].slice(0, 4)
}

export async function computeVietnamFearGreed(
  input: VietnamFearGreedInput,
): Promise<VietnamFearGreedBreakdown> {
  const stocks = flattenStocks(input)
  const vnindex = findVnindex(input)
  const dailyChange = vnindex?.changePercent ?? 0

  const indexContext =
    input.indexContext === undefined
      ? await fetchVnindexIndexContext("VNINDEX")
      : input.indexContext

  const momentum = momentumScore(
    dailyChange,
    indexContext?.momentum20d ?? null,
    indexContext?.ma20 ?? null,
    indexContext?.ma50 ?? null,
    indexContext?.lastClose ?? vnindex?.price ?? null,
  )

  const breadth = breadthScore(input.analytics)
  const liquidity = liquidityScore(input.analytics)
  const sectorParticipation = sectorParticipationScore(stocks)
  const foreignFlow = foreignFlowComponent(input.analytics)
  const volatility = volatilityScore(indexContext?.intradayRangePct ?? null, stocks)

  const composite = weightedComposite([
    { score: momentum, weight: VN_FEAR_GREED_WEIGHTS.momentum },
    { score: breadth, weight: VN_FEAR_GREED_WEIGHTS.breadth },
    { score: liquidity, weight: VN_FEAR_GREED_WEIGHTS.liquidity },
    { score: sectorParticipation, weight: VN_FEAR_GREED_WEIGHTS.sectorParticipation },
    { score: foreignFlow, weight: VN_FEAR_GREED_WEIGHTS.foreignFlow },
    { score: volatility, weight: VN_FEAR_GREED_WEIGHTS.volatility },
  ])

  const sectorPositivePct = sectorParticipation

  const reasons = buildReasons({
    dailyChange,
    momentum20d: indexContext?.momentum20d ?? null,
    ma20: indexContext?.ma20 ?? null,
    lastClose: indexContext?.lastClose ?? vnindex?.price ?? null,
    breadth: input.analytics.breadth,
    liquidity: input.analytics.liquidity,
    sectorPositivePct,
    foreignNetValue: input.analytics.foreignFlow.netValue,
    rangePct: indexContext?.intradayRangePct ?? null,
    components: [
      {
        key: "momentum",
        score: momentum,
        vi: `Xu hướng VNINDEX (${momentum}/100)`,
        en: `VNINDEX trend score (${momentum}/100)`,
      },
      {
        key: "breadth",
        score: breadth,
        vi: `Độ rộng thị trường (${breadth}/100)`,
        en: `Market breadth (${breadth}/100)`,
      },
      {
        key: "liquidity",
        score: liquidity,
        vi: `Thanh khoản so với trung bình (${liquidity}/100)`,
        en: `Liquidity vs average (${liquidity}/100)`,
      },
      {
        key: "sectors",
        score: sectorParticipation,
        vi: `Sự tham gia của các ngành (${sectorParticipation}/100)`,
        en: `Sector participation (${sectorParticipation}/100)`,
      },
      {
        key: "foreign",
        score: foreignFlow,
        vi: `Dòng khối ngoại (${foreignFlow}/100)`,
        en: `Foreign flow (${foreignFlow}/100)`,
      },
      {
        key: "volatility",
        score: volatility,
        vi: `Biến động intraday (${volatility}/100)`,
        en: `Intraday volatility (${volatility}/100)`,
      },
    ],
  })

  return {
    momentum,
    breadth,
    liquidity,
    sectorParticipation,
    foreignFlow,
    volatility,
    composite,
    reasons,
  }
}
