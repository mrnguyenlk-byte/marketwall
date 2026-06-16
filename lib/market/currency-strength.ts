import "server-only"

import {
  buildCurrencyStrengthSnapshot,
  resolveStrengthCoverage,
  type StrengthCoverage,
} from "@/lib/currency-strength"
import { getMockStrengths } from "@/lib/providers/currency-provider"
import { getForexPairsForCurrencyStrength } from "@/lib/forex/pairs-provider"
import type { CurrencyStrengthQuote } from "@/types/market"

const LIVE_CURRENCIES = new Set(["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF"])

function toStrengthRows(
  currencies: ReturnType<typeof buildCurrencyStrengthSnapshot>["currencies"],
): CurrencyStrengthQuote[] {
  return currencies
    .filter((c) => LIVE_CURRENCIES.has(c.code))
    .map((c) => ({
      currency: c.code,
      strength: c.strength,
      change: c.changePercent,
      label: c.rankKey,
    }))
}

function mockStrengthRows(): CurrencyStrengthQuote[] {
  try {
    return getMockStrengths()
      .filter((c) => LIVE_CURRENCIES.has(c.code))
      .map((c) => ({
        currency: c.code,
        strength: c.strength,
        change: c.changePercent,
        label: c.rankKey,
      }))
  } catch {
    return []
  }
}

export type CurrencyStrengthDataSource = "yahoo" | "yahoo+ecb" | "mock"

export type CurrencyStrengthFetchResult = {
  items: CurrencyStrengthQuote[]
  source: CurrencyStrengthDataSource
  unavailable: boolean
  pairCount: number
  coverage: StrengthCoverage
}

/** Fetch live FX pairs and calculate currency strength scores. */
export async function fetchLiveCurrencyStrength(): Promise<CurrencyStrengthFetchResult> {
  try {
    const { pairs: livePairs, source: fxSource } = await getForexPairsForCurrencyStrength()

    const referenceInputs = livePairs.map((pair) => ({
      symbol: pair.symbol,
      price: pair.price,
      changePercent: pair.changePercent,
      updatedAt: pair.updatedAt,
    }))

    const snapshot = buildCurrencyStrengthSnapshot(referenceInputs)
    const pairCount = snapshot.pairsUsed.length
    const coverage = resolveStrengthCoverage(pairCount)

    console.log(`[currency-strength] pairs=${pairCount} coverage=${coverage}`)

    const rows = toStrengthRows(snapshot.currencies)
    const unavailable = rows.length < LIVE_CURRENCIES.size

    if (unavailable) {
      console.warn(
        `[currency-strength] unavailable pairCount=${pairCount} items=${rows.length} reason=${pairCount === 0 ? "fx_provider_zero_pairs" : "strength_rows_incomplete"}`,
      )
    }

    return { items: rows, source: fxSource, unavailable, pairCount, coverage }
  } catch {
    return {
      items: [],
      source: "mock",
      unavailable: true,
      pairCount: 0,
      coverage: "unavailable",
    }
  }
}

/** Explicit mock snapshot for API error fallback (marked unavailable). */
export function fetchMockCurrencyStrength(): CurrencyStrengthFetchResult {
  const rows = mockStrengthRows()
  return {
    items: rows,
    source: "mock",
    unavailable: true,
    pairCount: rows.length > 0 ? 28 : 0,
    coverage: rows.length > 0 ? "ideal" : "unavailable",
  }
}
