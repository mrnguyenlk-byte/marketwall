import type { NormalizedMarketQuote } from "@/lib/market-types"
import type { RealtimeQuoteEvent } from "@/lib/realtime/types"

function round2(value: number): number {
  return Number(value.toFixed(2))
}

/** Apply a live tick onto a REST quote row (keeps open from REST for change %). */
export function mergeQuoteWithRealtime(
  quote: NormalizedMarketQuote,
  tick: RealtimeQuoteEvent,
): NormalizedMarketQuote {
  const open = quote.open > 0 ? quote.open : quote.price
  const change = round2(tick.price - open)
  const changePercent =
    open > 0 ? round2(((tick.price - open) / open) * 100) : tick.changePercent

  return {
    ...quote,
    price: tick.price,
    change,
    changePercent,
    updatedAt: tick.updatedAt,
  }
}

/** Overlay realtime ticks onto a REST quote list. */
export function mergeQuotesWithRealtime(
  quotes: NormalizedMarketQuote[],
  tickBySymbol: ReadonlyMap<string, RealtimeQuoteEvent>,
): NormalizedMarketQuote[] {
  if (tickBySymbol.size === 0) return quotes

  return quotes.map((quote) => {
    const tick =
      tickBySymbol.get(quote.symbol) ??
      tickBySymbol.get(quote.symbol.replace("/", ""))
    if (!tick) return quote
    return mergeQuoteWithRealtime(quote, tick)
  })
}

/** Overlay price/change on heatmap-style rows. */
export function mergeHeatmapPriceWithRealtime<
  T extends { symbol: string; price: number; changePercent: number },
>(rows: T[], tickBySymbol: ReadonlyMap<string, RealtimeQuoteEvent>): T[] {
  if (tickBySymbol.size === 0) return rows

  return rows.map((row) => {
    const tick =
      tickBySymbol.get(row.symbol) ??
      tickBySymbol.get(`${row.symbol}/USD`) ??
      tickBySymbol.get(row.symbol.toUpperCase())
    if (!tick) return row

    const open =
      row.price > 0 && row.changePercent !== 0
        ? row.price / (1 + row.changePercent / 100)
        : row.price
    const changePercent =
      open > 0 ? round2(((tick.price - open) / open) * 100) : tick.changePercent

    return {
      ...row,
      price: tick.price,
      changePercent,
    }
  })
}
