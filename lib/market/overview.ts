import "server-only"

import { OVERVIEW_SYMBOLS } from "@/config/market-symbols"
import { getMockData as getGlobalMock } from "@/lib/providers/global-market-provider"
import { getMockData as getCryptoMock } from "@/lib/providers/crypto-provider"
import { getMockData as getVietnamMock } from "@/lib/providers/vietnam-market-provider"
import { REFERENCE_PAIR_QUOTES } from "@/lib/currency-strength/types"
import { getOverviewQuotes } from "@/lib/twelvedata/client"
import type { MarketQuote } from "@/types/market"
import { round2 } from "./normalize"

function buildMockQuotes(): MarketQuote[] {
  try {
    const global = getGlobalMock()
    const crypto = getCryptoMock()
    const vietnam = getVietnamMock()
    const quotes: MarketQuote[] = []

    for (const q of global.quotes) {
      quotes.push({
        symbol: q.symbol,
        name: q.name,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        open: q.price,
        high: q.price,
        low: q.price,
        volume: 0,
        updatedAt: q.updatedAt,
      })
    }

    for (const asset of crypto.assets) {
      if (asset.symbol !== "BTC" && asset.symbol !== "ETH") continue
      const change = round2((asset.price * asset.change24h) / 100)
      quotes.push({
        symbol: `${asset.symbol}/USD`,
        name: asset.name,
        price: asset.price,
        change,
        changePercent: round2(asset.change24h),
        open: asset.price,
        high: asset.price,
        low: asset.price,
        volume: asset.volume24h,
        updatedAt: new Date().toISOString(),
      })
    }

    for (const index of vietnam.indices) {
      quotes.push({
        symbol: index.symbol,
        name: typeof index.name === "string" ? index.name : index.name.en,
        price: index.price,
        change: index.change,
        changePercent: index.changePercent,
        open: index.price,
        high: index.price,
        low: index.price,
        volume: index.volume,
        updatedAt: index.updatedAt,
      })
    }

    const fxDisplay: Record<string, string> = {
      EURUSD: "EUR/USD",
      GBPUSD: "GBP/USD",
      USDJPY: "USD/JPY",
      AUDUSD: "AUD/USD",
      NZDUSD: "NZD/USD",
      USDCHF: "USD/CHF",
      USDCAD: "USD/CAD",
    }

    for (const [symbol, ref] of Object.entries(REFERENCE_PAIR_QUOTES)) {
      const display = fxDisplay[symbol]
      if (!display) continue
      const change = round2((ref.price * ref.changePercent) / 100)
      quotes.push({
        symbol: display,
        name: display,
        price: ref.price,
        change,
        changePercent: round2(ref.changePercent),
        open: ref.price,
        high: ref.price,
        low: ref.price,
        volume: 0,
        updatedAt: new Date().toISOString(),
      })
    }

    return quotes
  } catch {
    return []
  }
}

function mergeWithFallback(live: MarketQuote[], mock: MarketQuote[]): MarketQuote[] {
  const bySymbol = new Map<string, MarketQuote>()
  for (const quote of mock) bySymbol.set(quote.symbol, quote)
  for (const quote of live) bySymbol.set(quote.symbol, quote)

  const orderedSymbols = OVERVIEW_SYMBOLS.map((d) => d.displaySymbol)
  const extraSymbols = ["VN100", "HNX-INDEX", "UPCOM-INDEX", "DOW JONES", "WTI OIL"]
  return [...orderedSymbols, ...extraSymbols]
    .map((symbol) => bySymbol.get(symbol))
    .filter((q): q is MarketQuote => q != null)
}

/** Fetch live overview quotes with per-symbol mock fallback. */
export async function fetchMarketsOverview(): Promise<{
  quotes: MarketQuote[]
  source: "live" | "mock"
  unavailable: boolean
}> {
  try {
    const mock = buildMockQuotes()
    const live = await getOverviewQuotes()

    const quotes = mergeWithFallback(live, mock)
    const hasLive = live.length >= 3

    return {
      quotes,
      source: hasLive ? "live" : "mock",
      unavailable: !hasLive && mock.length === 0,
    }
  } catch {
    const mock = buildMockQuotes()
    return {
      quotes: mock,
      source: "mock",
      unavailable: mock.length === 0,
    }
  }
}

export function getMockOverviewQuotes(): MarketQuote[] {
  return buildMockQuotes()
}
