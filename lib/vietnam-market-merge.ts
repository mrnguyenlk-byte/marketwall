import { spark, toTrend, type Bi } from "@/lib/market-utils"
import type { HeatmapMarket } from "@/lib/providers/heatmap-provider"
import type {
  OverviewCategory,
  OverviewListItem,
  TickerBarItem,
} from "@/lib/providers/market-provider"
import type { VietnamMarketIndex } from "@/lib/providers/vietnam-market-provider"

/** Maps provider symbols to legacy dashboard symbols used in ticker / overview mock data. */
export const VIETNAM_SYMBOL_ALIASES: Record<string, string> = {
  VNINDEX: "VN-INDEX",
  HNX: "HNX-INDEX",
  UPCOM: "UPCOM-INDEX",
}

function seedFromSymbol(symbol: string): number {
  return symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
}

type QuoteOverlay = {
  price: number
  changePercent: number
  trend: ReturnType<typeof toTrend>
}

function indexToOverlay(index: VietnamMarketIndex): QuoteOverlay {
  return {
    price: index.price,
    changePercent: index.changePercent,
    trend: toTrend(index.changePercent),
  }
}

export function buildVietnamMarketIndexQuoteMap(indices: VietnamMarketIndex[]): Map<string, QuoteOverlay> {
  const map = new Map<string, QuoteOverlay>()
  for (const index of indices) {
    const overlay = indexToOverlay(index)
    map.set(index.symbol, overlay)
    const alias = VIETNAM_SYMBOL_ALIASES[index.symbol]
    if (alias) map.set(alias, overlay)
  }
  return map
}

/** @deprecated Use buildVietnamMarketIndexQuoteMap */
export const buildVietnamIndexQuoteMap = buildVietnamMarketIndexQuoteMap

export function mergeVietnamIndicesIntoTickerItems(
  items: TickerBarItem[],
  indices: VietnamMarketIndex[],
): TickerBarItem[] {
  const map = buildVietnamMarketIndexQuoteMap(indices)
  return items.map((item) => {
    const overlay = map.get(item.symbol)
    if (!overlay) return item
    return {
      ...item,
      price: overlay.price,
      changePercent: overlay.changePercent,
      trend: overlay.trend,
      sparkline: spark(seedFromSymbol(item.symbol), 14, overlay.trend === "up" ? 1 : -1),
    }
  })
}

export function mergeVietnamIndicesIntoOverview(
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>,
  indices: VietnamMarketIndex[],
): Record<OverviewCategory, OverviewListItem[]> {
  const map = buildVietnamMarketIndexQuoteMap(indices)
  return Object.fromEntries(
    (Object.entries(overviewByCategory) as [OverviewCategory, OverviewListItem[]][]).map(
      ([category, items]) => [
        category,
        items.map((item) => {
          const overlay = map.get(item.symbol)
          if (!overlay) return item
          return {
            ...item,
            price: overlay.price,
            changePercent: overlay.changePercent,
            trend: overlay.trend,
            sparkline: spark(seedFromSymbol(item.symbol), 14, overlay.trend === "up" ? 1 : -1),
          }
        }),
      ],
    ),
  ) as Record<OverviewCategory, OverviewListItem[]>
}

export function mergeVietnamHeatmapIntoMarkets(
  markets: HeatmapMarket[],
  heatmapMarket: HeatmapMarket,
): HeatmapMarket[] {
  return markets.map((market) => (market.id === "vn" ? heatmapMarket : market))
}

export type VietnamOverviewIndex = {
  symbol: string
  name: Bi
  flag: string
  price: number
  changePercent: number
  trend: ReturnType<typeof toTrend>
  sparkline: number[]
}

export function vietnamIndicesToOverviewItems(indices: VietnamMarketIndex[]): VietnamOverviewIndex[] {
  return indices.map((index) => {
    const trend = toTrend(index.changePercent)
    return {
      symbol: VIETNAM_SYMBOL_ALIASES[index.symbol] ?? index.symbol,
      name: index.name,
      flag: "🇻🇳",
      price: index.price,
      changePercent: index.changePercent,
      trend,
      sparkline: spark(seedFromSymbol(index.symbol), 14, trend === "up" ? 1 : -1),
    }
  })
}
