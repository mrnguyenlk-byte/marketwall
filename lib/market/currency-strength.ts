import "server-only"

import { CURRENCY_STRENGTH_PAIRS } from "@/config/market-symbols"
import { buildCurrencyStrengthSnapshot } from "@/lib/currency-strength"
import { getMockStrengths } from "@/lib/providers/currency-provider"
import { getForexPairsForCurrencyStrength } from "@/lib/twelvedata/client"
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

/** Fetch live FX pairs and calculate currency strength scores. */
export async function fetchLiveCurrencyStrength(): Promise<{
  items: CurrencyStrengthQuote[]
  source: "live" | "mock"
  unavailable: boolean
}> {
  try {
    const livePairs = await getForexPairsForCurrencyStrength()

    const referenceInputs = livePairs.map((pair) => ({
      symbol: pair.symbol,
      price: pair.price,
      changePercent: pair.changePercent,
      updatedAt: pair.updatedAt,
    }))

    const snapshot = buildCurrencyStrengthSnapshot(referenceInputs)

    if (!snapshot.available) {
      return { items: [], source: "live", unavailable: true }
    }

    const rows = toStrengthRows(snapshot.currencies)
    return rows.length === LIVE_CURRENCIES.size
      ? { items: rows, source: "live", unavailable: false }
      : { items: [], source: "live", unavailable: true }
  } catch {
    return { items: [], source: "mock", unavailable: true }
  }
}

/** Explicit mock snapshot for API error fallback (marked unavailable). */
export function fetchMockCurrencyStrength(): {
  items: CurrencyStrengthQuote[]
  source: "mock"
  unavailable: boolean
} {
  const rows = mockStrengthRows()
  return { items: rows, source: "mock", unavailable: true }
}
