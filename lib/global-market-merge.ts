import { spark, toTrend } from "@/lib/market-utils"
import type { GlobalQuote } from "@/lib/providers/global-market-provider"
import type {
  OverviewCategory,
  OverviewListItem,
  TickerBarItem,
} from "@/lib/providers/market-provider"

function seedFromSymbol(symbol: string): number {
  return symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
}

type QuoteOverlay = {
  price: number
  changePercent: number
  trend: ReturnType<typeof toTrend>
}

function toOverlay(quote: GlobalQuote): QuoteOverlay {
  return {
    price: quote.price,
    changePercent: quote.changePercent,
    trend: toTrend(quote.changePercent),
  }
}

export function buildGlobalQuoteMap(quotes: GlobalQuote[]): Map<string, QuoteOverlay> {
  return new Map(quotes.map((q) => [q.symbol, toOverlay(q)]))
}

export function mergeGlobalQuotesIntoTickerItems(
  items: TickerBarItem[],
  quotes: GlobalQuote[],
): TickerBarItem[] {
  const map = buildGlobalQuoteMap(quotes)
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

export function mergeGlobalQuotesIntoOverview(
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>,
  quotes: GlobalQuote[],
): Record<OverviewCategory, OverviewListItem[]> {
  const map = buildGlobalQuoteMap(quotes)
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
