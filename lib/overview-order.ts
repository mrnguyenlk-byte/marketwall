import type { OverviewListItem } from "@/lib/providers/market-provider"

/** Preferred display order for the indices overview tab. */
export const INDICES_TAB_SYMBOL_ORDER = [
  "VN-INDEX",
  "VN30",
  "VN10",
  "HNX-INDEX",
  "UPCOM-INDEX",
  "S&P 500",
  "NASDAQ",
  "DOW JONES",
  "GOLD",
  "WTI OIL",
  "BTC/USD",
  "ETH/USD",
] as const

export function reorderIndicesTab(items: OverviewListItem[]): OverviewListItem[] {
  const bySymbol = new Map(items.map((item) => [item.symbol, item]))
  const ordered = INDICES_TAB_SYMBOL_ORDER.map((symbol) => bySymbol.get(symbol)).filter(
    (item): item is OverviewListItem => item != null,
  )
  const orderSet = new Set<string>(INDICES_TAB_SYMBOL_ORDER)
  const rest = items.filter((item) => !orderSet.has(item.symbol))
  return [...ordered, ...rest]
}
