import { spark, toTrend, type Trend } from "@/lib/market-utils"
import { buildCryptoAssetQuoteMap } from "@/lib/crypto-market-merge"
import { buildGlobalQuoteMap } from "@/lib/global-market-merge"
import { buildVietnamMarketIndexQuoteMap } from "@/lib/vietnam-market-merge"
import type { CryptoAsset } from "@/lib/providers/crypto-provider"
import type { GlobalQuote } from "@/lib/providers/global-market-provider"
import type { VietnamMarketIndex } from "@/lib/providers/vietnam-market-provider"
import {
  WATCHLIST_CATALOG,
  type WatchlistSymbol,
} from "@/lib/watchlist"

export type WatchlistQuote = {
  price: number
  changePercent: number
  trend: Trend
  sparkline: number[]
}

const WATCHLIST_QUOTE_KEYS: Record<WatchlistSymbol, string[]> = {
  VNINDEX: ["VNINDEX", "VN-INDEX"],
  VN30: ["VN30"],
  BTCUSD: ["BTCUSD", "BTC", "BTC/USD"],
  GOLD: ["GOLD"],
  SP500: ["SP500", "S&P 500"],
  NASDAQ: ["NASDAQ"],
}

function seedFromSymbol(symbol: string): number {
  return WATCHLIST_CATALOG[symbol as WatchlistSymbol]?.seed
    ?? symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
}

function mockQuote(symbol: WatchlistSymbol): WatchlistQuote {
  const entry = WATCHLIST_CATALOG[symbol]
  const trend = toTrend(entry.mockChangePercent)
  return {
    price: entry.mockPrice,
    changePercent: entry.mockChangePercent,
    trend,
    sparkline: spark(entry.seed, 20, trend === "up" ? 1 : -1),
  }
}

function lookupQuote(
  symbol: WatchlistSymbol,
  map: Map<string, { price: number; changePercent: number; trend: Trend }>,
): WatchlistQuote | null {
  for (const key of WATCHLIST_QUOTE_KEYS[symbol]) {
    const overlay = map.get(key)
    if (!overlay) continue

    return {
      price: overlay.price,
      changePercent: overlay.changePercent,
      trend: overlay.trend,
      sparkline: spark(seedFromSymbol(symbol), 20, overlay.trend === "up" ? 1 : -1),
    }
  }

  return null
}

export function buildWatchlistQuoteMap(
  symbols: WatchlistSymbol[],
  options?: {
    vietnamIndices?: VietnamMarketIndex[]
    globalQuotes?: GlobalQuote[]
    cryptoAssets?: CryptoAsset[]
  },
): Map<WatchlistSymbol, WatchlistQuote> {
  const merged = new Map<string, { price: number; changePercent: number; trend: Trend }>()

  if (options?.vietnamIndices) {
    for (const [key, overlay] of buildVietnamMarketIndexQuoteMap(options.vietnamIndices)) {
      merged.set(key, overlay)
    }
  }

  if (options?.globalQuotes) {
    for (const [key, overlay] of buildGlobalQuoteMap(options.globalQuotes)) {
      merged.set(key, overlay)
    }
  }

  if (options?.cryptoAssets) {
    for (const [key, overlay] of buildCryptoAssetQuoteMap(options.cryptoAssets)) {
      merged.set(key, overlay)
    }
  }

  const result = new Map<WatchlistSymbol, WatchlistQuote>()

  for (const symbol of symbols) {
    result.set(symbol, lookupQuote(symbol, merged) ?? mockQuote(symbol))
  }

  return result
}
