import { buildStrengthSeries } from "@/lib/currency-strength/calculate-strength"

/** Client-safe currency strength mock (no provider/cache imports). */

export type CurrencyStrengthMockItem = {
  code: string
  strength: number
  rankKey: string
  series: number[]
}

export type CurrencyStrengthChartMeta = {
  timezone: string
  timeLabels: string[]
}

export const currencyStrengthChartMeta: CurrencyStrengthChartMeta = {
  timezone: "UTC",
  timeLabels: ["Open", "Close"],
}

const MOCK_STRENGTHS: Omit<CurrencyStrengthMockItem, "series">[] = [
  { code: "USD", strength: 52.4, rankKey: "strength.strongest" },
  { code: "EUR", strength: 51.1, rankKey: "strength.veryStrong" },
  { code: "GBP", strength: 50.8, rankKey: "strength.strong" },
  { code: "JPY", strength: 49.6, rankKey: "strength.neutral" },
  { code: "AUD", strength: 48.9, rankKey: "strength.neutral" },
  { code: "CHF", strength: 49.2, rankKey: "strength.neutral" },
  { code: "CAD", strength: 48.5, rankKey: "strength.weak" },
  { code: "NZD", strength: 47.8, rankKey: "strength.weakest" },
]

export const currencyStrengthItems: CurrencyStrengthMockItem[] = MOCK_STRENGTHS.map(
  (item) => ({
    ...item,
    series: buildStrengthSeries(item.strength),
  }),
)
