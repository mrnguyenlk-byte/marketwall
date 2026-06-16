import "server-only"

import { CURRENCY_STRENGTH_PAIRS } from "@/config/market-symbols"
import type { FxPairQuote } from "@/lib/forex/types"
import { fetchEcbFxPairQuotes } from "@/lib/providers/ecb-fx"
import { logForexPairsProvider } from "@/lib/providers/provider-diagnostics"
import { fetchYahooFxPairQuotes } from "@/lib/providers/yahoo-finance"

export type { FxPairQuote } from "@/lib/forex/types"

const PAIR_LIST = [...CURRENCY_STRENGTH_PAIRS]

function pairKey(symbol: string): string {
  return symbol.replace("/", "").toUpperCase()
}

function mergeFxQuotes(primary: FxPairQuote[], secondary: FxPairQuote[]): FxPairQuote[] {
  const merged = new Map<string, FxPairQuote>()
  for (const quote of secondary) merged.set(pairKey(quote.symbol), quote)
  for (const quote of primary) merged.set(pairKey(quote.symbol), quote)
  return PAIR_LIST.map((pair) => merged.get(pairKey(pair))).filter(
    (row): row is FxPairQuote => row != null,
  )
}

/**
 * Forex pair quotes for currency strength (28-pair model).
 *
 * Primary: Yahoo Finance chart API (no key, no per-request credits).
 * Fallback: ECB daily euro reference rates for any pairs Yahoo misses.
 *
 * Twelve Data removed in Sprint 9 — free tier unusable at production scale.
 */
export async function getForexPairsForCurrencyStrength(): Promise<FxPairQuote[]> {
  const [yahooPairs, ecbPairs] = await Promise.all([
    fetchYahooFxPairQuotes(PAIR_LIST),
    fetchEcbFxPairQuotes(PAIR_LIST),
  ])

  const pairs = mergeFxQuotes(yahooPairs, ecbPairs)
  const source =
    ecbPairs.length > 0 && pairs.length > yahooPairs.length ? "yahoo+ecb" : "yahoo"

  logForexPairsProvider({
    keyConfigured: true,
    pairCount: pairs.length,
    reason: pairs.length === 0 ? "yahoo_and_ecb_returned_zero_pairs" : source,
  })

  return pairs
}
