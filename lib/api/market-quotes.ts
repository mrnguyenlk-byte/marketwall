import "server-only"

import { getMockData as getGlobalMock } from "@/lib/providers/global-market-provider"
import { getMockData as getCryptoMock } from "@/lib/providers/crypto-provider"
import { getMockData as getVietnamMock } from "@/lib/providers/vietnam-market-provider"
import { REFERENCE_PAIR_QUOTES } from "@/lib/currency-strength/types"

import { fetchTwelveDataQuotes, type TwelveDataSymbolDef } from "./twelveData"
import type { NormalizedMarketQuote } from "./types"

/** Twelve Data symbol definitions for the unified quotes feed. */
export const MARKET_QUOTE_DEFS: TwelveDataSymbolDef[] = [
  { apiSymbol: "XAU/USD", displaySymbol: "GOLD", name: "Gold" },
  { apiSymbol: "XAG/USD", displaySymbol: "SILVER", name: "Silver" },
  { apiSymbol: "EUR/USD", displaySymbol: "EUR/USD", name: "EUR/USD" },
  { apiSymbol: "USD/JPY", displaySymbol: "USD/JPY", name: "USD/JPY" },
  { apiSymbol: "GBP/USD", displaySymbol: "GBP/USD", name: "GBP/USD" },
  { apiSymbol: "AUD/USD", displaySymbol: "AUD/USD", name: "AUD/USD" },
  { apiSymbol: "NZD/USD", displaySymbol: "NZD/USD", name: "NZD/USD" },
  { apiSymbol: "USD/CHF", displaySymbol: "USD/CHF", name: "USD/CHF" },
  { apiSymbol: "USD/CAD", displaySymbol: "USD/CAD", name: "USD/CAD" },
  { apiSymbol: "BTC/USD", displaySymbol: "BTC/USD", name: "Bitcoin" },
  { apiSymbol: "ETH/USD", displaySymbol: "ETH/USD", name: "Ethereum" },
]

function round2(value: number): number {
  return Number(value.toFixed(2))
}

function buildMockQuotes(): NormalizedMarketQuote[] {
  try {
    const global = getGlobalMock()
    const crypto = getCryptoMock()
    const vietnam = getVietnamMock()

    const quotes: NormalizedMarketQuote[] = []

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

    const vnIndex = vietnam.indices.find((i) => i.symbol === "VN-INDEX")
    if (vnIndex) {
      quotes.push({
        symbol: "VN-INDEX",
        name: "VN-Index",
        price: vnIndex.price,
        change: vnIndex.change,
        changePercent: vnIndex.changePercent,
        open: vnIndex.price,
        high: vnIndex.price,
        low: vnIndex.price,
        volume: vnIndex.volume,
        updatedAt: vnIndex.updatedAt,
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

function mergeWithFallback(
  live: NormalizedMarketQuote[],
  mock: NormalizedMarketQuote[],
): NormalizedMarketQuote[] {
  const bySymbol = new Map<string, NormalizedMarketQuote>()

  for (const quote of mock) {
    bySymbol.set(quote.symbol, quote)
  }

  for (const quote of live) {
    bySymbol.set(quote.symbol, quote)
  }

  const orderedSymbols = [
    ...MARKET_QUOTE_DEFS.map((d) => d.displaySymbol),
    "VN-INDEX",
  ]

  return orderedSymbols
    .map((symbol) => bySymbol.get(symbol))
    .filter((q): q is NormalizedMarketQuote => q != null)
}

/** Fetch live market quotes with per-symbol mock fallback. */
export async function fetchMarketQuotes(): Promise<{
  quotes: NormalizedMarketQuote[]
  source: "live" | "mock"
}> {
  try {
    const mock = buildMockQuotes()
    const live = await fetchTwelveDataQuotes(MARKET_QUOTE_DEFS)

    const vnIndex = mock.find((q) => q.symbol === "VN-INDEX")
    if (vnIndex) live.push(vnIndex)

    const quotes = mergeWithFallback(live, mock)
    const hasLive = live.length > 0 && live.some((q) => {
      const mockQ = mock.find((m) => m.symbol === q.symbol)
      return !mockQ || mockQ.price !== q.price
    })

    return {
      quotes,
      source: hasLive ? "live" : "mock",
    }
  } catch {
    return { quotes: buildMockQuotes(), source: "mock" }
  }
}

export function getMockMarketQuotes(): NormalizedMarketQuote[] {
  return buildMockQuotes()
}
