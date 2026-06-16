import "server-only"

import { buildCurrencyStrengthSnapshot } from "@/lib/currency-strength"
import { REFERENCE_PAIR_QUOTES } from "@/lib/currency-strength/types"
import { getMockStrengths } from "@/lib/providers/currency-provider"

import { fetchTwelveDataFxPair } from "./twelveData"
import type { CurrencyStrengthRow } from "./types"

/** FX pairs used to derive cross-currency strength. */
export const STRENGTH_FX_PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "AUD/USD",
  "NZD/USD",
  "USD/JPY",
  "USD/CHF",
  "USD/CAD",
] as const

const LIVE_CURRENCIES = new Set(["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF"])

function toStrengthRows(
  currencies: ReturnType<typeof buildCurrencyStrengthSnapshot>["currencies"],
): CurrencyStrengthRow[] {
  return currencies
    .filter((c) => LIVE_CURRENCIES.has(c.code))
    .map((c) => ({
      currency: c.code,
      strength: c.strength,
      change: c.changePercent,
      label: c.rankKey,
    }))
}

function mockStrengthRows(): CurrencyStrengthRow[] {
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
  items: CurrencyStrengthRow[]
  source: "live" | "mock"
}> {
  try {
    const pairResults = await Promise.all(
      STRENGTH_FX_PAIRS.map(async (pair) => {
        try {
          return await fetchTwelveDataFxPair(pair)
        } catch {
          return null
        }
      }),
    )

    const livePairs = pairResults.filter(
      (p): p is NonNullable<typeof p> => p != null,
    )

    if (livePairs.length < 4) {
      return { items: mockStrengthRows(), source: "mock" }
    }

    const referenceInputs = STRENGTH_FX_PAIRS.map((pair) => {
      const symbol = pair.replace("/", "")
      const live = livePairs.find((p) => p.symbol === symbol)
      if (live) {
        return {
          symbol,
          price: live.price,
          changePercent: live.changePercent,
          updatedAt: live.updatedAt,
        }
      }

      const ref = REFERENCE_PAIR_QUOTES[symbol as keyof typeof REFERENCE_PAIR_QUOTES]
      return ref
        ? { symbol, price: ref.price, changePercent: ref.changePercent }
        : null
    }).filter((p): p is NonNullable<typeof p> => p != null)

    const snapshot = buildCurrencyStrengthSnapshot(referenceInputs)
    const rows = toStrengthRows(snapshot.currencies)
    return rows.length
      ? { items: rows, source: "live" }
      : { items: mockStrengthRows(), source: "mock" }
  } catch {
    return { items: mockStrengthRows(), source: "mock" }
  }
}
