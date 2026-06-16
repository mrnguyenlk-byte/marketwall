import "server-only"

import type { FxPairQuote } from "@/lib/forex/types"
import { getForexPairsForCurrencyStrength as getTwelveDataForexPairs } from "@/lib/twelvedata/client"

export type { FxPairQuote } from "@/lib/forex/types"

/**
 * Forex pair quotes for currency strength (28-pair model).
 *
 * Primary: Twelve Data batch `/quote` API.
 * Alpha Vantage (`lib/alphavantage/client.ts`) is retained for reference only —
 * not wired here (free tier unsuitable for 28-pair production use).
 */
export async function getForexPairsForCurrencyStrength(): Promise<FxPairQuote[]> {
  if (process.env.TWELVE_DATA_API_KEY?.trim()) {
    return getTwelveDataForexPairs()
  }
  return []
}
