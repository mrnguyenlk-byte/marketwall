import { spark, toTrend } from "@/lib/market-utils"
import type {
  NormalizedMarketQuote,
  OverviewCategory,
  OverviewListItem,
  TickerBarItem,
} from "@/lib/market-types"

function seedFromSymbol(symbol: string): number {
  return symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
}

type QuoteOverlay = {
  price: number
  changePercent: number
  trend: ReturnType<typeof toTrend>
}

function toOverlay(quote: NormalizedMarketQuote): QuoteOverlay {
  return {
    price: quote.price,
    changePercent: quote.changePercent,
    trend: toTrend(quote.changePercent),
  }
}

export function buildMarketQuoteMap(
  quotes: NormalizedMarketQuote[],
): Map<string, QuoteOverlay> {
  return new Map(quotes.map((q) => [q.symbol, toOverlay(q)]))
}

function applyOverlay<T extends TickerBarItem | OverviewListItem>(
  item: T,
  map: Map<string, QuoteOverlay>,
): T {
  const overlay = map.get(item.symbol)
  if (!overlay) return item
  return {
    ...item,
    price: overlay.price,
    changePercent: overlay.changePercent,
    trend: overlay.trend,
    sparkline: spark(seedFromSymbol(item.symbol), 14, overlay.trend === "up" ? 1 : -1),
  }
}

export function mergeMarketQuotesIntoTickerItems(
  items: TickerBarItem[],
  quotes: NormalizedMarketQuote[],
): TickerBarItem[] {
  const map = buildMarketQuoteMap(quotes)
  return items.map((item) => applyOverlay(item, map))
}

export function mergeMarketQuotesIntoOverview(
  overviewByCategory: Record<OverviewCategory, OverviewListItem[]>,
  quotes: NormalizedMarketQuote[],
): Record<OverviewCategory, OverviewListItem[]> {
  const map = buildMarketQuoteMap(quotes)
  return Object.fromEntries(
    (Object.entries(overviewByCategory) as [OverviewCategory, OverviewListItem[]][]).map(
      ([category, items]) => [category, items.map((item) => applyOverlay(item, map))],
    ),
  ) as Record<OverviewCategory, OverviewListItem[]>
}
